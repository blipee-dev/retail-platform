#!/usr/bin/env node

const { SupabaseClient } = require('../workflows/lib/supabase-client');
const { SensorClient } = require('../workflows/lib/sensor-client');
const pLimit = require('p-limit');

// Initialize clients
const supabase = new SupabaseClient();

// Configuration
const START_DATE = '2025-07-01';
const END_DATE = new Date().toISOString().split('T')[0];
const CONCURRENT_REQUESTS = 3;

async function collectRegionalDataRange() {
  console.log('🗺️  Regional Data Collection - July 1st to Now');
  console.log('=' .repeat(60));
  console.log(`📅 Date range: ${START_DATE} 00:00:00 to ${END_DATE} 23:59:59`);
  console.log('');
  
  try {
    // Get all Omnia sensors
    const omniaSensors = await supabase.getActiveSensors('omnia');
    console.log(`📡 Found ${omniaSensors.length} Omnia sensors\n`);
    
    if (omniaSensors.length === 0) {
      console.log('❌ No active Omnia sensors found');
      return;
    }
    
    // Process each day
    const startDate = new Date(START_DATE);
    const endDate = new Date(END_DATE);
    let currentDate = new Date(startDate);
    
    let totalRecords = 0;
    let totalDays = 0;
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`\n📅 Processing ${dateStr}...`);
      
      let dayRecords = 0;
      
      // Process each sensor for this day
      const limit = pLimit(CONCURRENT_REQUESTS);
      const promises = omniaSensors.map(sensor => 
        limit(async () => {
          try {
            // Set up date range for full day in sensor's timezone
            const dayStart = new Date(dateStr + 'T00:00:00');
            const dayEnd = new Date(dateStr + 'T23:59:59');
            
            console.log(`  🔍 ${sensor.sensor_name} (${sensor.ip_address})`);
            
            // Create sensor client for this sensor type
            const sensorClient = new SensorClient(sensor.sensor_type);
            
            // Get sensor timezone info
            const timezone = sensor.timezone || 'UTC';
            const { localTime } = sensorClient.getLocalTime(timezone, dayStart);
            
            // Format dates for sensor query
            const startStr = formatSensorDate(dayStart);
            const endStr = formatSensorDate(dayEnd);
            
            // Build URL for regional data
            const url = `http://${sensor.ip_address}/dataloader.cgi?` +
              `dw=regionalcountlogcsv&` +
              `report_type=0&` +
              `statistics_type=3&` +
              `region1=1&region2=1&region3=1&region4=1&` +
              `time_start=${startStr}&` +
              `time_end=${endStr}`;
            
            console.log(`    📍 Querying: ${startStr} to ${endStr}`);
            
            // Fetch data
            const response = await sensorClient.fetchWithRetry(url, sensor.sensor_type);
            const csvData = await response.text();
            
            // Parse CSV
            const lines = csvData.trim().split('\\n');
            if (lines.length < 2) {
              console.log('    ⚠️  No data returned');
              return 0;
            }
            
            // Process data lines (skip header)
            const records = [];
            let skippedFuture = 0;
            
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              if (values.length < 7) continue;
              
              // Parse timestamp
              const timestamp = new Date(values[0].replace(/\\//g, '-'));
              const endTime = new Date(values[1].replace(/\\//g, '-'));
              
              // Skip future data
              if (timestamp > new Date()) {
                skippedFuture++;
                continue;
              }
              
              // Create record
              const record = {
                sensor_id: sensor.id,
                store_id: sensor.store_id,
                timestamp: timestamp.toISOString(),
                end_time: endTime.toISOString(),
                region1_count: parseInt(values[2]) || 0,
                region2_count: parseInt(values[3]) || 0,
                region3_count: parseInt(values[4]) || 0,
                region4_count: parseInt(values[5]) || 0,
                created_at: new Date().toISOString()
              };
              
              records.push(record);
            }
            
            if (records.length > 0) {
              // Insert in batches
              const BATCH_SIZE = 100;
              for (let i = 0; i < records.length; i += BATCH_SIZE) {
                const batch = records.slice(i, i + BATCH_SIZE);
                await supabase.insertRegionalData(batch);
              }
              
              console.log(`    ✅ Inserted ${records.length} records` + 
                (skippedFuture > 0 ? ` (skipped ${skippedFuture} future)` : ''));
              return records.length;
            } else {
              console.log('    ⚠️  No valid records found');
              return 0;
            }
            
          } catch (error) {
            console.log(`    ❌ Error: ${error.message}`);
            return 0;
          }
        })
      );
      
      const results = await Promise.all(promises);
      dayRecords = results.reduce((sum, count) => sum + count, 0);
      totalRecords += dayRecords;
      
      console.log(`  📊 Day total: ${dayRecords} records`);
      
      totalDays++;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Summary
    console.log('\\n' + '=' .repeat(60));
    console.log('✅ Regional Data Collection Complete!');
    console.log(`📊 Total records inserted: ${totalRecords}`);
    console.log(`📅 Days processed: ${totalDays}`);
    console.log(`📈 Average per day: ${Math.round(totalRecords / totalDays)}`);
    
  } catch (error) {
    console.error('\\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Helper function to format date for sensor query
function formatSensorDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}-${hour}:${minute}:${second}`;
}

// Add to SupabaseClient
if (!SupabaseClient.prototype.insertRegionalData) {
  SupabaseClient.prototype.insertRegionalData = async function(records) {
    const { error } = await this.client
      .from('regional_counting_raw')
      .insert(records);
    
    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
  };
}

// Run collection
if (require.main === module) {
  collectRegionalDataRange().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { collectRegionalDataRange };