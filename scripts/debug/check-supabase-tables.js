#!/usr/bin/env node

const fetch = require('node-fetch');

async function checkSupabaseTables() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  console.log('🔍 Checking Supabase Table Structure');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get table information using the REST API
    console.log('\n📊 Fetching hourly_analytics table info...');
    
    // First, get a sample record to see actual columns
    const sampleResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?limit=1`,
      { headers }
    );
    
    if (sampleResponse.ok) {
      const sampleData = await sampleResponse.json();
      
      if (sampleData.length > 0) {
        console.log('\n✅ Table columns found in hourly_analytics:');
        console.log('-'.repeat(60));
        
        const columns = Object.keys(sampleData[0]).sort();
        columns.forEach((col, index) => {
          const value = sampleData[0][col];
          const type = value === null ? 'null' : 
                       typeof value === 'number' ? 'number' : 
                       value instanceof Date ? 'date' : 
                       typeof value;
          console.log(`${index + 1}. ${col.padEnd(30)} (${type})`);
        });
        
        console.log(`\nTotal columns: ${columns.length}`);
        
        // Check for specific columns the script expects
        console.log('\n🔍 Checking for columns used in aggregation script:');
        const requiredColumns = [
          'store_id',
          'organization_id', 
          'date',
          'hour',
          'store_entries',
          'store_exits',
          'passerby_count',
          'sample_count'
        ];
        
        const missingRequired = requiredColumns.filter(col => !columns.includes(col));
        if (missingRequired.length > 0) {
          console.log('\n❌ Missing required columns:');
          missingRequired.forEach(col => console.log(`  - ${col}`));
        } else {
          console.log('✅ All required columns exist');
        }
        
        // Check problematic columns
        console.log('\n🔍 Checking problematic columns:');
        const problematicColumns = ['avg_occupancy', 'peak_occupancy', 'occupancy_accuracy_score'];
        problematicColumns.forEach(col => {
          if (columns.includes(col)) {
            console.log(`✅ ${col} exists`);
          } else {
            console.log(`❌ ${col} DOES NOT EXIST`);
          }
        });
        
      } else {
        console.log('⚠️  Table is empty, cannot determine structure');
      }
    } else {
      const errorText = await sampleResponse.text();
      console.log(`❌ Failed to fetch table data: ${sampleResponse.status} - ${errorText}`);
    }
    
    // 2. Also check what columns we can query
    console.log('\n\n📊 Testing column queries...');
    
    // Test querying with select for specific columns
    const testColumns = ['date', 'hour', 'store_id', 'avg_occupancy'];
    
    for (const col of testColumns) {
      const testResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?select=${col}&limit=1`,
        { headers }
      );
      
      if (testResponse.ok) {
        console.log(`✅ Column '${col}' is queryable`);
      } else {
        const error = await testResponse.text();
        if (error.includes('does not exist')) {
          console.log(`❌ Column '${col}' does not exist`);
        } else {
          console.log(`⚠️  Column '${col}' query failed: ${error}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkSupabaseTables();