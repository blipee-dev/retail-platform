#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking Analytics Table Schemas\n');
  
  // Check hourly_analytics columns
  console.log('📊 HOURLY_ANALYTICS Table:');
  console.log('=' .repeat(50));
  
  const { data: hourlyColumns, error: hourlyError } = await supabase
    .rpc('get_table_columns', { table_name: 'hourly_analytics' });
    
  if (hourlyError) {
    // Try alternative method
    const { data: sampleHourly, error: sampleError } = await supabase
      .from('hourly_analytics')
      .select('*')
      .limit(1);
      
    if (!sampleError && sampleHourly && sampleHourly.length > 0) {
      console.log('Columns found:');
      Object.keys(sampleHourly[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof sampleHourly[0][col]}`);
      });
    } else {
      console.error('Error getting schema:', hourlyError);
    }
  } else if (hourlyColumns) {
    hourlyColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  }
  
  console.log('\n📊 DAILY_ANALYTICS Table:');
  console.log('=' .repeat(50));
  
  const { data: dailyColumns, error: dailyError } = await supabase
    .rpc('get_table_columns', { table_name: 'daily_analytics' });
    
  if (dailyError) {
    // Try alternative method
    const { data: sampleDaily, error: sampleError } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(1);
      
    if (!sampleError && sampleDaily && sampleDaily.length > 0) {
      console.log('Columns found:');
      Object.keys(sampleDaily[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof sampleDaily[0][col]}`);
      });
    } else {
      console.error('Error getting schema:', dailyError);
    }
  } else if (dailyColumns) {
    dailyColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
  }
  
  // Check for sample data
  console.log('\n📊 Sample Data Check:');
  console.log('=' .repeat(50));
  
  const { data: recentDaily } = await supabase
    .from('daily_analytics')
    .select('date, store_id, total_entries, store_entries, passerby_count, capture_rate, peak_hour')
    .order('date', { ascending: false })
    .limit(3);
    
  if (recentDaily && recentDaily.length > 0) {
    console.log('\nRecent daily_analytics records:');
    recentDaily.forEach(record => {
      console.log(`\nDate: ${record.date}`);
      console.log(`  Store ID: ${record.store_id}`);
      console.log(`  Total Entries: ${record.total_entries}`);
      console.log(`  Store Entries: ${record.store_entries}`);
      console.log(`  Passerby Count: ${record.passerby_count}`);
      console.log(`  Capture Rate: ${record.capture_rate}`);
      console.log(`  Peak Hour: ${record.peak_hour}`);
    });
  }
}

// Create RPC function if it doesn't exist
async function createColumnFunction() {
  const functionSQL = `
    CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
    RETURNS TABLE(column_name text, data_type text, is_nullable text)
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        column_name::text, 
        data_type::text,
        is_nullable::text
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND information_schema.columns.table_name = get_table_columns.table_name
      ORDER BY ordinal_position;
    $$;
  `;
  
  const { error } = await supabase.rpc('query', { query: functionSQL });
  if (error) console.log('Note: Could not create helper function');
}

// Run the check
createColumnFunction().then(() => checkSchema()).catch(console.error);