#!/usr/bin/env node

const { SupabaseClient } = require('./workflows/lib/supabase-client');
const { SensorClient } = require('./workflows/lib/sensor-client');

/**
 * Manual historical regional data collection script
 * Collects regional counting data for Omnia sensors
 */
async function collectHistoricalRegionalData(startDate, endDate) {
  console.log('🗺️  Manual Historical Regional Data Collection');
  console.log('==============================================');
  console.log(`📅 Start: ${startDate.toISOString()}`);
  console.log(`📅 End: ${endDate.toISOString()}`);
  console.log(`⏱️  Duration: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days`);
  
  const supabase = new SupabaseClient();
  
  try {
    // Get active sensors that support regional data (NorteShopping for now)
    console.log('\n📡 Fetching sensors with regional capabilities...');
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
      .in('sensor_id', ['7976051c-980b-45e1-b099-45d032f3c7aa', '29e75799-328f-4143-9a2f-2bcc1269f77e'])  // OML03 and J&J
      .eq('is_active', true);

    if (error) throw error;
    
    if (!sensors || sensors.length === 0) {
      console.log('❌ No sensors with regional data capabilities found');
      return;
    }

    console.log(`Found ${sensors.length} sensor(s) with regional data support`);

    // Create a modified sensor client for historical data
    class HistoricalRegionalClient extends SensorClient {
      constructor() {
        super('milesight');
      }

      async collectRegionalData(sensor, queryStartTime, queryEndTime) {
        const formatDate = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        // Build endpoint for regional data
        const endpoint = `/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&region1=1&region2=1&region3=1&region4=1&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
        
        console.log(`    📍 Fetching regional data: ${queryStartTime.toISOString().split('T')[0]}`);
        
        try {
          const response = await this.fetchData(sensor, endpoint);
          
          if (typeof response === 'string' && response.includes(',')) {
            const lines = response.trim().split('\n');
            if (lines.length < 2) {
              return [];
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
              console.log('    ⚠️  No regional columns found in data');
              return [];
            }
            
            const records = [];
            
            // Parse data lines
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim());
              if (values.length < headers.length) continue;
              
              try {
                // Parse timestamps - Milesight returns in sensor local time
                const timestamp = new Date(values[0].replace(/\//g, '-'));
                const endTime = new Date(values[1].replace(/\//g, '-'));
                
                // Assume UTC+2 for NorteShopping (CEST)
                const offsetHours = 2;
                
                // Convert to UTC for database storage
                const utcTimestamp = new Date(timestamp.getTime() - (offsetHours * 60 * 60 * 1000));
                const utcEndTime = new Date(endTime.getTime() - (offsetHours * 60 * 60 * 1000));
                
                // Extract regional counts
                const regionCounts = {};
                let hasData = false;
                
                Object.entries(regionColumns).forEach(([regionKey, columnIndex]) => {
                  const regionNum = regionKey.replace('region', '');
                  const count = parseInt(values[columnIndex]) || 0;
                  regionCounts[`region${regionNum}_count`] = count;
                  if (count > 0) hasData = true;
                });
                
                // Only create record if we have data
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
              } catch (e) {
                console.error(`    Error parsing line ${i}: ${e.message}`);
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

    const client = new HistoricalRegionalClient();
    
    // Process each sensor
    for (const sensor of sensors) {
      console.log(`\n\n${'='.repeat(60)}`);
      console.log(`🏢 Processing ${sensor.sensor_name} (${sensor.sensor_id})`);
      console.log(`${'='.repeat(60)}`);
      
      let totalInserted = 0;
      let totalUpdated = 0;
      let totalErrors = 0;
      
      // Process in daily chunks to avoid timeouts
      const currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        const chunkStart = new Date(currentDate);
        const chunkEnd = new Date(currentDate);
        chunkEnd.setDate(chunkEnd.getDate() + 1);
        chunkEnd.setSeconds(chunkEnd.getSeconds() - 1);
        
        // Don't go past end date
        if (chunkEnd > endDate) {
          chunkEnd.setTime(endDate.getTime());
        }
        
        try {
          // Collect regional data for this chunk
          const records = await client.collectRegionalData(sensor, chunkStart, chunkEnd);
          
          if (records.length === 0) {
            console.log(`    📅 ${chunkStart.toISOString().split('T')[0]}: No regional data`);
          } else {
            console.log(`    📦 Processing ${records.length} regional records...`);
            
            let dayInserted = 0;
            let dayUpdated = 0;
            
            // Insert records with duplicate checking
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
                  
                  if (error) throw error;
                  dayUpdated++;
                  totalUpdated++;
                } else {
                  // Insert new record
                  const { error } = await supabase.client
                    .from('regional_counting_raw')
                    .insert(record);
                  
                  if (error) throw error;
                  dayInserted++;
                  totalInserted++;
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
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Small delay to avoid overwhelming the sensor
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Summary for this sensor
      console.log(`\n📈 ${sensor.sensor_name} Regional Data Summary:`);
      console.log(`  ✅ Inserted: ${totalInserted}`);
      console.log(`  🔄 Updated: ${totalUpdated}`);
      console.log(`  ❌ Errors: ${totalErrors}`);
      console.log(`  📊 Total processed: ${totalInserted + totalUpdated}`);
    }
    
    console.log('\n\n✅ Regional data collection complete!');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Default: July 1-26, 2025
  const startDate = new Date('2025-07-01T00:00:00Z');
  const endDate = new Date('2025-07-26T18:59:59Z');
  
  collectHistoricalRegionalData(startDate, endDate).catch(console.error);
} else if (args.length === 2) {
  // Custom date range
  const startDate = new Date(args[0]);
  const endDate = new Date(args[1]);
  
  if (isNaN(startDate) || isNaN(endDate)) {
    console.error('Invalid date format. Use: node collect-regional-historical.js "2025-07-01" "2025-07-26"');
    process.exit(1);
  }
  
  collectHistoricalRegionalData(startDate, endDate).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node collect-regional-historical.js                     # Collect July 1-26, 2025');
  console.log('  node collect-regional-historical.js START_DATE END_DATE  # Custom date range');
  console.log('');
  console.log('Example:');
  console.log('  node collect-regional-historical.js "2025-07-01" "2025-07-26"');
  process.exit(1);
}