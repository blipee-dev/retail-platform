#!/usr/bin/env node

/**
 * Remove all sensor data with timestamps in the future
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || 'https://kqfwccpnqcgxuydvmdvb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZndjY3BucWNneHV5ZHZtZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI2NjI0NiwiZXhwIjoyMDQ4ODQyMjQ2fQ.IQJGfAJJKJgNy-ANaRsJvBjO6N7Dc0W7I6bG8w2NTIE';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeFutureData() {
  console.log('🔍 Checking for future data...\n');

  try {
    const nowUTC = new Date().toISOString();
    console.log(`📅 Current UTC time: ${nowUTC}`);
    console.log(`   (Any data after this time will be removed)\n`);
    
    // First, count future records
    const { count: futureCount, error: countError } = await supabase
      .from('people_counting_raw')
      .select('*', { count: 'exact', head: true })
      .gt('timestamp', nowUTC);
      
    if (countError) throw countError;
    
    if (!futureCount || futureCount === 0) {
      console.log('✅ No future data found!');
      return;
    }
    
    console.log(`⚠️  Found ${futureCount} records with future timestamps`);
    
    // Show sample of future data
    const { data: sampleData, error: sampleError } = await supabase
      .from('people_counting_raw')
      .select('id, sensor_id, timestamp, total_in, total_out')
      .gt('timestamp', nowUTC)
      .order('timestamp', { ascending: true })
      .limit(10);
      
    if (sampleError) throw sampleError;
    
    console.log('\n📋 Sample of future records:');
    sampleData.forEach(record => {
      const localTime = new Date(record.timestamp);
      const hoursInFuture = Math.round((localTime - new Date()) / (1000 * 60 * 60));
      console.log(`   ${record.timestamp} (+${hoursInFuture}h) - In: ${record.total_in}, Out: ${record.total_out}`);
    });
    
    if (futureCount > 10) {
      console.log(`   ... and ${futureCount - 10} more records`);
    }
    
    // Delete if confirmed
    if (process.argv.includes('--confirm')) {
      console.log('\n🗑️  Deleting future records...');
      
      const { error: deleteError } = await supabase
        .from('people_counting_raw')
        .delete()
        .gt('timestamp', nowUTC);
        
      if (deleteError) throw deleteError;
      
      console.log(`\n✅ Successfully deleted ${futureCount} future records`);
      
      // Verify deletion
      const { count: remainingCount } = await supabase
        .from('people_counting_raw')
        .select('*', { count: 'exact', head: true })
        .gt('timestamp', nowUTC);
        
      console.log(`   Remaining future records: ${remainingCount || 0}`);
      
    } else {
      console.log('\n💡 To delete these records, run with --confirm flag:');
      console.log('   node scripts/debug/remove-future-data.js --confirm');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the cleanup
removeFutureData();