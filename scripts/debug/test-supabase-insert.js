#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection and data insertion...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? '✓ Present' : '✗ Missing'}\n`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.log('\nPlease set environment variables:');
  console.log('  export SUPABASE_URL="your-supabase-url"');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // 1. Test connection by fetching sensor metadata
    console.log('1️⃣ Testing connection - fetching sensors...');
    const { data: sensors, error: sensorError } = await supabase
      .from('sensor_metadata')
      .select('sensor_id, sensor_name, is_active')
      .eq('is_active', true)
      .limit(5);

    if (sensorError) {
      console.error('❌ Connection failed:', sensorError);
      return false;
    }

    console.log(`✅ Connection successful! Found ${sensors.length} active sensors:`);
    sensors.forEach(s => console.log(`   - ${s.sensor_name} (${s.sensor_id})`));
    console.log('');

    // 2. Check recent data
    console.log('2️⃣ Checking recent data in people_counting_raw...');
    const { data: recentData, error: dataError } = await supabase
      .from('people_counting_raw')
      .select('id, sensor_id, timestamp, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (dataError) {
      console.error('❌ Error fetching data:', dataError);
      return false;
    }

    if (recentData.length === 0) {
      console.log('⚠️  No data found in people_counting_raw table');
    } else {
      console.log(`✅ Found ${recentData.length} recent records:`);
      recentData.forEach(r => {
        const age = new Date() - new Date(r.created_at);
        const ageMinutes = Math.floor(age / 60000);
        console.log(`   - ${r.sensor_id}: ${r.timestamp} (inserted ${ageMinutes} minutes ago)`);
      });
    }
    console.log('');

    // 3. Test insert with a dummy record
    console.log('3️⃣ Testing data insertion...');
    if (sensors.length > 0) {
      const testSensor = sensors[0];
      const testTimestamp = new Date();
      testTimestamp.setMinutes(0, 0, 0); // Round to hour
      
      // First check if this record already exists
      const { data: existing } = await supabase
        .from('people_counting_raw')
        .select('id')
        .eq('sensor_id', testSensor.sensor_id)
        .eq('timestamp', testTimestamp.toISOString())
        .single();

      if (existing) {
        console.log('⚠️  Test record already exists, will update instead');
        
        const { error: updateError } = await supabase
          .from('people_counting_raw')
          .update({
            line1_in: Math.floor(Math.random() * 10),
            line1_out: Math.floor(Math.random() * 10)
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('❌ Update failed:', updateError);
        } else {
          console.log('✅ Successfully updated existing record');
        }
      } else {
        // Get required fields from sensor metadata
        const { data: sensorDetails } = await supabase
          .from('sensor_metadata')
          .select('id, store_id, stores!inner(organization_id)')
          .eq('sensor_id', testSensor.sensor_id)
          .single();

        if (!sensorDetails) {
          console.error('❌ Could not fetch sensor details');
          return false;
        }

        const testRecord = {
          sensor_id: sensorDetails.id,
          store_id: sensorDetails.store_id,
          organization_id: sensorDetails.stores.organization_id,
          timestamp: testTimestamp.toISOString(),
          end_time: new Date(testTimestamp.getTime() + 3600000).toISOString(), // +1 hour
          line1_in: 5,
          line1_out: 3,
          line2_in: 0,
          line2_out: 0,
          line3_in: 0,
          line3_out: 0,
          line4_in: 2,
          line4_out: 1
        };

        console.log('Inserting test record...');
        const { data: inserted, error: insertError } = await supabase
          .from('people_counting_raw')
          .insert(testRecord)
          .select('id');

        if (insertError) {
          console.error('❌ Insert failed:', insertError);
          console.log('\nTest record:', JSON.stringify(testRecord, null, 2));
        } else {
          console.log('✅ Successfully inserted test record with ID:', inserted[0].id);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

testConnection();