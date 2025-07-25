#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Import the function from daily-report-sender
const getLanguageForStore = function(store) {
  // Determine language based on timezone
  // Portugal timezones
  if (store.timezone && (store.timezone.includes('Lisbon') || store.timezone.includes('Portugal'))) {
    return 'pt';
  }
  // Spain timezones
  if (store.timezone && (store.timezone.includes('Madrid') || store.timezone.includes('Barcelona') || store.timezone.includes('Spain'))) {
    return 'es';
  }
  // Default to English
  return 'en';
};

async function checkStores() {
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, timezone, store_id');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Store Language Detection:');
  console.log('========================');
  stores.forEach(store => {
    const language = getLanguageForStore(store);
    console.log(`${store.name}`);
    console.log('  Timezone:', store.timezone);
    console.log('  → Detected language:', language);
    console.log('');
  });
}

checkStores().catch(console.error);