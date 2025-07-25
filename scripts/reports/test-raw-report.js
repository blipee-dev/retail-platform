#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');
const { format } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRawDataReport() {
  // Get JJ store
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('name', 'J&J - 01 - ArrábidaShopping')
    .single();
    
  console.log('🏪 Testing report for:', store.name);
  console.log('Timezone:', store.timezone);
  console.log('');
  
  // Get yesterday's date
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  // Import the updated getReportData function
  const reportSender = require('./daily-report-sender.js');
  
  // Mock the store with timezone
  const storeWithTz = { ...store, timezone: store.timezone || 'Europe/Lisbon' };
  
  console.log('📊 Running getReportData for', dateStr);
  console.log('This will calculate:');
  console.log('- Total Visitors = line1_in + line2_in + line3_in');
  console.log('- Total Passersby = line4_in + line4_out');
  console.log('- Working hours: 10:00 to 23:59 local time');
  console.log('');
  
  // Get raw data to show calculation
  const { data: rawData } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', dateStr + 'T00:00:00')
    .lt('timestamp', dateStr + 'T24:00:00')
    .order('timestamp');
    
  if (rawData && rawData.length > 0) {
    console.log('📋 Sample calculations from raw data:');
    console.log('');
    
    // Show a few examples
    const samples = rawData.filter(r => 
      r.line1_in > 0 || r.line2_in > 0 || r.line3_in > 0 || r.line4_in > 0
    ).slice(0, 3);
    
    samples.forEach(record => {
      const localTime = utcToZonedTime(new Date(record.timestamp), store.timezone);
      const hour = localTime.getHours();
      
      console.log(`Hour ${hour}:00 (${format(localTime, 'HH:mm zzz')})`);
      console.log(`  Line 1 in: ${record.line1_in || 0}`);
      console.log(`  Line 2 in: ${record.line2_in || 0}`);
      console.log(`  Line 3 in: ${record.line3_in || 0}`);
      console.log(`  Line 4 in: ${record.line4_in || 0}, out: ${record.line4_out || 0}`);
      console.log(`  → Visitors: ${(record.line1_in || 0) + (record.line2_in || 0) + (record.line3_in || 0)}`);
      console.log(`  → Passersby: ${(record.line4_in || 0) + (record.line4_out || 0)}`);
      console.log('');
    });
  }
}

testRawDataReport().catch(console.error);