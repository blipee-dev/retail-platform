const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getTableSchema(tableName) {
  try {
    // Get one row to infer schema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) return null;
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const schema = {};
      
      for (const col of columns) {
        const value = data[0][col];
        schema[col] = {
          type: value === null ? 'unknown' : typeof value,
          sample: value
        };
      }
      
      return schema;
    }
    
    return {};
  } catch (err) {
    return null;
  }
}

async function getTableStats(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) return { count: 0, error: error.message };
    
    return { count: count || 0 };
  } catch (err) {
    return { count: 0, error: err.message };
  }
}

async function analyzeRecentData() {
  console.log('\n📊 RECENT DATA ANALYSIS\n');
  
  // Check recent people counting data
  const { data: recentCounting, error: countingError } = await supabase
    .from('people_counting_data')
    .select('sensor_id, timestamp, total_in, total_out')
    .order('timestamp', { ascending: false })
    .limit(10);

  if (!countingError && recentCounting) {
    console.log('Recent People Counting Data:');
    recentCounting.forEach(row => {
      console.log(`  ${new Date(row.timestamp).toLocaleString()} - Sensor: ${row.sensor_id} - In: ${row.total_in}, Out: ${row.total_out}`);
    });
  }

  // Check hourly analytics
  const { data: recentHourly, error: hourlyError } = await supabase
    .from('hourly_analytics')
    .select('store_id, date, hour, total_in, total_out')
    .order('date', { ascending: false })
    .order('hour', { ascending: false })
    .limit(10);

  if (!hourlyError && recentHourly) {
    console.log('\nRecent Hourly Analytics:');
    recentHourly.forEach(row => {
      console.log(`  ${row.date} ${row.hour}:00 - Store: ${row.store_id} - In: ${row.total_in}, Out: ${row.total_out}`);
    });
  }

  // Check daily analytics  
  const { data: recentDaily, error: dailyError } = await supabase
    .from('daily_analytics')
    .select('store_id, date, total_in, total_out, peak_hour')
    .order('date', { ascending: false })
    .limit(5);

  if (!dailyError && recentDaily) {
    console.log('\nRecent Daily Analytics:');
    recentDaily.forEach(row => {
      console.log(`  ${row.date} - Store: ${row.store_id} - In: ${row.total_in}, Out: ${row.total_out}, Peak Hour: ${row.peak_hour}`);
    });
  }
}

async function checkRelationships() {
  console.log('\n🔗 RELATIONSHIP ANALYSIS\n');
  
  // Check organization-store relationships
  const { data: storeOrgs, error: storeOrgsError } = await supabase
    .from('stores')
    .select(`
      id,
      name,
      organization_id,
      organizations (
        name,
        slug
      )
    `)
    .limit(5);

  if (!storeOrgsError && storeOrgs) {
    console.log('Store-Organization Relationships:');
    storeOrgs.forEach(store => {
      console.log(`  ${store.name} → ${store.organizations?.name || 'No org'}`);
    });
  }

  // Check sensor-store relationships
  const { data: sensorStores, error: sensorStoresError } = await supabase
    .from('sensor_metadata')
    .select(`
      sensor_id,
      sensor_type,
      store_id,
      stores (
        name,
        code
      )
    `)
    .limit(5);

  if (!sensorStoresError && sensorStores) {
    console.log('\nSensor-Store Relationships:');
    sensorStores.forEach(sensor => {
      console.log(`  ${sensor.sensor_id || 'Unknown'} (${sensor.sensor_type}) → ${sensor.stores?.name || 'No store'}`);
    });
  }
}

async function checkDataQuality() {
  console.log('\n🔍 DATA QUALITY CHECKS\n');
  
  // Check for sensors without IDs
  const { count: nullSensorCount } = await supabase
    .from('sensor_metadata')
    .select('*', { count: 'exact', head: true })
    .is('sensor_id', null);

  console.log(`Sensors without sensor_id: ${nullSensorCount}`);

  // Check for orphaned sensor data
  const { data: orphanedData } = await supabase
    .from('people_counting_raw')
    .select('sensor_id')
    .limit(1);

  if (orphanedData && orphanedData.length > 0) {
    const sensorId = orphanedData[0].sensor_id;
    const { data: sensorExists } = await supabase
      .from('sensor_metadata')
      .select('sensor_id')
      .eq('sensor_id', sensorId)
      .single();

    console.log(`Sample sensor data integrity: ${sensorExists ? '✅ OK' : '❌ Orphaned data found'}`);
  }

  // Check for duplicate timestamps
  const { data: duplicates } = await supabase.rpc('check_duplicate_timestamps', {});
  if (duplicates) {
    console.log(`Duplicate timestamp entries: ${duplicates.length || 0}`);
  }
}

async function main() {
  console.log('🔍 SUPABASE DATABASE ANALYSIS\n');
  console.log('=' .repeat(50));

  const tables = [
    'organizations',
    'stores', 
    'profiles',
    'sensor_metadata',
    'people_counting_raw',
    'people_counting_data',
    'hourly_analytics',
    'daily_analytics',
    'regions',
    'region_configurations',
    'regional_counting_raw',
    'regional_analytics',
    'customer_journeys',
    'queue_analytics',
    'regional_flow_matrix',
    'analytics_alerts',
    'regional_alerts',
    'alert_rules',
    'heatmap_temporal_raw',
    'vca_alarm_status'
  ];

  console.log('\n📋 TABLE INVENTORY & STATS\n');
  
  for (const table of tables) {
    const stats = await getTableStats(table);
    const status = stats.error ? '❌' : '✅';
    const countStr = stats.error ? `Error: ${stats.error}` : `${stats.count} rows`;
    
    console.log(`${status} ${table.padEnd(25)} - ${countStr}`);
    
    if (!stats.error && stats.count > 0) {
      const schema = await getTableSchema(table);
      if (schema) {
        console.log(`   Columns: ${Object.keys(schema).join(', ')}`);
      }
    }
  }

  await analyzeRecentData();
  await checkRelationships();
  await checkDataQuality();

  console.log('\n✅ Analysis complete!');
}

main().catch(console.error);