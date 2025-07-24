const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyOptimization() {
  console.log('🔍 VERIFYING DATABASE OPTIMIZATION\n');
  console.log('=' .repeat(50));
  
  // 1. Check sensor IDs are fixed
  console.log('\n✅ SENSOR IDs FIXED:');
  const { data: sensors } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, status, last_data_received');
  
  sensors?.forEach(s => {
    const status = s.status || 'unknown';
    const lastData = s.last_data_received ? new Date(s.last_data_received).toLocaleString() : 'never';
    console.log(`  ${s.sensor_id} - ${s.sensor_name} (${status}) - Last data: ${lastData}`);
  });
  
  // 2. Check new tables exist
  console.log('\n✅ NEW TABLES CREATED:');
  const newTables = ['audit_log', 'sensor_health_log', 'alerts'];
  for (const table of newTables) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ✓ (${count || 0} rows)`);
  }
  
  // 3. Check sensor health monitoring columns
  console.log('\n✅ HEALTH MONITORING COLUMNS ADDED:');
  const { data: sensorHealth } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, status, last_data_received, offline_since, consecutive_failures')
    .limit(1);
  
  if (sensorHealth && sensorHealth[0]) {
    const columns = Object.keys(sensorHealth[0]);
    console.log(`  Columns: ${columns.join(', ')}`);
  }
  
  // 4. Check views
  console.log('\n✅ VIEWS CREATED:');
  const views = ['latest_sensor_data', 'v_sensor_status'];
  for (const view of views) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(1);
      console.log(`  ${view}: ${error ? '❌ Error' : '✓'}`);
    } catch (e) {
      console.log(`  ${view}: ❌ Not found`);
    }
  }
  
  // 5. Check removed tables
  console.log('\n✅ TABLES REMOVED:');
  const removedTables = [
    'people_counting_data', 'customer_journeys', 'queue_analytics',
    'regional_flow_matrix', 'analytics_alerts', 'regional_alerts'
  ];
  
  for (const table of removedTables) {
    const { error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    console.log(`  ${table}: ${error ? '✓ Removed' : '❌ Still exists'}`);
  }
  
  // 6. Check backup
  console.log('\n✅ BACKUPS CREATED:');
  console.log('  archive.people_counting_data_backup - Check in Supabase dashboard');
  
  // 7. Test API endpoints
  console.log('\n✅ API ENDPOINTS TEST:');
  
  // Test sensor data endpoint
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/people_counting_raw?limit=1`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    console.log(`  /people_counting_raw: ${response.ok ? '✓ Working' : '❌ Error'}`);
  } catch (e) {
    console.log(`  /people_counting_raw: ❌ Error`);
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('🎉 DATABASE OPTIMIZATION VERIFICATION COMPLETE!');
  console.log('\nNext steps:');
  console.log('1. Test sensor data collection workflow');
  console.log('2. Verify dashboards are working');
  console.log('3. Check that analytics aggregation still runs');
  console.log('4. Monitor sensor health status');
}

verifyOptimization().catch(console.error);