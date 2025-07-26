#!/usr/bin/env node

const { SupabaseClient } = require('./workflows/lib/supabase-client');
const { SensorClient } = require('./workflows/lib/sensor-client');

/**
 * Manual historical data collection script
 * Uses existing collection infrastructure to gather data for a specific date range
 */
async function collectHistoricalData(startDate, endDate) {
  console.log('🚀 Manual Historical Data Collection');
  console.log('=====================================');
  console.log(`📅 Start: ${startDate.toISOString()}`);
  console.log(`📅 End: ${endDate.toISOString()}`);
  console.log(`⏱️  Duration: ${Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))} days`);
  
  const supabase = new SupabaseClient();
  
  try {
    // Get active sensors
    console.log('\n📡 Fetching active sensors...');
    const sensors = await supabase.getActiveSensors();
    console.log(`Found ${sensors.length} active sensors`);

    if (sensors.length === 0) {
      console.log('⚠️  No active sensors found');
      return;
    }

    // Create a modified sensor client that can collect historical data
    class HistoricalSensorClient extends SensorClient {
      constructor() {
        super('milesight');
      }

      async collectMilesightData(sensor, queryStartTime, queryEndTime) {
        // Format date for Milesight API
        const formatDate = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        // Build endpoint with query parameters
        const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
        
        console.log(`    📍 Fetching: ${queryStartTime.toISOString()} to ${queryEndTime.toISOString()}`);
        
        try {
          const data = await this.fetchData(sensor, endpoint);
          
          // Parse CSV response
          if (typeof data === 'string') {
            const lines = data.trim().split('\n');
            if (lines.length < 2) {
              return [];
            }
            
            const records = [];
            
            // Skip header, process data lines
            for (let i = 1; i < lines.length; i++) {
              const parts = lines[i].split(',').map(p => p.trim());
              
              if (parts.length >= 17) {
                try {
                  // Parse timestamps - Milesight returns in sensor local time
                  const timestamp = new Date(parts[0].replace(/\//g, '-'));
                  const endTime = new Date(parts[1].replace(/\//g, '-'));
                  
                  // Get timezone offset from store configuration
                  let offsetHours = 0;
                  if (sensor.stores?.timezone) {
                    // Calculate offset based on timezone
                    const timezoneOffset = this.getTimezoneOffset(sensor.stores.timezone);
                    offsetHours = timezoneOffset;
                  }
                  
                  // Convert to UTC for database storage
                  const utcTimestamp = new Date(timestamp.getTime() - (offsetHours * 60 * 60 * 1000));
                  const utcEndTime = new Date(endTime.getTime() - (offsetHours * 60 * 60 * 1000));
                  
                  const line1In = parseInt(parts[5]) || 0;
                  const line1Out = parseInt(parts[6]) || 0;
                  const line2In = parseInt(parts[8]) || 0;
                  const line2Out = parseInt(parts[9]) || 0;
                  const line3In = parseInt(parts[11]) || 0;
                  const line3Out = parseInt(parts[12]) || 0;
                  const line4In = parseInt(parts[14]) || 0;
                  const line4Out = parseInt(parts[15]) || 0;
                  
                  records.push({
                    sensor_id: sensor.id,
                    store_id: sensor.store_id,
                    organization_id: sensor.stores?.organizations?.id || sensor.organization_id,
                    timestamp: utcTimestamp.toISOString(),
                    end_time: utcEndTime.toISOString(),
                    line1_in: line1In,
                    line1_out: line1Out,
                    line2_in: line2In,
                    line2_out: line2Out,
                    line3_in: line3In,
                    line3_out: line3Out,
                    line4_in: line4In,
                    line4_out: line4Out
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
          console.error(`    ❌ Failed to fetch data: ${error.message}`);
          return [];
        }
      }

      // Helper method to get timezone offset
      getTimezoneOffset(timezone) {
        // Common timezones and their offsets
        const offsets = {
          'Europe/Lisbon': 1,      // WEST
          'Europe/London': 1,      // BST
          'Europe/Madrid': 2,      // CEST
          'Europe/Paris': 2,       // CEST
          'Europe/Berlin': 2,      // CEST
          'UTC': 0
        };
        
        return offsets[timezone] || 0;
      }
    }

    const client = new HistoricalSensorClient();
    
    // Process each sensor
    for (const sensor of sensors) {
      console.log(`\n\n${'='.repeat(60)}`);
      console.log(`📊 Processing ${sensor.sensor_name} (${sensor.sensor_id})`);
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
        
        console.log(`\n📅 Day: ${chunkStart.toISOString().split('T')[0]}`);
        
        try {
          // Collect data for this chunk
          const records = await client.collectMilesightData(sensor, chunkStart, chunkEnd);
          
          if (records.length === 0) {
            console.log('    ℹ️  No data found for this day');
          } else {
            console.log(`    📦 Processing ${records.length} records...`);
            
            // Insert records using existing logic
            for (const record of records) {
              try {
                const insertResult = await supabase.insertSensorData(record);
                if (insertResult.action === 'inserted') {
                  totalInserted++;
                } else {
                  totalUpdated++;
                }
              } catch (insertError) {
                console.log(`    ⚠️  Failed to insert record: ${insertError.message}`);
                totalErrors++;
              }
            }
            
            console.log(`    ✅ Day complete: ${records.length} records processed`);
          }
          
        } catch (error) {
          console.error(`    ❌ Error processing day: ${error.message}`);
          totalErrors++;
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Small delay to avoid overwhelming the sensors
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Summary for this sensor
      console.log(`\n📈 ${sensor.sensor_name} Summary:`);
      console.log(`  ✅ Inserted: ${totalInserted}`);
      console.log(`  🔄 Updated: ${totalUpdated}`);
      console.log(`  ❌ Errors: ${totalErrors}`);
      console.log(`  📊 Total: ${totalInserted + totalUpdated}`);
    }
    
    console.log('\n\n✅ Historical data collection complete!');
    
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
  
  collectHistoricalData(startDate, endDate).catch(console.error);
} else if (args.length === 2) {
  // Custom date range
  const startDate = new Date(args[0]);
  const endDate = new Date(args[1]);
  
  if (isNaN(startDate) || isNaN(endDate)) {
    console.error('Invalid date format. Use: node manual-collect-historical.js "2025-07-01" "2025-07-26"');
    process.exit(1);
  }
  
  collectHistoricalData(startDate, endDate).catch(console.error);
} else {
  console.log('Usage:');
  console.log('  node manual-collect-historical.js                    # Collect July 1-26, 2025');
  console.log('  node manual-collect-historical.js START_DATE END_DATE  # Custom date range');
  console.log('');
  console.log('Example:');
  console.log('  node manual-collect-historical.js "2025-07-01" "2025-07-26"');
  process.exit(1);
}