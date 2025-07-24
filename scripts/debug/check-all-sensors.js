#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env.production' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!supabaseServiceKey) {
  console.error('Usage: node check-all-sensors.js <SUPABASE_SERVICE_ROLE_KEY>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSensors() {
  console.log('🔍 Checking all sensors in database...\n');
  
  // Get ALL sensors (not just active)
  const { data: allSensors, error: allError } = await supabase
    .from('sensor_metadata')
    .select('*')
    .order('sensor_name');
  
  if (allError) {
    console.error('Error fetching sensors:', allError.message);
    return;
  }
  
  console.log(`Total sensors in database: ${allSensors?.length || 0}\n`);
  
  if (allSensors && allSensors.length > 0) {
    console.log('All sensors:');
    allSensors.forEach(sensor => {
      const statusIcon = sensor.status === 'online' ? '🟢' : 
                        sensor.status === 'warning' ? '🟡' : '🔴';
      console.log(`${statusIcon} ${sensor.sensor_name}`);
      console.log(`   ID: ${sensor.sensor_id}`);
      console.log(`   Type: ${sensor.sensor_type}`);
      console.log(`   IP: ${sensor.sensor_ip}:${sensor.sensor_port}`);
      console.log(`   Status: ${sensor.status}`);
      console.log(`   Active: ${sensor.is_active}`);
      console.log(`   Last data: ${sensor.last_data_received || 'Never'}`);
      console.log(`   Failures: ${sensor.consecutive_failures || 0}`);
      console.log('');
    });
  }
  
  // Now check what the workflow query would return
  console.log('\n📡 Checking active sensors (what workflow sees)...');
  
  const { data: activeSensors, error: activeError } = await supabase
    .from('sensor_metadata')
    .select(`
      *,
      stores!inner(
        id,
        name,
        timezone,
        organizations!inner(
          id,
          name
        )
      )
    `)
    .in('status', ['online', 'warning'])
    .order('sensor_name');
  
  if (activeError) {
    console.error('Error fetching active sensors:', activeError.message);
    return;
  }
  
  console.log(`\nActive sensors (status = online/warning): ${activeSensors?.length || 0}`);
  
  if (activeSensors && activeSensors.length > 0) {
    activeSensors.forEach(sensor => {
      console.log(`\n✅ ${sensor.sensor_name}`);
      console.log(`   Store: ${sensor.stores.name}`);
      console.log(`   Organization: ${sensor.stores.organizations.name}`);
    });
  }
}

checkSensors().catch(console.error);