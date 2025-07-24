#!/usr/bin/env node

// This shows the difference between the current query and a more forgiving one

require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env.production' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.argv[2];

if (!supabaseServiceKey) {
  console.error('Usage: node fix-sensor-query.js <SUPABASE_SERVICE_ROLE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQueries() {
  console.log('🔍 Testing different sensor queries...\n');
  
  // 1. Simple query - just get all sensors
  console.log('1. ALL sensors (no joins):');
  const { data: all, error: allError } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, status, store_id');
  
  if (allError) {
    console.error('Error:', allError.message);
  } else {
    console.log(`   Found ${all?.length || 0} sensors total`);
    all?.forEach(s => {
      console.log(`   - ${s.sensor_name}: status=${s.status}, store_id=${s.store_id}`);
    });
  }
  
  // 2. Active sensors (no joins)
  console.log('\n2. Active sensors (no joins):');
  const { data: active, error: activeError } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, status')
    .in('status', ['online', 'warning']);
  
  if (activeError) {
    console.error('Error:', activeError.message);
  } else {
    console.log(`   Found ${active?.length || 0} active sensors`);
  }
  
  // 3. Current workflow query (with inner joins)
  console.log('\n3. Current workflow query (INNER joins):');
  const { data: withJoins, error: joinError } = await supabase
    .from('sensor_metadata')
    .select(`
      *,
      stores!inner(
        id,
        name,
        timezone,
        organizations!inner(
          id,
          name
        )
      )
    `)
    .in('status', ['online', 'warning']);
  
  if (joinError) {
    console.error('Error:', joinError.message);
  } else {
    console.log(`   Found ${withJoins?.length || 0} sensors with complete relationships`);
  }
  
  // 4. More forgiving query (LEFT joins)
  console.log('\n4. Forgiving query (LEFT joins):');
  const { data: leftJoins, error: leftError } = await supabase
    .from('sensor_metadata')
    .select(`
      *,
      stores(
        id,
        name,
        timezone,
        organizations(
          id,
          name
        )
      )
    `)
    .in('status', ['online', 'warning']);
  
  if (leftError) {
    console.error('Error:', leftError.message);
  } else {
    console.log(`   Found ${leftJoins?.length || 0} sensors (including those without stores)`);
    leftJoins?.forEach(s => {
      console.log(`   - ${s.sensor_name}: store=${s.stores?.name || 'NO STORE'}`);
    });
  }
  
  // 5. Check if there are any stores
  console.log('\n5. Checking stores table:');
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('id, name, organization_id');
  
  if (storeError) {
    console.error('Error:', storeError.message);
  } else {
    console.log(`   Found ${stores?.length || 0} stores`);
  }
  
  // 6. Check if there are any organizations
  console.log('\n6. Checking organizations table:');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name');
  
  if (orgError) {
    console.error('Error:', orgError.message);
  } else {
    console.log(`   Found ${orgs?.length || 0} organizations`);
  }
}

testQueries().catch(console.error);