const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY
);

async function checkSensorConfig() {
  console.log('Checking sensor configurations...\n');
  
  const { data: sensors, error } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, host, auth_config')
    .eq('is_active', true)
    .order('sensor_name');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Current sensor configurations:');
  console.log('================================\n');
  
  sensors.forEach(sensor => {
    console.log(`Name: ${sensor.sensor_name}`);
    console.log(`ID: ${sensor.sensor_id}`);
    console.log(`Host: ${sensor.host}`);
    console.log(`Auth: ${JSON.stringify(sensor.auth_config)}`);
    console.log('---\n');
  });
  
  console.log('\nNote: Sensor IPs should be configured in the database');
  console.log('See docs/SENSOR_CONFIGURATION.md for setup instructions');
}

checkSensorConfig().catch(console.error);