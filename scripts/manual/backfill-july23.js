#!/usr/bin/env node

/**
 * Manual backfill for July 23, 2025 from 17:00:00 to 23:59:59
 * Collects historical data from all active sensors
 */

const path = require('path');
const { SupabaseClient } = require('../workflows/lib/supabase-client');
const { SensorClient } = require('../workflows/lib/sensor-client');
const pLimit = require('p-limit');

// Constants
const START_DATE = '2025-07-23T17:00:00.000Z';
const END_DATE = '2025-07-23T23:59:59.999Z';
const CONCURRENT_SENSORS = 5;

async function collectHistoricalData() {
  console.log('📅 Manual Backfill for July 23, 2025');
  console.log('⏰ Period: 17:00:00 to 23:59:59 UTC\n');
  
  try {
    // Initialize Supabase client
    const supabase = new SupabaseClient();
    
    // Get all active sensors
    console.log('📡 Fetching active sensors...');
    const sensors = await supabase.getActiveSensors();
    console.log(`  Found ${sensors.length} active sensors\n`);
    
    // Group sensors by type
    const sensorsByType = sensors.reduce((acc, sensor) => {
      const type = sensor.sensor_type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(sensor);
      return acc;
    }, {});
    
    let totalRecordsCollected = 0;
    let successfulSensors = 0;
    let failedSensors = 0;
    
    // Process each sensor type
    for (const [sensorType, typeSensors] of Object.entries(sensorsByType)) {
      if (typeSensors.length === 0) continue;
      
      console.log(`\n📊 Processing ${typeSensors.length} ${sensorType} sensors...`);
      
      // Process sensors with concurrency limit
      const limit = pLimit(CONCURRENT_SENSORS);
      const results = await Promise.all(
        typeSensors.map(sensor => 
          limit(async () => {
            console.log(`  Processing ${sensor.sensor_name} (${sensor.sensor_id})...`);
            
            try {
              // Get sensor's timezone
              const timezone = sensor.stores?.timezone || 'UTC';
              console.log(`    📍 Store timezone: ${timezone}`);
              
              // Calculate local time range for July 23
              const startLocal = new Date(START_DATE);
              const endLocal = new Date(END_DATE);
              
              // For Milesight sensors, we need to format the dates specially
              const formatDate = (date) => {
                const pad = (n) => n.toString().padStart(2, '0');
                return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
              };
              
              // Build the query URL
              const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(startLocal)}&time_end=${formatDate(endLocal)}`;
              
              console.log(`    📥 Querying: ${formatDate(startLocal)} to ${formatDate(endLocal)}`);
              
              // Create sensor client and fetch data
              const client = new SensorClient(sensorType);
              const response = await client.fetchData(sensor, endpoint);
              
              if (typeof response === 'string' && response.includes(',')) {
                // Parse CSV data
                const lines = response.trim().split('\n');
                const records = [];
                
                // Skip header, process data lines
                for (let i = 1; i < lines.length; i++) {
                  const parts = lines[i].split(',').map(p => p.trim());
                  
                  if (parts.length >= 17) {
                    const timestamp = new Date(parts[0].replace(/\//g, '-'));
                    const endTime = new Date(parts[1].replace(/\//g, '-'));
                    
                    // Only include data within our target range
                    if (timestamp >= new Date(START_DATE) && timestamp <= new Date(END_DATE)) {
                      records.push({
                        sensor_id: sensor.id,
                        store_id: sensor.store_id,
                        organization_id: sensor.stores?.organizations?.id || sensor.organization_id,
                        timestamp: timestamp.toISOString(),
                        end_time: endTime.toISOString(),
                        line1_in: parseInt(parts[5]) || 0,
                        line1_out: parseInt(parts[6]) || 0,
                        line2_in: parseInt(parts[8]) || 0,
                        line2_out: parseInt(parts[9]) || 0,
                        line3_in: parseInt(parts[11]) || 0,
                        line3_out: parseInt(parts[12]) || 0,
                        line4_in: parseInt(parts[14]) || 0,
                        line4_out: parseInt(parts[15]) || 0
                      });
                    }
                  }
                }
                
                console.log(`    📊 Found ${records.length} records in target period`);
                
                // Insert records with duplicate checking
                let inserted = 0;
                let updated = 0;
                
                for (const record of records) {
                  try {
                    const result = await supabase.insertSensorData(record);
                    if (result.action === 'inserted') inserted++;
                    else if (result.action === 'updated') updated++;
                  } catch (err) {
                    console.error(`    ❌ Error inserting record: ${err.message}`);
                  }
                }
                
                console.log(`    ✅ Success: ${inserted} new, ${updated} updated`);
                totalRecordsCollected += records.length;
                successfulSensors++;
                
              } else {
                console.log(`    ⚠️  No data found or unexpected format`);
                successfulSensors++;
              }
              
            } catch (error) {
              console.log(`    ❌ Error: ${error.message}`);
              failedSensors++;
            }
          })
        )
      );
    }
    
    // Summary
    console.log('\n📈 Backfill Summary:');
    console.log(`  ✅ Successful sensors: ${successfulSensors}`);
    console.log(`  ❌ Failed sensors: ${failedSensors}`);
    console.log(`  📊 Total records collected: ${totalRecordsCollected}`);
    console.log(`  📅 Period: July 23, 2025 17:00:00 - 23:59:59 UTC`);
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Add proper environment variables
process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

// Run the backfill
console.log('🚀 Starting manual backfill...\n');
collectHistoricalData();