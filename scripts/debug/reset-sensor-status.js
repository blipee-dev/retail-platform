#!/usr/bin/env node

// This script resets sensor statuses to 'online' for testing

require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env.production' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.argv[2];

if (!supabaseServiceKey) {
  console.error('Usage: node reset-sensor-status.js <SUPABASE_SERVICE_ROLE_KEY>');
  console.error('\nThis will reset all sensors to online status for testing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetSensors() {
  console.log('🔧 Resetting sensor statuses...\n');
  
  // First, check current statuses
  const { data: sensors, error: fetchError } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, status, consecutive_failures');
  
  if (fetchError) {
    console.error('Error fetching sensors:', fetchError.message);
    return;
  }
  
  console.log('Current sensor statuses:');
  sensors?.forEach(s => {
    console.log(`  ${s.sensor_name}: ${s.status} (failures: ${s.consecutive_failures || 0})`);
  });
  
  // Reset all sensors to online
  console.log('\nResetting all sensors to online...');
  
  const { error: updateError } = await supabase
    .from('sensor_metadata')
    .update({
      status: 'online',
      consecutive_failures: 0,
      offline_since: null
    })
    .gte('sensor_id', 0); // Update all
  
  if (updateError) {
    console.error('Error updating sensors:', updateError.message);
    return;
  }
  
  console.log('✅ All sensors reset to online status');
  
  // Verify the update
  const { data: updated, error: verifyError } = await supabase
    .from('sensor_metadata')
    .select('sensor_name, status')
    .eq('status', 'online');
  
  if (!verifyError && updated) {
    console.log(`\n${updated.length} sensors are now online`);
  }
}

resetSensors().catch(console.error);