#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyWithRawData() {
  // Get JJ store info
  const { data: store } = await supabase
    .from('stores')
    .select('*')
    .eq('name', 'J&J - 01 - ArrábidaShopping')
    .single();
    
  console.log('🏪 Verifying data for:', store.name);
  console.log('Store ID:', store.id);
  console.log('');
  
  // Get raw data for yesterday
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const startDate = new Date(yesterday);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(yesterday);
  endDate.setHours(23, 59, 59, 999);
  
  console.log('📅 Checking raw data for:', yesterday.toISOString().split('T')[0]);
  console.log('From:', startDate.toISOString());
  console.log('To:', endDate.toISOString());
  console.log('');
  
  // Get raw people counting data
  const { data: rawData, error } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    .order('timestamp');
    
  if (error) {
    console.error('Error fetching raw data:', error);
    return;
  }
  
  console.log('📊 Raw Data Summary:');
  console.log('Total records found:', rawData.length);
  
  if (rawData.length === 0) {
    console.log('❌ No raw data found for this date');
    return;
  }
  
  // Calculate totals from raw data
  let totalPeopleIn = 0;
  let totalPasserby = 0;
  const hourlyData = {};
  
  rawData.forEach(record => {
    totalPeopleIn += record.people_in || 0;
    totalPasserby += record.passerby || 0;
    
    // Group by hour
    const hour = new Date(record.timestamp).getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { people_in: 0, passerby: 0, count: 0 };
    }
    hourlyData[hour].people_in += record.people_in || 0;
    hourlyData[hour].passerby += record.passerby || 0;
    hourlyData[hour].count++;
  });
  
  const captureRate = totalPasserby > 0 ? (totalPeopleIn / totalPasserby * 100).toFixed(2) : 0;
  
  console.log('');
  console.log('🔢 Calculated from Raw Data:');
  console.log('Total People In (Visitors):', totalPeopleIn);
  console.log('Total Passerby:', totalPasserby);
  console.log('Calculated Capture Rate:', captureRate + '%');
  console.log('');
  
  // Compare with analytics
  const { data: daily } = await supabase
    .from('daily_analytics')
    .select('*')
    .eq('store_id', store.id)
    .eq('date', yesterday.toISOString().split('T')[0])
    .single();
    
  if (daily) {
    console.log('📈 Analytics Table Shows:');
    console.log('Store Entries:', daily.store_entries);
    console.log('Passerby Count:', daily.passerby_count);
    console.log('Capture Rate:', daily.capture_rate + '%');
    console.log('');
    
    console.log('🔍 Comparison:');
    console.log('Visitors Match:', totalPeopleIn === daily.store_entries ? '✅' : '❌ (' + totalPeopleIn + ' vs ' + daily.store_entries + ')');
    console.log('Passerby Match:', totalPasserby === daily.passerby_count ? '✅' : '❌ (' + totalPasserby + ' vs ' + daily.passerby_count + ')');
    console.log('Capture Rate Match:', Math.abs(parseFloat(captureRate) - daily.capture_rate) < 0.1 ? '✅' : '❌ (' + captureRate + '% vs ' + daily.capture_rate + '%)');
  }
  
  // Show hourly breakdown
  console.log('');
  console.log('📊 Hourly Raw Data Breakdown:');
  console.log('Hour | Records | People In | Passerby | Capture Rate');
  console.log('-----|---------|-----------|----------|-------------');
  
  Object.keys(hourlyData).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hour => {
    const data = hourlyData[hour];
    const hourlyCapture = data.passerby > 0 ? (data.people_in / data.passerby * 100).toFixed(2) : 0;
    console.log(
      hour.padStart(4) + ' |' +
      String(data.count).padStart(8) + ' |' +
      String(data.people_in).padStart(10) + ' |' +
      String(data.passerby).padStart(9) + ' |' +
      String(hourlyCapture).padStart(11) + '%'
    );
  });
  
  // Check a few sample raw records
  console.log('');
  console.log('📋 Sample Raw Records:');
  console.log('Timestamp | People In | Passerby');
  console.log('----------|-----------|----------');
  rawData.slice(0, 5).forEach(record => {
    console.log(
      record.timestamp + ' | ' +
      String(record.people_in || 0).padStart(9) + ' | ' +
      String(record.passerby || 0).padStart(8)
    );
  });
}

verifyWithRawData().catch(console.error);