#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { SensorClient } = require('../workflows/lib/sensor-client');
const { SupabaseClient } = require('../workflows/lib/supabase-client');

async function collectRegionalData() {
  console.log('=== Collecting Regional Data from July 12, 2025 to Now ===\n');
  
  const supabaseClient = new SupabaseClient();
  const sensorClient = new SensorClient();
  
  try {
    // Get active sensors for regional counting
    const sensors = await supabaseClient.getActiveSensors('regional_counting');
    console.log(`Found ${sensors.length} active regional counting sensors\n`);
    
    const startDate = new Date('2025-07-12T00:00:00Z');
    const endDate = new Date();
    
    console.log(`Collection period: ${startDate.toISOString()} to ${endDate.toISOString()}\n`);
    
    for (const sensor of sensors) {
      console.log(`\n📊 Processing sensor: ${sensor.sensor_name} (${sensor.id})`);
      console.log(`   Store: ${sensor.store_id}`);
      console.log(`   Organization: ${sensor.organization_id}`);
      
      try {
        // Collect data using sensor client
        const data = await sensorClient.collectSensorData(sensor, startDate, endDate);
        
        if (data && data.length > 0) {
          // Process in batches
          const batchSize = 100;
          let totalInserted = 0;
          
          for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            // Transform data for regional counting
            const records = batch.map(row => ({
              sensor_id: sensor.id,
              store_id: sensor.store_id,
              organization_id: sensor.organization_id,
              timestamp: row.timestamp,
              start_time: row.startTime,
              end_time: row.endTime,
              region1_count: row.data.region1 || 0,
              region2_count: row.data.region2 || 0,
              region3_count: row.data.region3 || 0,
              region4_count: row.data.region4 || 0,
              total_count: (row.data.region1 || 0) + (row.data.region2 || 0) + 
                          (row.data.region3 || 0) + (row.data.region4 || 0)
            }));
            
            // Insert batch
            await supabaseClient.insertRegionalData(records);
            totalInserted += records.length;
            
            console.log(`   ✅ Progress: ${totalInserted}/${data.length} records`);
          }
          
          console.log(`   ✅ Completed: ${totalInserted} records inserted`);
        } else {
          console.log(`   ⚠️  No data returned for this period`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing sensor: ${error.message}`);
      }
    }
    
    // Verify data
    console.log('\n=== Verification ===');
    const summary = await supabaseClient.getRegionalDataSummary(startDate);
    
    console.log('\nRecords by store:');
    for (const storeSummary of summary) {
      console.log(`Store ${storeSummary.store_id}: ${storeSummary.record_count} records`);
    }
    
    // Show date range
    const dateRange = await supabaseClient.getDateRange('regional_counting_raw');
    if (dateRange) {
      console.log(`\nDate range in database: ${dateRange.min_date} to ${dateRange.max_date}`);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

// Run the collection
collectRegionalData();