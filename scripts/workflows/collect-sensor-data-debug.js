#!/usr/bin/env node

const { SupabaseClient } = require('./lib/supabase-client');
const { SensorClient } = require('./lib/sensor-client');
const { ParallelCollector } = require('./lib/parallel-collector');

/**
 * DEBUG VERSION - Main sensor data collection script with extra logging
 */
async function main() {
  console.log('🚀 DEBUG: Starting Sensor Data Collection');
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
    
    // Debug: Show sensor details
    console.log('\n🔍 DEBUG - Sensor details:');
    sensors.forEach(s => {
      console.log(`  - ${s.sensor_name}: id=${s.id}, sensor_id=${s.sensor_id}, store_id=${s.store_id}`);
    });

    if (sensors.length === 0) {
      console.log('⚠️  No active sensors found');
      return results;
    }

    // Process first sensor only for debugging
    console.log('\n🔍 DEBUG - Processing first sensor only...');
    const sensor = sensors[0];
    const result = await processSensor(sensor, 'milesight', supabase);
    
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

  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    results.errors.push({ sensor: 'system', error: error.message });
  }

  // Output results
  console.log('\n📤 Results:', JSON.stringify(results, null, 2));
}

/**
 * Process individual sensor with debug logging
 */
async function processSensor(sensor, type, supabase) {
  const startTime = Date.now();
  console.log(`\n🔍 DEBUG - Processing ${sensor.sensor_name} (${sensor.sensor_id})...`);
  console.log(`  Sensor UUID: ${sensor.id}`);
  console.log(`  Store ID: ${sensor.store_id}`);
  console.log(`  Organization: ${sensor.stores?.organizations?.id}`);

  try {
    // Create sensor client
    const client = new SensorClient('milesight');
    
    // Collect data
    const result = await client.collect(sensor);
    
    console.log(`\n🔍 DEBUG - Collection result:`);
    console.log(`  Success: ${result.success}`);
    console.log(`  Records collected: ${result.data?.length || 0}`);
    
    if (result.success && result.data?.length > 0) {
      console.log(`\n🔍 DEBUG - First record sample:`);
      const firstRecord = result.data[0];
      console.log(JSON.stringify(firstRecord, null, 2));
      
      // Process only first record for debugging
      console.log(`\n🔍 DEBUG - Attempting to insert first record...`);
      
      try {
        // Remove internal tracking fields before insert
        const recordToInsert = { ...firstRecord };
        delete recordToInsert._original_timestamp;
        delete recordToInsert._utc_timestamp;
        
        console.log(`\n🔍 DEBUG - Record to insert:`);
        console.log(JSON.stringify(recordToInsert, null, 2));
        
        const insertResult = await supabase.insertSensorData(recordToInsert);
        console.log(`\n🔍 DEBUG - Insert result:`, insertResult);
        
      } catch (insertError) {
        console.log(`\n❌ DEBUG - Insert error:`, insertError);
        console.log(`  Error message: ${insertError.message}`);
        console.log(`  Error details:`, insertError);
      }
    }
    
    return {
      success: result.success,
      sensor: sensor.sensor_name,
      sensorId: sensor.sensor_id,
      error: result.error
    };
    
  } catch (error) {
    console.log(`\n❌ DEBUG - Processing error:`, error);
    return {
      success: false,
      sensor: sensor.sensor_name,
      sensorId: sensor.sensor_id,
      error: error.message
    };
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Unhandled error:', error);
  });
}

module.exports = { main };