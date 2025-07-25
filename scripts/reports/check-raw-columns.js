#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRawDataColumns() {
  // Get JJ store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('name', 'J&J - 01 - ArrábidaShopping')
    .single();
    
  console.log('🏪 Checking raw data for:', store.name);
  
  // Get recent records
  const { data: sample, error } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .order('timestamp', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('📊 Found', sample.length, 'records');
  console.log('');
  
  if (sample && sample.length > 0) {
    console.log('Available columns:', Object.keys(sample[0]).join(', '));
    console.log('');
    
    // Show non-zero values
    console.log('Records with data:');
    sample.forEach(record => {
      const nonZeroFields = {};
      Object.keys(record).forEach(key => {
        if (record[key] !== null && record[key] !== 0 && 
            key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
          nonZeroFields[key] = record[key];
        }
      });
      
      if (Object.keys(nonZeroFields).length > 2) { // More than just timestamp and store_id
        console.log('');
        console.log('Record:', record.timestamp);
        Object.entries(nonZeroFields).forEach(([key, value]) => {
          console.log('  ' + key + ':', value);
        });
      }
    });
  }
  
  // Check specific columns that might contain the data
  console.log('');
  console.log('🔍 Checking for specific data columns:');
  const possibleColumns = ['people_in', 'people_out', 'passerby', 'passerby_in', 'passerby_out', 
                          'in_count', 'out_count', 'pass_by', 'visitors', 'entries', 'exits',
                          'total_in', 'total_out', 'count_in', 'count_out'];
  
  if (sample && sample.length > 0) {
    const existingColumns = Object.keys(sample[0]);
    possibleColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        const values = sample.map(r => r[col]).filter(v => v > 0);
        if (values.length > 0) {
          console.log('✅', col, '- Has data! Sample values:', values.slice(0, 3));
        } else {
          console.log('❌', col, '- Column exists but all zeros');
        }
      }
    });
  }
}

checkRawDataColumns().catch(console.error);