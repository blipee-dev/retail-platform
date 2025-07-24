#!/usr/bin/env node

/**
 * Collect regional data from Omnia sensors
 * Modular implementation with proper timezone handling and business hours filtering
 */

const { SupabaseClient } = require('./lib/supabase-client');
const { SensorClient } = require('./lib/sensor-client');
const config = require('./lib/config');
const pLimit = require('p-limit');

async function collectRegionalData() {
  console.log('🗺️  Starting Regional Data Collection');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log(`🔧 Environment: ${config.environment}\n`);

  const startTime = Date.now();
  const results = {
    successful: 0,
    failed: 0,
    total: 0,
    errors: {}
  };

  try {
    // Initialize Supabase client
    const supabase = new SupabaseClient();
    
    // Get active Omnia sensors (only these support regional counting)
    console.log('📡 Fetching active Omnia sensors...');
    const sensors = await supabase.getActiveSensors();
    const omniaSensors = sensors.filter(s => s.sensor_type === 'omnia');
    
    console.log(`  Found ${omniaSensors.length} active Omnia sensors\n`);
    
    if (omniaSensors.length === 0) {
      console.log('⚠️  No active Omnia sensors found');
      return results;
    }
    
    // Process sensors with concurrency limit
    const limit = pLimit(config.sensors.omnia.concurrency);
    console.log(`📊 Processing ${omniaSensors.length} sensors...`);
    
    const promises = omniaSensors.map(sensor => 
      limit(async () => {
        console.log(`  Processing ${sensor.sensor_name} (${sensor.sensor_id})...`);
        
        try {
          // Get sensor's timezone and check business hours
          const timezone = sensor.stores?.timezone || 'UTC';
          const client = new SensorClient('omnia');
          const localTime = client.getLocalTime(timezone);
          
          console.log(`    📍 Store timezone: ${timezone}`);
          console.log(`    🕐 Local time: ${localTime.formatted}`);
          
          // Check business hours (9 AM to 1 AM)
          if (localTime.localHour >= 1 && localTime.localHour < 9) {
            console.log(`    ⏰ Outside business hours (${localTime.localHour}:00 local time). Skipping.`);
            results.successful++;
            return;
          }
          
          // Collect regional data
          const result = await collectSensorRegionalData(sensor, supabase);
          
          if (result.success) {
            console.log(`    ✅ Success: ${result.recordsCollected} records collected`);
            results.successful++;
            
            // Update sensor health
            await supabase.updateSensorHealth(sensor.sensor_id, {
              status: 'online',
              lastDataReceived: new Date().toISOString(),
              consecutiveFailures: 0,
              offlineSince: null
            });
            
            // Log to health history
            await supabase.logSensorHealth(
              sensor.id,
              'online',
              result.responseTime,
              result.recordsCollected
            );
          } else {
            console.log(`    ❌ Failed: ${result.error}`);
            results.failed++;
            results.errors[sensor.sensor_id] = result.error;
            
            // Update sensor health
            const currentFailures = sensor.consecutive_failures || 0;
            await supabase.updateSensorHealth(sensor.sensor_id, {
              status: currentFailures >= 2 ? 'offline' : 'warning',
              consecutiveFailures: currentFailures + 1,
              offlineSince: currentFailures >= 2 ? new Date().toISOString() : sensor.offline_since
            });
            
            // Create alert if sensor is now offline
            if (currentFailures === 2) {
              await supabase.createAlert({
                organizationId: sensor.stores?.organizations?.id,
                storeId: sensor.store_id,
                sensorId: sensor.id,
                type: 'sensor_offline',
                severity: 'high',
                title: `Sensor ${sensor.sensor_name} is offline`,
                description: `Regional data collection failed 3 times consecutively`,
                metadata: { sensor_id: sensor.sensor_id, error: result.error }
              });
            }
          }
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
          results.failed++;
          results.errors[sensor.sensor_id] = error.message;
        }
      })
    );
    
    await Promise.all(promises);
    results.total = omniaSensors.length;
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    // Set outputs even on fatal error
    const results = { successful: 0, failed: 0, total: 0, errors: {} };
    console.log('\n📤 GitHub Actions Output:');
    console.log(`successful=${results.successful}`);
    console.log(`failed=${results.failed}`);
    console.log(`total=${results.total}`);
    
    if (process.env.GITHUB_ACTIONS && process.env.GITHUB_OUTPUT) {
      const fs = require('fs');
      const output = [
        `successful=${results.successful}`,
        `failed=${results.failed}`,
        `total=${results.total}`
      ].join('\n');
      fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
    }
    // Exit successfully to allow pipeline to continue
    return;
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n📈 Collection Summary:');
  console.log(`  ✅ Successful: ${results.successful}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  📊 Success Rate: ${((results.successful / results.total) * 100).toFixed(1)}%`);
  console.log(`  ⏱️  Duration: ${duration}s\n`);
  
  if (Object.keys(results.errors).length > 0) {
    console.log('❌ Errors:');
    Object.entries(results.errors).forEach(([sensorId, error]) => {
      console.log(`  - ${sensorId}: ${error}`);
    });
    console.log('');
  }
  
  // GitHub Actions output
  console.log('📤 GitHub Actions Output:');
  console.log(`successful=${results.successful}`);
  console.log(`failed=${results.failed}`);
  console.log(`total=${results.total}`);
  
  // Set outputs for GitHub Actions
  if (process.env.GITHUB_ACTIONS) {
    const fs = require('fs');
    const output = [
      `successful=${results.successful}`,
      `failed=${results.failed}`,
      `total=${results.total}`
    ].join('\n');
    
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, output + '\n');
    } else {
      console.log(`::set-output name=successful::${results.successful}`);
      console.log(`::set-output name=failed::${results.failed}`);
      console.log(`::set-output name=total::${results.total}`);
    }
  }
  
  // Always exit successfully to allow pipeline to continue
  // Even with no data, we want analytics to run (it might process historical data)
}

