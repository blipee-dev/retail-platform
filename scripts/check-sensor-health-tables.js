const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.BLIPEE_SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co',
  process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M'
);

async function checkTables() {
  console.log('Checking sensor health and last data tables...\n');

  // Check sensor_health_log table structure
  const { data: healthColumns } = await supabase
    .rpc('get_table_columns', { table_name: 'sensor_health_log' })
    .limit(0);

  // Check latest_sensor_data table structure  
  const { data: latestColumns } = await supabase
    .rpc('get_table_columns', { table_name: 'latest_sensor_data' })
    .limit(0);

  // Alternative approach - query information schema
  const { data: healthSchema } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'sensor_health_log')
    .eq('table_schema', 'public');

  const { data: latestSchema } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'latest_sensor_data')
    .eq('table_schema', 'public');

  // Try to get sample data
  const { data: healthSample, error: healthError } = await supabase
    .from('sensor_health_log')
    .select('*')
    .limit(1);

  const { data: latestSample, error: latestError } = await supabase
    .from('latest_sensor_data')
    .select('*')
    .limit(1);

  console.log('=== sensor_health_log ===');
  if (healthSchema) {
    console.log('Schema:', JSON.stringify(healthSchema, null, 2));
  }
  if (healthSample) {
    console.log('Sample:', JSON.stringify(healthSample, null, 2));
  }
  if (healthError) {
    console.log('Error:', healthError.message);
  }

  console.log('\n=== latest_sensor_data ===');
  if (latestSchema) {
    console.log('Schema:', JSON.stringify(latestSchema, null, 2));
  }
  if (latestSample) {
    console.log('Sample:', JSON.stringify(latestSample, null, 2));
  }
  if (latestError) {
    console.log('Error:', latestError.message);
  }
}

checkTables().catch(console.error);