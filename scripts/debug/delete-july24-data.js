#!/usr/bin/env node

/**
 * Delete all sensor data from July 24-25, 2025
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

async function deleteJuly24Data() {
  console.log('🗑️  Deleting data from July 24-25, 2025...\n');

  try {
    // First, let's check how much data we're about to delete
    const startDate = '2025-07-24T00:00:00.000Z';
    const endDate = '2025-07-25T23:59:59.999Z';
    
    console.log('📊 Checking data to be deleted...');
    console.log(`   Date range: ${startDate} to ${endDate}`);
    
    // Count records in people_counting_raw
    const { count: peopleCount, error: countError } = await supabase
      .from('people_counting_raw')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startDate)
      .lte('timestamp', endDate);
      
    if (countError) throw countError;
    
    console.log(`   Found ${peopleCount || 0} records in people_counting_raw`);
    
    // If no data found, exit
    if (!peopleCount || peopleCount === 0) {
      console.log('\n✅ No data found for July 24-25, 2025');
      return;
    }
    
    // Show sample of data to be deleted
    const { data: sampleData, error: sampleError } = await supabase
      .from('people_counting_raw')
      .select('id, sensor_id, timestamp, total_in, total_out')
      .gte('timestamp', startDate)
      .lte('timestamp', endDate)
      .limit(5);
      
    if (sampleError) throw sampleError;
    
    console.log('\n📋 Sample of records to be deleted:');
    sampleData.forEach(record => {
      console.log(`   ${record.timestamp} - In: ${record.total_in}, Out: ${record.total_out}`);
    });
    
    // Ask for confirmation
    console.log(`\n⚠️  WARNING: This will delete ${peopleCount} records from July 24-25, 2025`);
    console.log('   This action cannot be undone!');
    
    if (process.argv.includes('--confirm')) {
      console.log('\n🔄 Deleting records...');
      
      // Delete from people_counting_raw
      const { error: deleteError } = await supabase
        .from('people_counting_raw')
        .delete()
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      if (deleteError) throw deleteError;
      
      console.log(`\n✅ Successfully deleted ${peopleCount} records from July 24-25, 2025`);
      
      // Verify deletion
      const { count: remainingCount } = await supabase
        .from('people_counting_raw')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', startDate)
        .lte('timestamp', endDate);
        
      console.log(`   Remaining records for July 24-25: ${remainingCount || 0}`);
      
    } else {
      console.log('\n💡 To confirm deletion, run with --confirm flag:');
      console.log('   node scripts/debug/delete-july24-data.js --confirm');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the deletion
deleteJuly24Data();