/**
 * Collect regional data from a single sensor
 */
async function collectSensorRegionalData(sensor, supabase) {
  const startTime = Date.now();
  
  try {
    const client = new SensorClient('omnia');
    
    // Get current time and calculate query range
    const now = new Date();
    const timezone = sensor.stores?.timezone || 'UTC';
    const localTime = client.getLocalTime(timezone, now);
    
    // Round to complete hour periods
    const queryEndTime = new Date(localTime.localTime);
    queryEndTime.setMinutes(59, 59, 999);
    
    // Query last 3 hours
    const queryStartTime = new Date(localTime.localTime.getTime() - 3 * 60 * 60 * 1000);
    queryStartTime.setMinutes(0, 0, 0);
    
    console.log(`    📍 Querying from: ${formatLocalTime(queryStartTime)} to ${formatLocalTime(queryEndTime)}`);
    
    // Format dates for API
    const formatDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    // Build endpoint for regional data
    const endpoint = `/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&region1=1&region2=1&region3=1&region4=1&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
    
    const response = await client.fetchData(sensor, endpoint);
    
    if (typeof response === 'string' && response.includes(',')) {
      // Parse CSV response
      const lines = response.trim().split('\n');
      if (lines.length < 2) {
        return { success: true, recordsCollected: 0, responseTime: Date.now() - startTime };
      }
      
      // Parse headers to find region columns
      const headers = lines[0].split(',').map(h => h.trim());
      const regionColumns = {};
      
      headers.forEach((header, index) => {
        const match = header.match(/^Region(\d+)$/i);
        if (match) {
          const regionNum = parseInt(match[1]);
          if (regionNum >= 1 && regionNum <= 4) {
            regionColumns[`region${regionNum}`] = index;
          }
        }
      });
      
      if (Object.keys(regionColumns).length === 0) {
        return { 
          success: false, 
          error: 'No regional columns found in data',
          responseTime: Date.now() - startTime 
        };
      }
      
      console.log(`    📊 Found ${Object.keys(regionColumns).length} regions in data`);
      
      // Parse data lines
      const records = [];
      let skippedFuture = 0;
      let skippedOld = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        // Parse timestamps as local time
        const sensorTimestamp = new Date(values[0].replace(/\//g, '-'));
        const sensorEndTime = new Date(values[1].replace(/\//g, '-'));
        
        // Skip future data
        if (sensorTimestamp > localTime.localTime) {
          console.log(`      ⏭️  Skipping future record: ${formatLocalTime(sensorTimestamp)}`);
          skippedFuture++;
          continue;
        }
        
        // Skip data older than 3 hours
        if (sensorTimestamp < queryStartTime) {
          skippedOld++;
          continue;
        }
        
        // Convert to UTC for storage
        const offsetHours = Math.round((localTime.localTime.getTime() - now.getTime()) / (60 * 60 * 1000));
        const utcTimestamp = new Date(sensorTimestamp.getTime() - (offsetHours * 60 * 60 * 1000));
        const utcEndTime = new Date(sensorEndTime.getTime() - (offsetHours * 60 * 60 * 1000));
        
        // Extract regional counts
        const regionCounts = {};
        let hasData = false;
        
        Object.entries(regionColumns).forEach(([regionKey, columnIndex]) => {
          const regionNum = regionKey.replace('region', '');
          const count = parseInt(values[columnIndex]) || 0;
          regionCounts[`region${regionNum}_count`] = count;
          if (count > 0) hasData = true;
        });
        
        // Only insert if we have data
        if (hasData) {
          records.push({
            sensor_id: sensor.id,
            store_id: sensor.store_id,
            organization_id: sensor.stores?.organizations?.id,
            timestamp: utcTimestamp.toISOString(),
            end_time: utcEndTime.toISOString(),
            ...regionCounts
          });
        }
      }
      
      if (skippedFuture > 0 || skippedOld > 0) {
        console.log(`      📊 Filtered: ${skippedFuture} future, ${skippedOld} old records`);
      }
      
      // Insert records with duplicate checking
      console.log(`    📦 Processing ${records.length} records...`);
      let inserted = 0;
      let updated = 0;
      
      for (const record of records) {
        try {
          // Check if record exists
          const { data: existing } = await supabase.client
            .from('regional_counting_raw')
            .select('id')
            .eq('sensor_id', record.sensor_id)
            .eq('timestamp', record.timestamp)
            .single();
          
          if (existing) {
            // Update existing record
            const { error } = await supabase.client
              .from('regional_counting_raw')
              .update(record)
              .eq('id', existing.id);
            
            if (!error) updated++;
          } else {
            // Insert new record
            const { error } = await supabase.client
              .from('regional_counting_raw')
              .insert(record);
            
            if (!error) inserted++;
          }
        } catch (err) {
          // Continue on error
        }
      }
      
      console.log(`      ✅ Processed: ${inserted} new, ${updated} updated`);
      
      return {
        success: true,
        recordsCollected: records.length,
        responseTime: Date.now() - startTime
      };
      
    } else {
      return {
        success: false,
        error: 'No data or unexpected format',
        responseTime: Date.now() - startTime
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Format local time for display
 */
function formatLocalTime(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Run collection
if (require.main === module) {
  collectRegionalData();
}

module.exports = { collectRegionalData };