#!/usr/bin/env node

/**
 * Collect data for July 23, 2025 from 17:00 to 23:59:59 (Lisbon time)
 */

// Set up the environment
process.env.SUPABASE_URL = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZndjY3BucWNneHV5ZHZtZHZiIiwicm9sZSI6InNlcnZpY2Ffcm9sZSIsImlhdCI6MTczMzI2NjI0NiwiZXhwIjoyMDQ4ODQyMjQ2fQ.IQJGfAJJKJgNy-ANaRsJvBjO6N7Dc0W7I6bG8w2NTIE';
process.env.SENSOR_AUTH_MILESIGHT = 'Basic YWRtaW46Z3JubC4yMDI0';
process.env.SENSOR_AUTH_OMNIA = 'Basic YWRtaW46cGFzc3dvcmQ=';

const { SupabaseClient } = require('../workflows/lib/supabase-client');
const { SensorClient } = require('../workflows/lib/sensor-client');
const pLimit = require('p-limit');

async function collectJuly23Data() {
  console.log('🚀 Manual Data Collection for July 23, 2025');
  console.log('⏰ Period: 17:00:00 to 23:59:59 (Lisbon time)');
  console.log('   UTC: 16:00:00 to 22:59:59\n');
  
  try {
    const supabase = new SupabaseClient();
    
    // Get active sensors
    console.log('📡 Fetching active sensors...');
    const sensors = await supabase.getActiveSensors();
    const milesightSensors = sensors.filter(s => s.sensor_type === 'milesight_people_counter');
    
    // Filter out the offline sensor (OML03-PC at 93.108.96.96:21001)
    const onlineSensors = milesightSensors.filter(s => 
      !(s.sensor_ip === '93.108.96.96' && s.sensor_port === 21001)
    );
    
    console.log(`  Found ${milesightSensors.length} Milesight sensors`);
    console.log(`  Using ${onlineSensors.length} online sensors (excluding OML03-PC)\n`);
    
    const limit = pLimit(5);
    let totalCollected = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    
    // Process each sensor
    const results = await Promise.all(
      onlineSensors.map(sensor => 
        limit(async () => {
          console.log(`\n📊 Processing ${sensor.sensor_name} (${sensor.sensor_id})...`);
          
          try {
            const client = new SensorClient('milesight_people_counter');
            
            // Format dates for Milesight API (Lisbon time)
            const formatDate = (date) => {
              const pad = (n) => n.toString().padStart(2, '0');
              return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
            };
            
            // July 23 17:00 to 23:59:59 Lisbon time
            const startDate = new Date('2025-07-23T17:00:00');
            const endDate = new Date('2025-07-23T23:59:59');
            
            const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(startDate)}&time_end=${formatDate(endDate)}`;
            
            console.log(`  📥 Querying: ${formatDate(startDate)} to ${formatDate(endDate)}`);
            
            const response = await client.fetchData(sensor, endpoint);
            
            if (typeof response === 'string' && response.includes(',')) {
              const lines = response.trim().split('\n');
              const records = [];
              
              // Parse CSV (skip header)
              for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(p => p.trim());
                
                if (parts.length >= 17) {
                  // Parse timestamps as Lisbon time, then convert to UTC
                  const sensorTimestamp = new Date(parts[0].replace(/\//g, '-'));
                  const sensorEndTime = new Date(parts[1].replace(/\//g, '-'));
                  
                  // Convert Lisbon time to UTC (subtract 1 hour for summer time)
                  const utcTimestamp = new Date(sensorTimestamp.getTime() - (1 * 60 * 60 * 1000));
                  const utcEndTime = new Date(sensorEndTime.getTime() - (1 * 60 * 60 * 1000));
                  
                  records.push({
                    sensor_id: sensor.id,
                    store_id: sensor.store_id,
                    organization_id: sensor.stores?.organizations?.id,
                    timestamp: utcTimestamp.toISOString(),
                    end_time: utcEndTime.toISOString(),
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
              
              console.log(`  📊 Found ${records.length} records`);
              
              // Insert with duplicate checking
              let inserted = 0;
              let updated = 0;
              
              for (const record of records) {
                try {
                  const result = await supabase.insertSensorData(record);
                  if (result.action === 'inserted') inserted++;
                  else if (result.action === 'updated') updated++;
                } catch (err) {
                  console.error(`  ❌ Insert error: ${err.message}`);
                }
              }
              
              console.log(`  ✅ Done: ${inserted} inserted, ${updated} updated`);
              totalCollected += records.length;
              totalInserted += inserted;
              totalUpdated += updated;
              
            } else {
              console.log(`  ⚠️  No data or unexpected format`);
            }
            
          } catch (error) {
            console.log(`  ❌ Error: ${error.message}`);
          }
        })
      )
    );
    
    console.log('\n📈 Collection Summary:');
    console.log(`  📊 Total records found: ${totalCollected}`);
    console.log(`  ✅ Inserted: ${totalInserted}`);
    console.log(`  🔄 Updated: ${totalUpdated}`);
    console.log(`  📅 Period: July 23, 2025 17:00-23:59 (Lisbon time)`);
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
  }
}

// Run it
collectJuly23Data();