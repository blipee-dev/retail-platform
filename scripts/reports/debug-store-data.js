#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');
const { subDays } = require('date-fns');

// Initialize Supabase client
const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugStoreData() {
  console.log('🔍 Debugging Store Data\n');
  
  // 1. Get all stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*');
    
  if (storesError) {
    console.error('Error fetching stores:', storesError);
    return;
  }
  
  console.log(`Found ${stores.length} stores:\n`);
  stores.forEach(store => {
    console.log(`Store: ${store.name}`);
    console.log(`  ID: ${store.id}`);
    console.log(`  Store ID: ${store.store_id}`);
    console.log(`  Timezone: ${store.timezone}`);
    console.log(`  Active: ${store.is_active}`);
    console.log('');
  });
  
  // 2. Check recent data for each store
  console.log('\n📊 Checking recent data (last 7 days):\n');
  
  const endDate = new Date();
  const startDate = subDays(endDate, 7);
  
  for (const store of stores) {
    const { data: recentData, error } = await supabase
      .from('people_counting_raw')
      .select('timestamp, people_in, passerby')
      .eq('store_id', store.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (error) {
      console.error(`Error fetching data for ${store.name}:`, error);
      continue;
    }
    
    console.log(`${store.name} (ID: ${store.id}):`);
    if (recentData.length === 0) {
      console.log('  ❌ No recent data found');
    } else {
      console.log(`  ✅ Found ${recentData.length} recent records`);
      console.log(`  Latest: ${recentData[0].timestamp}`);
      console.log(`  Sample: ${recentData[0].people_in} visitors, ${recentData[0].passerby} passersby`);
    }
    console.log('');
  }
  
  // 3. Check if there's data with different store_id format
  console.log('\n🔍 Checking for data with store_id field:\n');
  
  const { data: sampleData, error: sampleError } = await supabase
    .from('people_counting_raw')
    .select('store_id, count(*)')
    .gte('timestamp', startDate.toISOString())
    .limit(10);
    
  if (!sampleError && sampleData) {
    const uniqueStoreIds = [...new Set(sampleData.map(d => d.store_id))];
    console.log('Unique store_ids in recent data:', uniqueStoreIds);
  }
}

debugStoreData().catch(console.error);