const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentData() {
  console.log('🔍 Checking for recent data in Supabase...\n');
  
  // Check people_counting_raw
  console.log('📊 Recent data in people_counting_raw:');
  const { data: countingData, error: countingError } = await supabase
    .from('people_counting_raw')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(5);
  
  if (countingError) {
    console.error('Error:', countingError.message);
  } else if (countingData && countingData.length > 0) {
    countingData.forEach(row => {
      console.log(`  ${new Date(row.timestamp).toLocaleString()} - Sensor: ${row.sensor_id}, IN: ${row.total_in}, OUT: ${row.total_out}`);
    });
    console.log(`\n  Latest entry: ${new Date(countingData[0].timestamp).toLocaleString()}`);
  } else {
    console.log('  No data found');
  }
  
  // Check sensor health
  console.log('\n🏥 Sensor Health Status:');
  const { data: sensors, error: sensorError } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, status, last_data_received, consecutive_failures')
    .order('sensor_name');
  
  if (sensorError) {
    console.error('Error:', sensorError.message);
  } else if (sensors) {
    sensors.forEach(sensor => {
      const statusIcon = sensor.status === 'online' ? '🟢' : sensor.status === 'warning' ? '🟡' : '🔴';
      const lastData = sensor.last_data_received ? new Date(sensor.last_data_received).toLocaleString() : 'Never';
      console.log(`  ${statusIcon} ${sensor.sensor_name}: Last data: ${lastData}, Failures: ${sensor.consecutive_failures}`);
    });
  }
  
  // Check for recent alerts
  console.log('\n🚨 Recent Alerts:');
  const { data: alerts, error: alertError } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (alertError) {
    console.error('Error:', alertError.message);
  } else if (alerts && alerts.length > 0) {
    alerts.forEach(alert => {
      console.log(`  ${new Date(alert.created_at).toLocaleString()} - ${alert.title}: ${alert.description}`);
    });
  } else {
    console.log('  No recent alerts');
  }
}

checkRecentData().catch(console.error);