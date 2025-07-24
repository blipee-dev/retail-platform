#!/usr/bin/env node

const { SupabaseClient } = require('./lib/supabase-client');
const { SensorClient } = require('./lib/sensor-client');
const { ParallelCollector } = require('./lib/parallel-collector');

/**
 * Main sensor data collection script for GitHub Actions
 */
async function main() {
  console.log('🚀 Starting Sensor Data Collection');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'production'}`);
  
  const supabase = new SupabaseClient();
  const results = {
    successful: 0,
    failed: 0,
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

    // Group sensors by type
    const sensorsByType = sensors.reduce((acc, sensor) => {
      const type = sensor.sensor_type || 'milesight';
      if (!acc[type]) acc[type] = [];
      acc[type].push(sensor);
      return acc;
    }, {});

    // Process each sensor type
    for (const [type, typeSensors] of Object.entries(sensorsByType)) {
      console.log(`\n📊 Processing ${typeSensors.length} ${type} sensors...`);
      
      const collector = new ParallelCollector({
        concurrency: 5,
        batchSize: 10
      });

      const typeResults = await collector.collect(typeSensors, async (sensor) => {
        return processSensor(sensor, type, supabase);
      });

      // Aggregate results
      typeResults.forEach(result => {
        if (result.success) {
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
    console.log(`  📊 Success Rate: ${((results.successful / results.total) * 100).toFixed(1)}%`);
    
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

  // Exit with error only if all sensors failed
  if (results.failed > 0 && results.successful === 0) {
    console.log('\n❌ All sensors failed - exiting with error');
    process.exit(1);
  }
}

/**
 * Process individual sensor
 */
async function processSensor(sensor, type, supabase) {
  const startTime = Date.now();
  console.log(`  Processing ${sensor.sensor_name} (${sensor.sensor_id})...`);

  try {
    // Create sensor client
    const client = new SensorClient(type);
    
    // Collect data
    const result = await client.collect(sensor);
    
    if (result.success) {
      // Save to database
      let recordsInserted = 0;
      let recordsUpdated = 0;
      
      if (type === 'milesight' || type === 'milesight_people_counter') {
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

      // Log health
      await supabase.logSensorHealth(
        sensor.sensor_id,  // Use sensor_id string for health log
        'online',
        result.responseTime,
        recordsInserted + recordsUpdated
      );

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
    process.exit(1);
  });
}

module.exports = { main };