#!/usr/bin/env node

require('dotenv').config({ path: '.env.production' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 Analyzing People Counting Data Tables\n');

  try {
    // 1. Check people_counting_raw structure and recent data
    console.log('📊 1. PEOPLE_COUNTING_RAW TABLE:');
    console.log('================================\n');
    
    // Get table structure
    const { data: rawColumns } = await supabase
      .from('people_counting_raw')
      .select('*')
      .limit(0);
    
    console.log('Table columns:', Object.keys(rawColumns || {}));
    
    // Get sample recent data
    const { data: rawData, error: rawError } = await supabase
      .from('people_counting_raw')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);
    
    if (rawError) throw rawError;
    
    console.log('\nSample records (latest 5):');
    rawData?.forEach(record => {
      console.log(`  ${record.timestamp} | Sensor: ${record.sensor_id} | In: ${record.in_count} | Out: ${record.out_count}`);
    });
    
    // Get data range
    const { data: dataRange } = await supabase
      .from('people_counting_raw')
      .select('timestamp')
      .order('timestamp', { ascending: true })
      .limit(1);
    
    const { data: dataRangeEnd } = await supabase
      .from('people_counting_raw')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    console.log(`\nData range: ${dataRange?.[0]?.timestamp} to ${dataRangeEnd?.[0]?.timestamp}`);
    
    // Count records by day for last 7 days
    const { data: dailyCounts } = await supabase
      .from('people_counting_raw')
      .select('timestamp')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const countsByDay = {};
    dailyCounts?.forEach(record => {
      const day = record.timestamp.split('T')[0];
      countsByDay[day] = (countsByDay[day] || 0) + 1;
    });
    
    console.log('\nRecords per day (last 7 days):');
    Object.entries(countsByDay).sort().forEach(([day, count]) => {
      console.log(`  ${day}: ${count} records`);
    });

    // 2. Check hourly_analytics table
    console.log('\n\n📊 2. HOURLY_ANALYTICS TABLE:');
    console.log('==============================\n');
    
    const { data: hourlyData, error: hourlyError } = await supabase
      .from('hourly_analytics')
      .select('*')
      .order('hour_start', { ascending: false })
      .limit(5);
    
    if (hourlyError) {
      console.log('❌ Error accessing hourly_analytics:', hourlyError.message);
    } else {
      console.log('Sample records (latest 5):');
      hourlyData?.forEach(record => {
        console.log(`  ${record.hour_start} | Store: ${record.store_id} | Traffic: ${record.total_traffic} | Avg dwell: ${record.avg_dwell_time}`);
      });
    }

    // 3. Check daily_analytics table
    console.log('\n\n📊 3. DAILY_ANALYTICS TABLE:');
    console.log('=============================\n');
    
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    if (dailyError) {
      console.log('❌ Error accessing daily_analytics:', dailyError.message);
    } else {
      console.log('Sample records (latest 5):');
      dailyData?.forEach(record => {
        console.log(`  ${record.date} | Store: ${record.store_id} | Traffic: ${record.total_traffic} | Peak hour: ${record.peak_hour}`);
      });
    }

    // 4. Check what fields are available
    console.log('\n\n📋 AVAILABLE DATA FIELDS:');
    console.log('=========================\n');
    
    if (rawData && rawData.length > 0) {
      console.log('people_counting_raw fields:');
      Object.keys(rawData[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof rawData[0][key]}`);
      });
    }
    
    if (hourlyData && hourlyData.length > 0) {
      console.log('\nhourly_analytics fields:');
      Object.keys(hourlyData[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof hourlyData[0][key]}`);
      });
    }
    
    if (dailyData && dailyData.length > 0) {
      console.log('\ndaily_analytics fields:');
      Object.keys(dailyData[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof dailyData[0][key]}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();