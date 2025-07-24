#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyRecentData() {
  console.log('🔍 Checking recent data in Supabase...\n');

  try {
    // Check last 10 records in people_counting_raw
    const { data: recentData, error: dataError } = await supabase
      .from('people_counting_raw')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (dataError) {
      console.error('❌ Error fetching data:', dataError);
      return;
    }

    console.log(`📊 Found ${recentData.length} recent records in people_counting_raw\n`);

    if (recentData.length > 0) {
      console.log('Latest record:');
      const latest = recentData[0];
      console.log(`  ID: ${latest.id}`);
      console.log(`  Sensor: ${latest.sensor_id}`);
      console.log(`  Timestamp: ${latest.timestamp}`);
      console.log(`  Created: ${latest.created_at}`);
      console.log(`  Line 1: IN=${latest.line1_in}, OUT=${latest.line1_out}`);
      console.log(`  Line 2: IN=${latest.line2_in}, OUT=${latest.line2_out}`);
      console.log(`  Line 3: IN=${latest.line3_in}, OUT=${latest.line3_out}`);
      console.log(`  Line 4: IN=${latest.line4_in}, OUT=${latest.line4_out}`);
      console.log(`  Total: IN=${latest.total_in}, OUT=${latest.total_out}\n`);
    }

    // Check records from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayData, error: todayError } = await supabase
      .from('people_counting_raw')
      .select('sensor_id, timestamp')
      .gte('timestamp', today.toISOString())
      .order('timestamp', { ascending: false });

    if (!todayError && todayData) {
      console.log(`📅 Records from today (${today.toISOString().split('T')[0]}): ${todayData.length}`);
      
      // Group by sensor
      const bySensor = todayData.reduce((acc, record) => {
        acc[record.sensor_id] = (acc[record.sensor_id] || 0) + 1;
        return acc;
      }, {});

      console.log('\nRecords by sensor:');
      Object.entries(bySensor).forEach(([sensorId, count]) => {
        console.log(`  ${sensorId}: ${count} records`);
      });
    }

    // Check last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { data: recentHourData, error: hourError } = await supabase
      .from('people_counting_raw')
      .select('sensor_id, timestamp, created_at')
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false });

    if (!hourError && recentHourData) {
      console.log(`\n⏰ Records inserted in last hour: ${recentHourData.length}`);
      if (recentHourData.length > 0) {
        console.log('Recent insertions:');
        recentHourData.slice(0, 5).forEach(record => {
          console.log(`  ${record.sensor_id} - ${record.timestamp} (inserted at ${record.created_at})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyRecentData();