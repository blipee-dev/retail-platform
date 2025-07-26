#!/usr/bin/env node

const { SupabaseClient } = require('./workflows/lib/supabase-client');
const { SensorClient } = require('./workflows/lib/sensor-client');

/**
 * Collect data for July 26, 2025 from 21:00 to 23:59
 */
async function collectJuly26Evening() {
  // Specific time range
  const startDate = new Date('2025-07-26T21:00:00Z');
  const endDate = new Date('2025-07-26T23:59:59Z');
  
  console.log('🌙 Manual Data Collection - July 26 Evening');
  console.log('==========================================');
  console.log(`📅 Start: ${startDate.toISOString()}`);
  console.log(`📅 End: ${endDate.toISOString()}`);
  
  const supabase = new SupabaseClient();
  
  try {
    // Get both active sensors
    console.log('\n📡 Fetching active sensors...');
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
      .in('sensor_id', ['7976051c-980b-45e1-b099-45d032f3c7aa', '29e75799-328f-4143-9a2f-2bcc1269f77e'])
      .eq('is_active', true);

    if (error) throw error;
    
    console.log(`Found ${sensors.length} active sensors`);

    // Create sensor client for data collection
    class EveningSensorClient extends SensorClient {
      constructor() {
        super('milesight');
      }

      async collectPeopleCountingData(sensor, queryStartTime, queryEndTime) {
        const formatDate = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
        
        console.log(`    📍 Fetching people counting: ${queryStartTime.toISOString()} to ${queryEndTime.toISOString()}`);
        
        try {
          const data = await this.fetchData(sensor, endpoint);
          
          if (typeof data === 'string') {
            const lines = data.trim().split('\n');
            if (lines.length < 2) return [];
            
            const records = [];
            
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split(',').map(p => p.trim());
              
              if (parts.length >= 17) {
                try {
                  const timestamp = new Date(parts[0].replace(/\//g, '-'));
                  const endTime = new Date(parts[1].replace(/\//g, '-'));
                  
                  // Determine offset based on sensor
                  let offsetHours = 1; // Default WEST for J&J
                  if (sensor.sensor_id === '7976051c-980b-45e1-b099-45d032f3c7aa') {
                    offsetHours = 2; // CEST for NorteShopping
                  }
                  
                  const utcTimestamp = new Date(timestamp.getTime() - (offsetHours * 60 * 60 * 1000));
                  const utcEndTime = new Date(endTime.getTime() - (offsetHours * 60 * 60 * 1000));
                  
                  // Only include data in our specific range
                  if (utcTimestamp >= startDate && utcTimestamp <= endDate) {
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

      async collectRegionalData(sensor, queryStartTime, queryEndTime) {
        const formatDate = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        const endpoint = `/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&region1=1&region2=1&region3=1&region4=1&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
        
        console.log(`    📍 Fetching regional data: ${queryStartTime.toISOString()} to ${queryEndTime.toISOString()}`);
        
        try {
          const response = await this.fetchData(sensor, endpoint);
          
          if (typeof response === 'string' && response.includes(',')) {
            const lines = response.trim().split('\n');
            if (lines.length < 2) return [];
            
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
            
            if (Object.keys(regionColumns).length === 0) return [];
            
            const records = [];
            
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              if (values.length < headers.length) continue;
              
              try {
                const timestamp = new Date(values[0].replace(/\//g, '-'));
                const endTime = new Date(values[1].replace(/\//g, '-'));
                
                // CEST offset for NorteShopping
                const offsetHours = 2;
                
                const utcTimestamp = new Date(timestamp.getTime() - (offsetHours * 60 * 60 * 1000));
                const utcEndTime = new Date(endTime.getTime() - (offsetHours * 60 * 60 * 1000));
                
                // Only include data in our specific range
                if (utcTimestamp >= startDate && utcTimestamp <= endDate) {
                  const regionCounts = {};
                  let hasData = false;
                  
                  Object.entries(regionColumns).forEach(([regionKey, columnIndex]) => {
                    const regionNum = regionKey.replace('region', '');
                    const count = parseInt(values[columnIndex]) || 0;
                    regionCounts[`region${regionNum}_count`] = count;
                    if (count > 0) hasData = true;
                  });
                  
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
              } catch (e) {
                console.error(`    Error parsing regional line ${i}: ${e.message}`);
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

    const client = new EveningSensorClient();
    
    // Process each sensor
    for (const sensor of sensors) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🏢 Processing ${sensor.sensor_name}`);
      console.log(`${'='.repeat(60)}`);
      
      // Adjust query time for sensor local time
      let queryStart = new Date(startDate);
      let queryEnd = new Date(endDate);
      
      if (sensor.sensor_id === '29e75799-328f-4143-9a2f-2bcc1269f77e') {
        // J&J - Add 1 hour for WEST
        queryStart = new Date(startDate.getTime() + 60 * 60 * 1000);
        queryEnd = new Date(endDate.getTime() + 60 * 60 * 1000);
      } else if (sensor.sensor_id === '7976051c-980b-45e1-b099-45d032f3c7aa') {
        // NorteShopping - Add 2 hours for CEST
        queryStart = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
        queryEnd = new Date(endDate.getTime() + 2 * 60 * 60 * 1000);
      }
      
      // Collect people counting data
      console.log('\n📊 People Counting Data:');
      const peopleData = await client.collectPeopleCountingData(sensor, queryStart, queryEnd);
      
      if (peopleData.length > 0) {
        console.log(`    📦 Processing ${peopleData.length} records...`);
        
        let inserted = 0;
        let updated = 0;
        
        for (const record of peopleData) {
          try {
            const insertResult = await supabase.insertSensorData(record);
            if (insertResult.action === 'inserted') {
              inserted++;
            } else {
              updated++;
            }
          } catch (err) {
            console.log(`    ⚠️  Error: ${err.message}`);
          }
        }
        
        console.log(`    ✅ People counting: ${inserted} new, ${updated} updated`);
      } else {
        console.log('    ℹ️  No people counting data found');
      }
      
      // Collect regional data (only for NorteShopping)
      if (sensor.sensor_id === '7976051c-980b-45e1-b099-45d032f3c7aa') {
        console.log('\n🗺️  Regional Data:');
        const regionalData = await client.collectRegionalData(sensor, queryStart, queryEnd);
        
        if (regionalData.length > 0) {
          console.log(`    📦 Processing ${regionalData.length} regional records...`);
          
          let inserted = 0;
          let updated = 0;
          
          for (const record of regionalData) {
            try {
              const { data: existing } = await supabase.client
                .from('regional_counting_raw')
                .select('id')
                .eq('sensor_id', record.sensor_id)
                .eq('timestamp', record.timestamp)
                .single();
              
              if (existing) {
                const { error } = await supabase.client
                  .from('regional_counting_raw')
                  .update(record)
                  .eq('id', existing.id);
                
                if (!error) updated++;
              } else {
                const { error } = await supabase.client
                  .from('regional_counting_raw')
                  .insert(record);
                
                if (!error) inserted++;
              }
            } catch (err) {
              console.log(`    ⚠️  Error: ${err.message}`);
            }
          }
          
          console.log(`    ✅ Regional data: ${inserted} new, ${updated} updated`);
        } else {
          console.log('    ℹ️  No regional data found');
        }
      }
    }
    
    console.log('\n\n✅ July 26 evening data collection complete!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the collection
collectJuly26Evening().catch(console.error);