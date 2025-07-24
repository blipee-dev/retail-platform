#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const supabase = createClient(supabaseUrl, supabaseKey);

// Date range
const START_DATE = '2024-06-01';
const END_DATE = new Date().toISOString().split('T')[0]; // Today

async function backfillData() {
  console.log('🔄 Starting backfill from June 1st, 2024');
  console.log('=' .repeat(60));
  
  try {
    // Get all active sensors
    const { data: sensors, error: sensorError } = await supabase
      .from('sensor_metadata')
      .select('*')
      .eq('is_active', true)
      .order('sensor_name');
      
    if (sensorError) throw sensorError;
    
    console.log(`\n📊 Found ${sensors.length} active sensors`);
    
    // Process each day
    const startDate = new Date(START_DATE);
    const endDate = new Date(END_DATE);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`\n📅 Processing ${dateStr}...`);
      
      // For each sensor
      for (const sensor of sensors) {
        console.log(`  🔍 ${sensor.sensor_name} (${sensor.sensor_type})`);
        
        // Collect data for each hour of the day
        for (let hour = 0; hour < 24; hour++) {
          const hourStart = new Date(currentDate);
          hourStart.setHours(hour, 0, 0, 0);
          const hourEnd = new Date(currentDate);
          hourEnd.setHours(hour, 59, 59, 999);
          
          // Skip if in the future
          if (hourStart > new Date()) {
            continue;
          }
          
          // Check business hours based on sensor timezone
          const localHour = getLocalHour(hourStart, sensor.timezone || 'UTC');
          if (localHour >= 1 && localHour < 9) {
            continue; // Skip non-business hours
          }
          
          try {
            // Collect people counting data
            if (sensor.sensor_type === 'milesight_people_counter' || 
                sensor.sensor_type === 'omnia') {
              await collectPeopleCountingData(sensor, hourStart, hourEnd);
            }
            
            // Collect regional data for Omnia sensors
            if (sensor.sensor_type === 'omnia') {
              await collectRegionalData(sensor, hourStart, hourEnd);
            }
          } catch (err) {
            console.log(`    ⚠️  Error collecting data: ${err.message}`);
          }
        }
      }
      
      // After collecting all data for the day, run aggregations
      console.log(`  📊 Running aggregations for ${dateStr}...`);
      
      // Run hourly aggregation
      await runHourlyAggregation(currentDate);
      
      // Run daily aggregation
      await runDailyAggregation(currentDate);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('\n✅ Backfill completed successfully!');
    
    // Show summary
    await showSummary();
    
  } catch (error) {
    console.error('\n❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

async function collectPeopleCountingData(sensor, hourStart, hourEnd) {
  // This would call the sensor collection logic
  // For now, we'll simulate with a placeholder
  console.log(`      📥 Would collect people counting data for hour ${hourStart.getHours()}`);
  
  // In reality, this would:
  // 1. Call sensor API with proper authentication
  // 2. Parse CSV data
  // 3. Filter by time range
  // 4. Insert into people_counting_raw table
}

async function collectRegionalData(sensor, hourStart, hourEnd) {
  // This would call the regional collection logic
  console.log(`      🗺️  Would collect regional data for hour ${hourStart.getHours()}`);
  
  // In reality, this would:
  // 1. Call sensor API for regional data
  // 2. Parse regional CSV
  // 3. Filter by time range
  // 4. Insert into regional_counting_raw table
}

async function runHourlyAggregation(date) {
  // This would run the hourly aggregation logic
  // Could either call the aggregation script or duplicate logic here
  const dateStr = date.toISOString().split('T')[0];
  
  const { error } = await supabase.rpc('aggregate_hourly_data', {
    p_start_time: `${dateStr} 00:00:00`,
    p_end_time: `${dateStr} 23:59:59`
  });
  
  if (error && error.code !== 'PGRST204') {
    console.log(`    ⚠️  Hourly aggregation: ${error.message}`);
  }
}

async function runDailyAggregation(date) {
  // This would run the daily aggregation logic
  const dateStr = date.toISOString().split('T')[0];
  console.log(`    📈 Daily aggregation for ${dateStr}`);
  
  // In reality, would calculate all daily KPIs
}

function getLocalHour(date, timezone) {
  try {
    const options = {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    };
    return parseInt(new Intl.DateTimeFormat('en-US', options).format(date));
  } catch (e) {
    return date.getUTCHours();
  }
}

async function showSummary() {
  console.log('\n📊 Backfill Summary:');
  console.log('=' .repeat(60));
  
  // Count records in each table
  const tables = [
    'people_counting_raw',
    'regional_counting_raw',
    'hourly_analytics',
    'daily_analytics'
  ];
  
  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
      
    console.log(`${table}: ${count || 0} records`);
  }
  
  // Show date range of data
  const { data: dateRange } = await supabase
    .from('daily_analytics')
    .select('date')
    .order('date', { ascending: true })
    .limit(1);
    
  const { data: lastDate } = await supabase
    .from('daily_analytics')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);
    
  if (dateRange && dateRange.length > 0 && lastDate && lastDate.length > 0) {
    console.log(`\nDate range: ${dateRange[0].date} to ${lastDate[0].date}`);
  }
}

// Add command line arguments support
const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log(`
Usage: node backfill-from-june.js [options]

Options:
  --start-date YYYY-MM-DD   Start date (default: 2024-06-01)
  --end-date YYYY-MM-DD     End date (default: today)
  --dry-run                 Show what would be done without executing
  --help                    Show this help message

Environment variables:
  SUPABASE_URL              Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Supabase service role key

Example:
  node backfill-from-june.js --start-date 2024-06-01 --end-date 2024-06-30
  `);
  process.exit(0);
}

// Note: This is a template script. The actual data collection would need to:
// 1. Import the sensor collection logic from workflows
// 2. Import the aggregation logic from aggregation scripts
// 3. Handle rate limiting and retries
// 4. Process in batches for efficiency

console.log(`
⚠️  Note: This is a template script that shows the structure for backfilling.
   
To actually run the backfill, you would need to:
1. First run the clean-and-rebuild-analytics.sql script
2. Adapt this script to call the actual collection workflows
3. Or manually trigger the GitHub Actions workflows for each day

Alternatively, you could:
- Use the GitHub Actions workflow dispatch to run collections for specific dates
- Modify the collection scripts to accept date parameters
- Run the aggregation scripts with specific date ranges
`);

// Uncomment to run the backfill
// backfillData();