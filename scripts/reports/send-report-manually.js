#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');
const { format, subDays } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

// Initialize Supabase client
const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get store ID from command line or use JJ as default
const storeIdArg = process.argv[2];

async function sendManualReport() {
  // Get the store
  let store;
  if (storeIdArg) {
    const { data } = await supabase
      .from('stores')
      .select('*, organizations(name)')
      .eq('id', storeIdArg)
      .single();
    store = data;
  } else {
    // Default to JJ store
    const { data } = await supabase
      .from('stores')
      .select('*, organizations(name)')
      .eq('name', 'J&J - 01 - ArrábidaShopping')
      .single();
    store = data;
  }
  
  if (!store) {
    console.error('❌ Store not found');
    return;
  }
  
  console.log(`📧 Sending manual report for: ${store.name}`);
  console.log(`   Store ID: ${store.id}`);
  console.log(`   Timezone: ${store.timezone}`);
  
  // Get yesterday's date in store timezone
  const storeNow = utcToZonedTime(new Date(), store.timezone);
  const reportDate = subDays(storeNow, 1);
  
  console.log(`   Report Date: ${format(reportDate, 'yyyy-MM-dd')}`);
  console.log('');
  
  // Import and run the report sender functions
  const reportSender = require('./daily-report-sender.js');
  
  // We need to execute the main logic but for a specific store
  // Since the module doesn't export functions, we'll need to set environment variables
  process.env.SPECIFIC_STORE = store.id;
  process.env.TEST_MODE = 'false';
  
  // Execute the script
  console.log('🚀 Executing report generation...\n');
  require('./daily-report-sender.js');
}

// Check if running directly
if (require.main === module) {
  sendManualReport().catch(console.error);
}