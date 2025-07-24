#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  console.log('Testing single record insert...\n');
  
  const testRecord = {
    sensor_id: "ffc2438a-ee4f-4324-96da-08671ea3b23c",  // J&J sensor UUID
    store_id: "d719cc6b-1715-4721-8897-6f6cd0c025b0",
    organization_id: "d5ccfd16-f97f-4fcb-98ba-f2a689bc03f8",
    timestamp: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString(),  // 1 hour later
    line1_in: 10,
    line1_out: 5,
    line2_in: 20,
    line2_out: 15,
    line3_in: 0,
    line3_out: 0,
    line4_in: 0,
    line4_out: 0
  };
  
  console.log('Inserting record:', JSON.stringify(testRecord, null, 2));
  
  const { data, error } = await supabase
    .from('people_counting_raw')
    .insert(testRecord)
    .select();
  
  if (error) {
    console.error('\n❌ Insert failed:', error.message);
    console.error('Details:', error);
  } else {
    console.log('\n✅ Insert successful!');
    console.log('Inserted data:', data);
  }
  
  // Check if data exists
  console.log('\n📊 Checking recent data...');
  const { data: recent, error: fetchError } = await supabase
    .from('people_counting_raw')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (!fetchError && recent) {
    console.log(`Found ${recent.length} recent records`);
    recent.forEach(r => {
      console.log(`  - ${new Date(r.timestamp).toLocaleString()}: IN=${r.total_in}, OUT=${r.total_out}`);
    });
  }
}

testInsert().catch(console.error);