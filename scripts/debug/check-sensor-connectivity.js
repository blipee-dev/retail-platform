#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkSensorConnectivity() {
  console.log('🔍 Checking sensor connectivity...\n');

  // Get all sensors
  const { data: sensors, error } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, host')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching sensors:', error);
    return;
  }

  console.log(`Found ${sensors.length} active sensors\n`);

  for (const sensor of sensors) {
    console.log(`Checking ${sensor.sensor_name} (${sensor.host})...`);
    
    try {
      // Try a simple HTTP request with a short timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://${sensor.host}`, {
        signal: controller.signal,
        timeout: 5000
      });
      
      clearTimeout(timeout);
      
      if (response.ok) {
        console.log(`  ✅ Reachable - Status: ${response.status}`);
      } else {
        console.log(`  ⚠️  Reachable but returned status: ${response.status}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`  ❌ Timeout after 5 seconds`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`  ❌ Connection refused`);
      } else if (error.code === 'ENOTFOUND') {
        console.log(`  ❌ Host not found`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    console.log('');
  }
  
  console.log('\n💡 Troubleshooting tips:');
  console.log('1. Check if sensors are on the same network as GitHub Actions runners');
  console.log('2. Verify firewall rules allow incoming connections');
  console.log('3. Consider using a VPN or proxy if sensors are on private network');
  console.log('4. Check if sensor IPs have changed');
}

checkSensorConnectivity().catch(console.error);