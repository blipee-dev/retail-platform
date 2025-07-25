#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentData() {
  console.log('🔍 Checking recent sensor data...\n');

  try {
    // Check people_counting_raw for recent data
    const { data: recentData, error } = await supabase
      .from('people_counting_raw')
      .select('sensor_id, timestamp, in_count, out_count, created_at')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) throw error;

    console.log('📊 Latest 10 records in people_counting_raw:');
    if (recentData && recentData.length > 0) {
      recentData.forEach(record => {
        console.log(`  ${record.sensor_id}: ${record.timestamp} - In: ${record.in_count}, Out: ${record.out_count} (Created: ${record.created_at})`);
      });
      
      // Get the most recent timestamp
      const latestTimestamp = new Date(recentData[0].timestamp);
      const now = new Date();
      const hoursSinceLastData = (now - latestTimestamp) / (1000 * 60 * 60);
      
      console.log(`\n⏰ Last data: ${latestTimestamp.toISOString()}`);
      console.log(`⏱️  Hours since last data: ${hoursSinceLastData.toFixed(1)} hours`);
    } else {
      console.log('  No data found!');
    }

    // Check sensor health
    console.log('\n🏥 Checking sensor health...');
    const { data: sensorHealth, error: healthError } = await supabase
      .from('sensor_metadata')
      .select('sensor_id, name, is_active, last_seen, health_status')
      .eq('is_active', true)
      .order('sensor_id');

    if (healthError) throw healthError;

    if (sensorHealth) {
      sensorHealth.forEach(sensor => {
        const lastSeen = sensor.last_seen ? new Date(sensor.last_seen) : null;
        const hoursSinceLastSeen = lastSeen ? ((new Date() - lastSeen) / (1000 * 60 * 60)).toFixed(1) : 'Never';
        console.log(`  ${sensor.sensor_id} (${sensor.name}): ${sensor.health_status || 'unknown'} - Last seen: ${hoursSinceLastSeen} hours ago`);
      });
    }

    // Check if data exists for today during business hours
    console.log('\n📅 Checking today\'s business hours data...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: todayData, error: todayError } = await supabase
      .from('people_counting_raw')
      .select('sensor_id, timestamp')
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString())
      .order('timestamp', { ascending: false });

    if (todayError) throw todayError;

    console.log(`  Records for today: ${todayData?.length || 0}`);
    if (todayData && todayData.length > 0) {
      // Group by hour
      const hourlyCount = {};
      todayData.forEach(record => {
        const hour = new Date(record.timestamp).getHours();
        hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
      });
      
      console.log('  Records by hour:');
      Object.keys(hourlyCount).sort((a, b) => parseInt(a) - parseInt(b)).forEach(hour => {
        console.log(`    ${hour}:00 - ${hourlyCount[hour]} records`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRecentData();