#!/usr/bin/env node

const { SupabaseClient } = require('./workflows/lib/supabase-client');
const { SensorClient } = require('./workflows/lib/sensor-client');

/**
 * Collect historical data for NorteShopping sensor only
 */
async function collectNorteShoppingData() {
  const startDate = new Date('2025-07-01T00:00:00Z');
  const endDate = new Date('2025-07-26T18:59:59Z');
  
  console.log('🚀 Manual Historical Data Collection - NorteShopping Only');
  console.log('=========================================================');
  console.log(`📅 Start: ${startDate.toISOString()}`);
  console.log(`📅 End: ${endDate.toISOString()}`);
  
  const supabase = new SupabaseClient();
  
  try {
    // Get the NorteShopping sensor specifically
    console.log('\n📡 Fetching NorteShopping sensor...');
    const { data: sensors, error } = await supabase.client
      .from('sensor_metadata')
      .select(`
        *,
        stores (
          name,
          timezone,
          organizations (
            id,
            name
          )
        )
      `)
      .eq('sensor_id', '7976051c-980b-45e1-b099-45d032f3c7aa')  // OML03 - NorteShopping
      .eq('is_active', true);

    if (error) throw error;
    
    if (!sensors || sensors.length === 0) {
      console.log('❌ NorteShopping sensor not found or not active');
      return;
    }

    const sensor = sensors[0];
    console.log(`✅ Found: ${sensor.sensor_name} (${sensor.sensor_id})`);
    console.log(`   Host: ${sensor.host}`);
    console.log(`   Store: ${sensor.stores?.name}`);

    // Create a modified sensor client for historical data
    class HistoricalSensorClient extends SensorClient {
      constructor() {
        super('milesight');
      }

      async collectMilesightData(sensor, queryStartTime, queryEndTime) {
        const formatDate = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
        
        console.log(`    📍 Fetching: ${queryStartTime.toISOString().split('T')[0]}`);
        
        try {
          const data = await this.fetchData(sensor, endpoint);
          
          if (typeof data === 'string') {
            const lines = data.trim().split('\n');
            if (lines.length < 2) {
              return [];
            }
            
            const records = [];
            
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split(',').map(p => p.trim());
              
              if (parts.length >= 17) {
                try {
                  const timestamp = new Date(parts[0].replace(/\//g, '-'));
                  const endTime = new Date(parts[1].replace(/\//g, '-'));
                  
                  // Assume UTC+2 for NorteShopping (CEST)
                  const offsetHours = 2;
                  
                  const utcTimestamp = new Date(timestamp.getTime() - (offsetHours * 60 * 60 * 1000));
                  const utcEndTime = new Date(endTime.getTime() - (offsetHours * 60 * 60 * 1000));
                  
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
                } catch (e) {
                  console.error(`    Error parsing line ${i}: ${e.message}`);
                }
              }
            }
            
            return records;
          }
          
          return [];
        } catch (error) {
          console.error(`    ❌ Failed: ${error.message}`);
          return [];
        }
      }
    }

    const client = new HistoricalSensorClient();
    
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    
    console.log('\n🏢 Collecting data for NorteShopping...\n');
    
    // Process in daily chunks
    const currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const chunkStart = new Date(currentDate);
      const chunkEnd = new Date(currentDate);
      chunkEnd.setDate(chunkEnd.getDate() + 1);
      chunkEnd.setSeconds(chunkEnd.getSeconds() - 1);
      
      if (chunkEnd > endDate) {
        chunkEnd.setTime(endDate.getTime());
      }
      
      try {
        const records = await client.collectMilesightData(sensor, chunkStart, chunkEnd);
        
        if (records.length === 0) {
          console.log(`    📅 ${chunkStart.toISOString().split('T')[0]}: No data`);
        } else {
          let dayInserted = 0;
          let dayUpdated = 0;
          
          for (const record of records) {
            try {
              const insertResult = await supabase.insertSensorData(record);
              if (insertResult.action === 'inserted') {
                dayInserted++;
                totalInserted++;
              } else {
                dayUpdated++;
                totalUpdated++;
              }
            } catch (insertError) {
              console.log(`    ⚠️  Error: ${insertError.message}`);
              totalErrors++;
            }
          }
          
          console.log(`    📅 ${chunkStart.toISOString().split('T')[0]}: ${dayInserted} new, ${dayUpdated} updated`);
        }
        
      } catch (error) {
        console.error(`    ❌ ${chunkStart.toISOString().split('T')[0]}: ${error.message}`);
        totalErrors++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    console.log('\n📈 NorteShopping Collection Summary:');
    console.log(`  ✅ Inserted: ${totalInserted}`);
    console.log(`  🔄 Updated: ${totalUpdated}`);
    console.log(`  ❌ Errors: ${totalErrors}`);
    console.log(`  📊 Total processed: ${totalInserted + totalUpdated}`);
    
    console.log('\n✅ Collection complete!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the collection
collectNorteShoppingData().catch(console.error);