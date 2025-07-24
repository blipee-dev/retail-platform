#!/usr/bin/env node

// This script tests the exact query used by the workflow

require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env.production' });

// Set environment variables like the workflow does
process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.argv[2];

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Usage: node test-workflow-query.js <SUPABASE_SERVICE_ROLE_KEY>');
  console.error('\nYou can get this from your GitHub secrets or Supabase project settings');
  process.exit(1);
}

const { SupabaseClient } = require('../workflows/lib/supabase-client');

async function testQuery() {
  console.log('Testing workflow sensor query...\n');
  
  try {
    const supabase = new SupabaseClient();
    
    console.log('1. Testing getActiveSensors() method...');
    const sensors = await supabase.getActiveSensors();
    
    console.log(`\nFound ${sensors.length} active sensors\n`);
    
    if (sensors.length === 0) {
      console.log('❌ No active sensors found!\n');
      console.log('Possible reasons:');
      console.log('1. All sensors have status != "online" or "warning"');
      console.log('2. Sensors are missing store relationships');
      console.log('3. Stores are missing organization relationships');
      console.log('4. RLS policies might be blocking access\n');
      
      // Test a simpler query
      console.log('2. Testing simple query without joins...');
      const { client } = supabase;
      
      const { data: simpleSensors, error } = await client
        .from('sensor_metadata')
        .select('sensor_id, sensor_name, status, is_active')
        .order('sensor_name');
      
      if (error) {
        console.error('Error:', error.message);
      } else {
        console.log(`\nAll sensors in table: ${simpleSensors?.length || 0}`);
        if (simpleSensors && simpleSensors.length > 0) {
          simpleSensors.forEach(s => {
            console.log(`  ${s.sensor_name}: status=${s.status}, active=${s.is_active}`);
          });
        }
      }
    } else {
      sensors.forEach(sensor => {
        console.log(`✅ ${sensor.sensor_name}`);
        console.log(`   Status: ${sensor.status}`);
        console.log(`   Store: ${sensor.stores?.name || 'N/A'}`);
        console.log(`   Organization: ${sensor.stores?.organizations?.name || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
  }
}

testQuery();