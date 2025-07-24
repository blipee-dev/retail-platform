#!/usr/bin/env node

/**
 * Remove duplicate records from people_counting_raw
 * Keeps only the most recently created record for each sensor_id + timestamp combination
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

async function findDuplicates() {
  console.log('🔍 Analyzing duplicate records...\n');
  
  try {
    // Get all records ordered by sensor and timestamp
    const { data: records, error } = await supabase
      .from('people_counting_raw')
      .select(`
        id,
        sensor_id,
        timestamp,
        end_time,
        created_at,
        total_in,
        total_out,
        sensor_metadata!inner(sensor_name, sensor_id)
      `)
      .order('sensor_id')
      .order('timestamp')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Group by sensor_id + timestamp to find duplicates
    const groups = {};
    records.forEach(record => {
      const key = `${record.sensor_id}_${record.timestamp}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(record);
    });
    
    // Find groups with duplicates
    const duplicateGroups = Object.entries(groups)
      .filter(([_, records]) => records.length > 1)
      .map(([key, records]) => ({
        key,
        records,
        sensor_name: records[0].sensor_metadata.sensor_name,
        sensor_id: records[0].sensor_metadata.sensor_id,
        timestamp: records[0].timestamp,
        count: records.length
      }));
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate records found!');
      return { duplicateGroups, totalDuplicates: 0, recordsToDelete: 0 };
    }
    
    // Calculate statistics
    const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count, 0);
    const recordsToDelete = duplicateGroups.reduce((sum, g) => sum + g.count - 1, 0);
    
    console.log(`📊 Duplicate Analysis:`);
    console.log(`   Groups with duplicates: ${duplicateGroups.length}`);
    console.log(`   Total duplicate records: ${totalDuplicates}`);
    console.log(`   Records to delete: ${recordsToDelete}`);
    console.log(`   Records to keep: ${duplicateGroups.length}\n`);
    
    // Show summary by sensor
    const sensorSummary = {};
    duplicateGroups.forEach(group => {
      const sensorKey = `${group.sensor_name} (${group.sensor_id})`;
      if (!sensorSummary[sensorKey]) {
        sensorSummary[sensorKey] = { groups: 0, records: 0, toDelete: 0 };
      }
      sensorSummary[sensorKey].groups++;
      sensorSummary[sensorKey].records += group.count;
      sensorSummary[sensorKey].toDelete += group.count - 1;
    });
    
    console.log(`📈 Duplicates by Sensor:`);
    Object.entries(sensorSummary)
      .sort(([,a], [,b]) => b.toDelete - a.toDelete)
      .forEach(([sensor, stats]) => {
        console.log(`   ${sensor}: ${stats.toDelete} to delete (${stats.groups} time periods)`);
      });
    
    // Show sample duplicates
    console.log(`\n📋 Sample Duplicate Groups (first 5):`);
    duplicateGroups.slice(0, 5).forEach((group, idx) => {
      console.log(`\n   ${idx + 1}. ${group.sensor_name} at ${group.timestamp}`);
      console.log(`      ${group.count} records found:`);
      group.records.forEach((record, i) => {
        const action = i === 0 ? 'KEEP (newest)' : 'DELETE';
        console.log(`      - ${record.created_at}: In=${record.total_in}, Out=${record.total_out} [${action}]`);
      });
    });
    
    return { duplicateGroups, totalDuplicates, recordsToDelete };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { duplicateGroups: [], totalDuplicates: 0, recordsToDelete: 0 };
  }
}

async function removeDuplicates(duplicateGroups) {
  console.log('\n🗑️  Removing duplicate records...');
  
  try {
    // Collect IDs to delete (all but the first/newest in each group)
    const idsToDelete = [];
    duplicateGroups.forEach(group => {
      // Skip the first record (newest) and mark others for deletion
      group.records.slice(1).forEach(record => {
        idsToDelete.push(record.id);
      });
    });
    
    if (idsToDelete.length === 0) {
      console.log('No records to delete.');
      return;
    }
    
    // Delete in batches of 500
    const batchSize = 500;
    let deleted = 0;
    
    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('people_counting_raw')
        .delete()
        .in('id', batch);
      
      if (error) throw error;
      
      deleted += batch.length;
      console.log(`   Deleted ${deleted}/${idsToDelete.length} records...`);
    }
    
    console.log(`\n✅ Successfully deleted ${deleted} duplicate records`);
    
    // Verify no duplicates remain
    const { duplicateGroups: remaining } = await findDuplicates();
    if (remaining.length === 0) {
      console.log('✅ Verification: No duplicates remain!');
    } else {
      console.log(`⚠️  Warning: ${remaining.length} duplicate groups still exist`);
    }
    
  } catch (error) {
    console.error('❌ Error during deletion:', error.message);
  }
}

async function main() {
  const { duplicateGroups, recordsToDelete } = await findDuplicates();
  
  if (recordsToDelete === 0) {
    return;
  }
  
  if (process.argv.includes('--confirm')) {
    await removeDuplicates(duplicateGroups);
  } else {
    console.log('\n💡 To remove these duplicates, run with --confirm flag:');
    console.log('   node scripts/debug/remove-duplicate-records.js --confirm');
  }
}

// Run the script
main();