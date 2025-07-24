#!/usr/bin/env node

/**
 * Run hourly and daily aggregations for July 2025 data
 */

// Set environment variables before imports
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';
}

const { execSync } = require('child_process');
const path = require('path');

// Configuration
const START_DATE = '2025-07-01';
const END_DATE = new Date().toISOString().split('T')[0];

async function aggregateJulyData() {
  console.log('📊 Aggregating Analytics Data - July 2025');
  console.log('=' .repeat(60));
  console.log(`📅 Date range: ${START_DATE} to ${END_DATE}`);
  console.log('');
  
  try {
    // Process each day
    const startDate = new Date(START_DATE);
    const endDate = new Date(END_DATE);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`\n📅 Processing ${dateStr}...`);
      
      // Run hourly aggregation for each hour of the day
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = new Date(dateStr);
        hourStart.setUTCHours(hour, 0, 0, 0);
        const hourEnd = new Date(dateStr);
        hourEnd.setUTCHours(hour, 59, 59, 999);
        
        // Skip future hours
        if (hourStart > new Date()) {
          console.log(`  ⏭️  Skipping future hour ${hour}:00`);
          continue;
        }
        
        console.log(`  ⏰ Aggregating hour ${hour}:00...`);
        
        try {
          // Run the hourly aggregation script with specific time range
          const scriptPath = path.join(__dirname, '..', 'run_hourly_aggregation.js');
          const cmd = `AGGREGATION_START="${hourStart.toISOString()}" AGGREGATION_END="${hourEnd.toISOString()}" node "${scriptPath}"`;
          
          const output = execSync(cmd, { 
            encoding: 'utf8',
            stdio: 'pipe',
            env: { ...process.env }
          });
          
          // Count inserted records from output
          const insertMatches = output.match(/➕ Inserted/g);
          const insertCount = insertMatches ? insertMatches.length : 0;
          
          if (insertCount > 0) {
            console.log(`    ✅ Aggregated ${insertCount} store hours`);
          } else {
            console.log(`    ⚠️  No data to aggregate`);
          }
          
        } catch (error) {
          console.log(`    ❌ Error: ${error.message}`);
        }
      }
      
      // Run daily aggregation for this day
      console.log(`  📊 Running daily aggregation...`);
      
      try {
        const scriptPath = path.join(__dirname, '..', 'run_daily_aggregation.js');
        const cmd = `AGGREGATION_DATE="${dateStr}" node "${scriptPath}"`;
        
        const output = execSync(cmd, {
          encoding: 'utf8',
          stdio: 'pipe',
          env: { ...process.env }
        });
        
        if (output.includes('✅')) {
          console.log(`    ✅ Daily aggregation complete`);
        } else {
          console.log(`    ⚠️  No daily data aggregated`);
        }
        
      } catch (error) {
        console.log(`    ❌ Daily aggregation error: ${error.message}`);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ July 2025 Aggregation Complete!');
    
    // Show summary
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Count hourly records
    const { count: hourlyCount } = await supabase
      .from('hourly_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('date', START_DATE)
      .lte('date', END_DATE);
      
    // Count daily records  
    const { count: dailyCount } = await supabase
      .from('daily_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('date', START_DATE)
      .lte('date', END_DATE);
    
    console.log(`\n📊 Summary:`);
    console.log(`  Hourly records: ${hourlyCount || 0}`);
    console.log(`  Daily records: ${dailyCount || 0}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if aggregation scripts support date parameters
console.log('⚠️  Note: This script assumes the aggregation scripts support:');
console.log('  - AGGREGATION_START and AGGREGATION_END for hourly');
console.log('  - AGGREGATION_DATE for daily');
console.log('');
console.log('If not, the scripts will need to be modified first.');
console.log('');

// Run the aggregation
aggregateJulyData().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});