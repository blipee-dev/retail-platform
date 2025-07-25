#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStores() {
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, country, timezone, store_id');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Store Language Settings:');
  console.log('=======================');
  stores.forEach(store => {
    console.log(`${store.name} (${store.store_id})`);
    console.log('  ID:', store.id);
    console.log('  Country:', store.country || 'NOT SET ❌');
    console.log('  Timezone:', store.timezone);
    
    // Determine language based on current logic
    let language = 'en';
    if (store.country === 'ES') language = 'es';
    if (store.country === 'PT') language = 'pt';
    console.log('  → Will use language:', language);
    console.log('');
  });
  
  console.log('To fix language detection, we need to:');
  console.log('1. Set the country field for each store, OR');
  console.log('2. Update the logic to use timezone to determine language');
}

checkStores().catch(console.error);