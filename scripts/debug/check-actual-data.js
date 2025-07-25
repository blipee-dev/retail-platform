#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Use the credentials from the .env file
const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Checking Supabase Tables for Daily Report Data\n');

  try {
    // 1. Check people_counting_raw
    console.log('📊 1. PEOPLE_COUNTING_RAW TABLE:');
    console.log('================================\n');
    
    const { data: rawData, error: rawError } = await supabase
      .from('people_counting_raw')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (rawError) {
      console.log('❌ Error:', rawError.message);
    } else {
      console.log(`Found ${rawData?.length || 0} records\n`);
      
      if (rawData && rawData.length > 0) {
        console.log('Available fields:');
        Object.keys(rawData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof rawData[0][key]}`);
        });
        
        console.log('\nSample data (latest 3):');
        rawData.slice(0, 3).forEach(r => {
          console.log(`  ${r.timestamp} | Sensor: ${r.sensor_id}`);
          console.log(`    In: ${r.in_count || 0}, Out: ${r.out_count || 0}`);
          if (r.line1_in !== undefined) {
            console.log(`    Lines: L1(${r.line1_in}/${r.line1_out}), L2(${r.line2_in}/${r.line2_out}), L3(${r.line3_in}/${r.line3_out}), L4(${r.line4_in}/${r.line4_out})`);
          }
        });
      }
    }

    // 2. Check hourly_analytics
    console.log('\n\n📊 2. HOURLY_ANALYTICS TABLE:');
    console.log('==============================\n');
    
    const { data: hourlyData, error: hourlyError } = await supabase
      .from('hourly_analytics')
      .select('*')
      .order('hour_start', { ascending: false })
      .limit(10);
    
    if (hourlyError) {
      console.log('❌ Error:', hourlyError.message);
    } else {
      console.log(`Found ${hourlyData?.length || 0} records\n`);
      
      if (hourlyData && hourlyData.length > 0) {
        console.log('Available fields:');
        Object.keys(hourlyData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof hourlyData[0][key]}`);
        });
        
        console.log('\nSample data (latest 3):');
        hourlyData.slice(0, 3).forEach(r => {
          console.log(`  ${r.hour_start} | Store: ${r.store_id}`);
          console.log(`    Traffic: ${r.total_traffic || 0}, Entries: ${r.total_entries || 0}, Exits: ${r.total_exits || 0}`);
        });
      }
    }

    // 3. Check daily_analytics
    console.log('\n\n📊 3. DAILY_ANALYTICS TABLE:');
    console.log('=============================\n');
    
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(10);
    
    if (dailyError) {
      console.log('❌ Error:', dailyError.message);
    } else {
      console.log(`Found ${dailyData?.length || 0} records\n`);
      
      if (dailyData && dailyData.length > 0) {
        console.log('Available fields:');
        Object.keys(dailyData[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof dailyData[0][key]}`);
        });
        
        console.log('\nSample data (latest 3):');
        dailyData.slice(0, 3).forEach(r => {
          console.log(`  ${r.date} | Store: ${r.store_id}`);
          console.log(`    Total In: ${r.total_in || 0}, Out: ${r.total_out || 0}, Net: ${r.net_traffic || 0}`);
          console.log(`    Peak Hour: ${r.peak_hour || 'N/A'} with ${r.peak_hour_traffic || 0} visitors`);
        });
      }
    }

    // 4. Check stores and sensors
    console.log('\n\n🏪 STORES & SENSORS:');
    console.log('=====================\n');
    
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, timezone')
      .limit(10);
    
    if (stores && stores.length > 0) {
      console.log('Active stores:');
      stores.forEach(s => {
        console.log(`  - ${s.name} (${s.id}) - ${s.timezone}`);
      });
    }
    
    const { data: sensors } = await supabase
      .from('sensor_metadata')
      .select('sensor_id, name, is_active, store_id')
      .eq('is_active', true)
      .limit(10);
    
    if (sensors && sensors.length > 0) {
      console.log('\nActive sensors:');
      sensors.forEach(s => {
        console.log(`  - ${s.name} (${s.sensor_id}) - Store: ${s.store_id}`);
      });
    }

    // 5. Data availability summary
    console.log('\n\n📈 DATA AVAILABILITY SUMMARY:');
    console.log('==============================\n');
    
    // Check data range
    const { data: oldest } = await supabase
      .from('people_counting_raw')
      .select('timestamp')
      .order('timestamp', { ascending: true })
      .limit(1);
    
    const { data: newest } = await supabase
      .from('people_counting_raw')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (oldest && newest && oldest[0] && newest[0]) {
      console.log(`Data range: ${oldest[0].timestamp} to ${newest[0].timestamp}`);
    }
    
    // Count today's records
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayCount } = await supabase
      .from('people_counting_raw')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString());
    
    console.log(`Today's records: ${todayCount || 0}`);

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

checkData();