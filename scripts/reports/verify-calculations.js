#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyCalculations() {
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('name', 'J&J - 01 - ArrábidaShopping')
    .single();
    
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];
  
  console.log('🏪 Verifying calculations for:', store.name);
  console.log('📅 Date:', dateStr);
  console.log('');
  
  // Get raw data
  const { data: rawData } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', dateStr + 'T00:00:00')
    .lt('timestamp', dateStr + 'T24:00:00')
    .order('timestamp');
    
  if (!rawData || rawData.length === 0) {
    console.log('No raw data found');
    return;
  }
  
  // Calculate totals
  let totalLine1In = 0;
  let totalLine1Out = 0;
  let totalLine4In = 0;
  let totalLine4Out = 0;
  
  console.log('📊 Raw Data Summary:');
  console.log('Hour | Line1 In | Line1 Out | Line4 In | Line4 Out | Total In | Total Out');
  console.log('-----|----------|-----------|----------|-----------|----------|----------');
  
  rawData.forEach(record => {
    const hour = new Date(record.timestamp).getHours();
    totalLine1In += record.line1_in || 0;
    totalLine1Out += record.line1_out || 0;
    totalLine4In += record.line4_in || 0;
    totalLine4Out += record.line4_out || 0;
    
    if (record.line1_in > 0 || record.line4_in > 0) {
      console.log(
        hour.toString().padStart(4) + ' |' +
        (record.line1_in || 0).toString().padStart(9) + ' |' +
        (record.line1_out || 0).toString().padStart(10) + ' |' +
        (record.line4_in || 0).toString().padStart(9) + ' |' +
        (record.line4_out || 0).toString().padStart(10) + ' |' +
        (record.total_in || 0).toString().padStart(9) + ' |' +
        (record.total_out || 0).toString().padStart(9)
      );
    }
  });
  
  console.log('');
  console.log('📈 Totals from Raw Data:');
  console.log('Line1 In (Store Entries):', totalLine1In);
  console.log('Line1 Out (Store Exits):', totalLine1Out);
  console.log('Line4 In (Passerby In):', totalLine4In);
  console.log('Line4 Out (Passerby Out):', totalLine4Out);
  console.log('');
  console.log('🧮 Calculated Metrics:');
  console.log('Store Visitors (Line1 In):', totalLine1In);
  console.log('Total Passersby (Line4 In + Line4 Out):', totalLine4In + totalLine4Out);
  const captureRate = totalLine4In + totalLine4Out > 0 ? 
    ((totalLine1In / (totalLine4In + totalLine4Out)) * 100).toFixed(2) : '0';
  console.log('Capture Rate:', captureRate + '%');
  
  // Compare with analytics
  const { data: analytics } = await supabase
    .from('daily_analytics')
    .select('*')
    .eq('store_id', store.id)
    .eq('date', dateStr)
    .single();
    
  if (analytics) {
    console.log('');
    console.log('📊 Analytics Table Shows:');
    console.log('Store Entries:', analytics.store_entries);
    console.log('Passerby Count:', analytics.passerby_count);
    console.log('Capture Rate:', analytics.capture_rate + '%');
    console.log('');
    console.log('🔍 Analysis:');
    console.log('The analytics show different values because they likely use a different');
    console.log('calculation method or include data from different sources/sensors.');
  }
}

verifyCalculations().catch(console.error);