const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDependencies() {
  console.log('Checking dependencies on people_counting_data table...\n');
  
  // Check for views that depend on the table
  const viewsQuery = `
    SELECT 
      v.viewname,
      v.definition
    FROM pg_views v
    WHERE v.definition LIKE '%people_counting_data%'
    AND v.schemaname = 'public';
  `;
  
  const { data: views, error: viewError } = await supabase.rpc('query_database', {
    query: viewsQuery
  }).single();
  
  if (views) {
    console.log('Views depending on people_counting_data:');
    console.log(views);
  }
  
  // Check for foreign key constraints
  const constraintsQuery = `
    SELECT 
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS references_table,
      ccu.column_name AS references_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_name = 'people_counting_data';
  `;
  
  const { data: constraints, error: constraintError } = await supabase.rpc('query_database', {
    query: constraintsQuery
  }).single();
  
  if (constraints) {
    console.log('\nForeign keys referencing people_counting_data:');
    console.log(constraints);
  }
  
  // Check if table exists and row count
  const { count } = await supabase
    .from('people_counting_data')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\npeople_counting_data table has ${count} rows`);
  
  // Check if we have the latest_sensor_data view
  const { data: latestView } = await supabase
    .from('latest_sensor_data')
    .select('*')
    .limit(1);
  
  if (latestView) {
    console.log('\nlatest_sensor_data view exists and is accessible');
  } else {
    console.log('\nlatest_sensor_data view might need to be recreated');
  }
}

checkDependencies().catch(console.error);