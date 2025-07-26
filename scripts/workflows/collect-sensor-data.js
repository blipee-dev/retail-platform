#!/usr/bin/env node

const { SupabaseClient } = require('./lib/supabase-client');
const { SensorClient } = require('./lib/sensor-client');
const { ParallelCollector } = require('./lib/parallel-collector');
const { RetryHandler } = require('./lib/retry-handler');
const { CircuitBreaker } = require('./lib/circuit-breaker');

/**
 * Main sensor data collection script for GitHub Actions
 */
async function main() {
  console.log('🚀 Starting Sensor Data Collection');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'production'}`);
  
  const supabase = new SupabaseClient();
  const circuitBreaker = new CircuitBreaker(supabase, {
    failureThreshold: 5,
    recoveryTimeout: 3600000  // 1 hour
  });
  
  const results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    errors: [],
    sensors: []
  };

  try {
    // Get active sensors
    console.log('\n📡 Fetching active sensors...');
    const sensors = await supabase.getActiveSensors();
    results.total = sensors.length;
    console.log(`  Found ${sensors.length} active sensors`);

    if (sensors.length === 0) {
      console.log('⚠️  No active sensors found');
      return results;
    }

    // All sensors are now standardized as milesight_sensor
    // Group all sensors together for processing
    const sensorsByType = {
      'milesight': sensors
    };

    // Process each sensor type
    for (const [type, typeSensors] of Object.entries(sensorsByType)) {
      console.log(`\n📊 Processing ${typeSensors.length} ${type} sensors...`);
      
      const collector = new ParallelCollector({
        concurrency: 5,
        batchSize: 10
      });

      const typeResults = await collector.collect(typeSensors, async (sensor) => {
        return processSensor(sensor, type, supabase, circuitBreaker);
      });

      // Aggregate results
      typeResults.forEach(result => {
        if (result.skipped) {
          results.skipped++;
        } else if (result.success) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({
            sensor: result.sensor,
            error: result.error
          });
        }
        results.sensors.push(result);
      });
    }

    // Summary
    console.log('\n📈 Collection Summary:');
    console.log(`  ✅ Successful: ${results.successful}`);
    console.log(`  ❌ Failed: ${results.failed}`);
    console.log(`  ⏭️  Skipped (circuit open): ${results.skipped}`);
    console.log(`  📊 Success Rate: ${results.total > 0 ? ((results.successful / (results.total - results.skipped)) * 100).toFixed(1) : 0}% (excluding skipped)`);
    
    // Calculate totals
    const totalInserted = results.sensors.reduce((sum, s) => sum + (s.recordsInserted || 0), 0);
    const totalUpdated = results.sensors.reduce((sum, s) => sum + (s.recordsUpdated || 0), 0);
    const totalRecords = results.sensors.reduce((sum, s) => sum + (s.records || 0), 0);
    
    if (totalRecords > 0) {
      console.log(`  📦 Records: ${totalInserted} new, ${totalUpdated} updated (${totalRecords} total)`);
    }

    // Log errors if any
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(({ sensor, error }) => {
        console.log(`  - ${sensor}: ${error}`);
      });
    }

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    results.errors.push({ sensor: 'system', error: error.message });
  }

  // Output results for GitHub Actions
  console.log('\n📤 GitHub Actions Output:');
  if (process.env.GITHUB_OUTPUT) {
    const fs = require('fs');
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `successful=${results.successful}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `failed=${results.failed}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `total=${results.total}\n`);
  } else {
    // Fallback for local testing
    console.log(`successful=${results.successful}`);
    console.log(`failed=${results.failed}`);
    console.log(`total=${results.total}`);
  }

  // Always exit successfully to allow pipeline to continue
  // Even with no data, we want analytics to run (it might process historical data)
}

/**
 * Process individual sensor
 */
async function processSensor(sensor, type, supabase, circuitBreaker) {
  const startTime = Date.now();
  console.log(`  Processing ${sensor.sensor_name} (${sensor.sensor_id})...`);

  // Check circuit breaker state
  const circuitStatus = await circuitBreaker.shouldProcessSensor(sensor);
  
  if (!circuitStatus.shouldProcess) {
    console.log(`    ⚡ Circuit breaker ${circuitStatus.state}: ${circuitStatus.reason}`);
    return {
      success: false,
      skipped: true,
      sensor: sensor.sensor_name,
      sensorId: sensor.sensor_id,
      reason: circuitStatus.reason,
      circuitState: circuitStatus.state
    };
  }

  const isRecoveryAttempt = circuitStatus.state === 'HALF_OPEN';
  if (isRecoveryAttempt) {
    console.log(`    🔄 Circuit breaker HALF_OPEN: ${circuitStatus.reason}`);
  }

  try {
    // Create sensor client - always use 'milesight' for client creation
    const client = new SensorClient('milesight');
    
    // Create retry handler with sensor-specific settings
    const retryHandler = new RetryHandler({
      maxRetries: 3,
      initialDelay: 2000,  // Start with 2 seconds
      maxDelay: 10000,     // Max 10 seconds between retries
      backoff: 'exponential'
    });
    
    // Collect data with retry logic
    const result = await retryHandler.execute(
      async () => client.collect(sensor),
      { sensorName: sensor.sensor_name, sensorId: sensor.sensor_id }
    );
    
    if (result.success) {
      // Save to database
      let recordsInserted = 0;
      let recordsUpdated = 0;
      
      if (type === 'milesight' || type === 'milesight_sensor' || type === 'milesight_people_counter') {
        // Insert each record
        if (Array.isArray(result.data) && result.data.length > 0) {
          console.log(`    📦 Processing ${result.data.length} records...`);
          
          for (const record of result.data) {
            try {
              // Remove internal tracking fields before insert
              const recordToInsert = { ...record };
              delete recordToInsert._original_timestamp;
              delete recordToInsert._utc_timestamp;
              
              const insertResult = await supabase.insertSensorData(recordToInsert);
              if (insertResult.action === 'inserted') {
                recordsInserted++;
              } else {
                recordsUpdated++;
              }
            } catch (insertError) {
              console.log(`    ⚠️  Failed to process record: ${insertError.message}`);
            }
          }
        }
      } else if (type === 'omnia') {
        await supabase.insertRegionalData(result.data);
        recordsInserted = Array.isArray(result.data) ? result.data.length : 1;
      }

      // Update sensor health
      await supabase.updateSensorHealth(sensor.sensor_id, {
        status: 'online',
        lastDataReceived: new Date().toISOString(),
        consecutiveFailures: 0,
        offlineSince: null
      });

      // Reset circuit breaker on success
      await circuitBreaker.handleSuccess(sensor.sensor_id);

      // Log health
      await supabase.logSensorHealth(
        sensor.sensor_id,  // Use sensor_id string for health log
        'online',
        result.responseTime,
        recordsInserted + recordsUpdated
      );

      // Update latest sensor data timestamp
      if (Array.isArray(result.data) && result.data.length > 0) {
        // Get the most recent timestamp from collected data
        const timestamps = result.data.map(r => new Date(r.timestamp)).filter(d => !isNaN(d));
        if (timestamps.length > 0) {
          const latestTimestamp = new Date(Math.max(...timestamps));
          await supabase.updateLatestSensorData(
            sensor.sensor_id,
            latestTimestamp.toISOString(),
            recordsInserted + recordsUpdated
          );
        }
      }

      const totalProcessed = recordsInserted + recordsUpdated;
      if (totalProcessed > 0) {
        console.log(`    ✅ Success (${result.responseTime}ms) - ${recordsInserted} new, ${recordsUpdated} updated`);
      } else {
        console.log(`    ✅ Success (${result.responseTime}ms) - No new data`);
      }
      
      return {
        success: true,
        sensor: sensor.sensor_name,
        sensorId: sensor.sensor_id,
        responseTime: result.responseTime,
        records: totalProcessed,
        recordsInserted: recordsInserted,
        recordsUpdated: recordsUpdated
      };
      
    } else {
      // Handle failure
      const newFailureCount = (sensor.consecutive_failures || 0) + 1;
      
      // Update sensor health
      await supabase.updateSensorHealth(sensor.sensor_id, {
        status: newFailureCount >= 3 ? 'offline' : 'warning',
        consecutiveFailures: newFailureCount,
        offlineSince: newFailureCount === 3 ? new Date().toISOString() : sensor.offline_since
      });

      // Update circuit breaker state
      await circuitBreaker.handleFailure(sensor, isRecoveryAttempt);

      // Log health as offline/warning
      await supabase.logSensorHealth(
        sensor.sensor_id,
        newFailureCount >= 3 ? 'offline' : 'warning',
        result.responseTime || 0,
        0  // No records collected on failure
      );

      // Update latest sensor data with failed check
      await supabase.updateLatestSensorData(
        sensor.sensor_id,
        sensor.last_data_received || null,  // Keep last successful timestamp
        0  // No records collected
      );

      // Create alert if critical
      if (newFailureCount === 3) {
        await supabase.createAlert({
          organizationId: sensor.stores.organizations.id,
          storeId: sensor.store_id,
          sensorId: sensor.sensor_id,
          type: 'sensor',
          severity: 'high',
          title: 'Sensor Offline',
          description: `Sensor ${sensor.sensor_name} has gone offline after ${newFailureCount} consecutive failures`,
          metadata: {
            error: result.error,
            workflowRun: process.env.GITHUB_RUN_ID,
            lastSuccessful: sensor.last_data_received
          }
        });
      }

      console.log(`    ❌ Failed: ${result.error}`);
      
      return {
        success: false,
        sensor: sensor.sensor_name,
        sensorId: sensor.sensor_id,
        error: result.error,
        consecutiveFailures: newFailureCount
      };
    }
    
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    
    return {
      success: false,
      sensor: sensor.name,
      sensorId: sensor.sensor_id,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
    // Set outputs even on fatal error
    console.log('\n📤 GitHub Actions Output:');
    console.log('successful=0');
    console.log('failed=0');
    console.log('total=0');
    
    if (process.env.GITHUB_ACTIONS && process.env.GITHUB_OUTPUT) {
      const fs = require('fs');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, 'successful=0\nfailed=0\ntotal=0\n');
    }
    // Exit successfully to allow pipeline to continue
  });
}

module.exports = { main };