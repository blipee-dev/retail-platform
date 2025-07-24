#!/usr/bin/env node

/**
 * Run SQL checks and cleanup from CLI
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runChecks() {
  console.log('🔍 Running database checks...\n');

  try {
    // 1. Check for future timestamps
    console.log('1️⃣ Checking for future timestamps...');
    const { data: futureStats, error: futureError } = await supabase
      .from('people_counting_raw')
      .select('timestamp')
      .gt('timestamp', new Date().toISOString());

    if (futureError) throw futureError;
    
    console.log(`   Found ${futureStats.length} future records`);
    if (futureStats.length > 0) {
      const timestamps = futureStats.map(r => r.timestamp).sort();
      console.log(`   Earliest: ${timestamps[0]}`);
      console.log(`   Latest: ${timestamps[timestamps.length - 1]}`);
    }

    // 2. Show sample of future records
    if (futureStats.length > 0) {
      console.log('\n2️⃣ Sample of future records:');
      const { data: futureSample, error: sampleError } = await supabase
        .from('people_counting_raw')
        .select('id, sensor_id, timestamp, end_time, total_in, total_out')
        .gt('timestamp', new Date().toISOString())
        .order('timestamp', { ascending: false })
        .limit(5);

      if (sampleError) throw sampleError;
      
      futureSample.forEach(record => {
        console.log(`   ID: ${record.id.slice(0, 8)}... | Time: ${record.timestamp} | In: ${record.total_in} | Out: ${record.total_out}`);
      });
    }

    // 3. Check timestamp patterns
    console.log('\n3️⃣ Checking timestamp minute/second patterns...');
    const { data: allRecords, error: allError } = await supabase
      .from('people_counting_raw')
      .select('timestamp, end_time')
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1000);

    if (allError) throw allError;

    const startPatterns = {};
    const endPatterns = {};
    
    allRecords.forEach(record => {
      const start = new Date(record.timestamp);
      const end = new Date(record.end_time);
      
      const startKey = `${start.getMinutes()}:${start.getSeconds()}`;
      const endKey = `${end.getMinutes()}:${end.getSeconds()}`;
      
      startPatterns[startKey] = (startPatterns[startKey] || 0) + 1;
      endPatterns[endKey] = (endPatterns[endKey] || 0) + 1;
    });

    console.log('   Start time patterns (top 5):');
    Object.entries(startPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([pattern, count]) => {
        console.log(`     ${pattern} - ${count} records`);
      });

    console.log('   End time patterns (top 5):');
    Object.entries(endPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([pattern, count]) => {
        console.log(`     ${pattern} - ${count} records`);
      });

    // 4. Check for non-hourly boundaries
    console.log('\n4️⃣ Checking for non-hourly boundaries...');
    const nonHourly = allRecords.filter(record => {
      const start = new Date(record.timestamp);
      const end = new Date(record.end_time);
      
      return start.getMinutes() !== 0 || start.getSeconds() !== 0 ||
             end.getMinutes() !== 59 || end.getSeconds() !== 59;
    });

    console.log(`   Found ${nonHourly.length} records with non-hourly boundaries`);
    
    if (nonHourly.length > 0) {
      console.log('   Sample (first 5):');
      nonHourly.slice(0, 5).forEach(record => {
        const start = new Date(record.timestamp);
        const end = new Date(record.end_time);
        console.log(`     ${record.timestamp} (${start.getMinutes()}:${start.getSeconds()}) to ${record.end_time} (${end.getMinutes()}:${end.getSeconds()})`);
      });
    }

    // Ask if user wants to clean up
    if (futureStats.length > 0 || nonHourly.length > 0) {
      console.log('\n⚠️  Found issues that need cleanup:');
      console.log(`   - ${futureStats.length} future records`);
      console.log(`   - ${nonHourly.length} non-hourly boundary records`);
      
      if (process.argv.includes('--fix')) {
        console.log('\n🔧 Fixing issues...');
        
        // Delete future records
        if (futureStats.length > 0) {
          const { error: deleteError } = await supabase
            .from('people_counting_raw')
            .delete()
            .gt('timestamp', new Date().toISOString());
            
          if (deleteError) throw deleteError;
          console.log(`   ✅ Deleted ${futureStats.length} future records`);
        }
        
        // Fix hourly boundaries
        if (nonHourly.length > 0) {
          console.log(`   ℹ️  To fix hourly boundaries, run the fix-hourly-boundaries.sql script in Supabase`);
        }
      } else {
        console.log('\n💡 To fix these issues, run with --fix flag:');
        console.log('   node scripts/debug/run-sql-check.js --fix');
      }
    } else {
      console.log('\n✅ No issues found!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the checks
runChecks();