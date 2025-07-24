const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeDatabase() {
  try {
    console.log('Connecting to Supabase...\n');

    // Query to get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      // Try alternative approach using raw SQL
      const { data, error } = await supabase.rpc('get_all_tables', {});
      if (error) {
        console.error('Error fetching tables:', error);
        // Let's try a different approach
        await analyzeWithRawSQL();
        return;
      }
    }

    console.log('Tables found:', tables?.length || 0);
    if (tables) {
      tables.forEach(table => {
        console.log(`- ${table.table_name} (${table.table_type})`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
    await analyzeWithRawSQL();
  }
}

async function analyzeWithRawSQL() {
  try {
    console.log('\nTrying alternative approach...\n');

    // Get list of tables we know exist from migrations
    const knownTables = [
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

    console.log('Checking known tables:');
    
    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`❌ ${tableName} - ${error.message}`);
        } else {
          console.log(`✅ ${tableName} - Exists (${count || 0} rows)`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} - Error: ${err.message}`);
      }
    }

    // Try to get some sample data from key tables
    console.log('\n\nSample data from key tables:');
    
    // Check organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(5);
    
    if (!orgsError && orgs) {
      console.log('\nOrganizations:', orgs.length);
      orgs.forEach(org => console.log(`  - ${org.name} (${org.slug})`));
    }

    // Check stores
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, code, timezone')
      .limit(5);
    
    if (!storesError && stores) {
      console.log('\nStores:', stores.length);
      stores.forEach(store => console.log(`  - ${store.name} (${store.code}) - ${store.timezone}`));
    }

    // Check sensor metadata
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .select('sensor_id, sensor_type, store_id')
      .limit(5);
    
    if (!sensorsError && sensors) {
      console.log('\nSensors:', sensors.length);
      sensors.forEach(sensor => console.log(`  - ${sensor.sensor_id} (${sensor.sensor_type})`));
    }

  } catch (err) {
    console.error('Error in alternative approach:', err);
  }
}

// Run the analysis
analyzeDatabase();