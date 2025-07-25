#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

async function checkTableColumns() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Checking hourly_analytics table structure...\n');
  
  try {
    // Get one record to see the actual columns
    const { data, error } = await supabase
      .from('hourly_analytics')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Table columns found:');
      console.log('-'.repeat(50));
      
      const columns = Object.keys(data[0]).sort();
      columns.forEach(col => {
        const value = data[0][col];
        const type = value === null ? 'null' : typeof value;
        console.log(`  ${col.padEnd(30)} (${type})`);
      });
      
      console.log('\n📊 Checking for missing columns that script expects:');
      const expectedColumns = [
        'store_id',
        'organization_id',
        'date',
        'hour',
        'store_entries',
        'store_exits',
        'passerby_count',
        'passerby_in',
        'passerby_out',
        'capture_rate',
        'entry_line1_pct',
        'entry_line2_pct',
        'entry_line3_pct',
        'exit_line1_pct',
        'exit_line2_pct',
        'exit_line3_pct',
        'sample_count',
        'avg_occupancy',
        'peak_occupancy',
        'line1_in',
        'line1_out',
        'line2_in',
        'line2_out',
        'line3_in',
        'line3_out',
        'line4_in',
        'line4_out'
      ];
      
      const missingColumns = expectedColumns.filter(col => !columns.includes(col));
      if (missingColumns.length > 0) {
        console.log('\n❌ Missing columns:');
        missingColumns.forEach(col => console.log(`  - ${col}`));
      } else {
        console.log('✅ All expected columns exist');
      }
      
      const extraColumns = columns.filter(col => !expectedColumns.includes(col));
      if (extraColumns.length > 0) {
        console.log('\n➕ Extra columns in table:');
        extraColumns.forEach(col => console.log(`  - ${col}`));
      }
      
    } else {
      console.log('⚠️  No data in table to check structure');
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkTableColumns();