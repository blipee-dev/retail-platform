const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAlertsTable() {
  console.log('Checking alerts table structure...\n');
  
  // Get one row to see the columns
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error or table does not exist:', error.message);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Alerts table columns:');
    Object.keys(data[0]).forEach(col => {
      console.log(`  - ${col}: ${typeof data[0][col]}`);
    });
  } else {
    console.log('Alerts table exists but is empty');
    
    // Try to get column info from a different approach
    const { data: emptyData } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000'); // Non-existent ID
    
    console.log('\nTable structure (from empty query):', emptyData);
  }
  
  // Check for analytics_alerts table
  const { count: analyticsCount } = await supabase
    .from('analytics_alerts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`\nanalytics_alerts table: ${analyticsCount !== null ? analyticsCount + ' rows' : 'does not exist'}`);
  
  // Check for regional_alerts table
  const { count: regionalCount } = await supabase
    .from('regional_alerts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`regional_alerts table: ${regionalCount !== null ? regionalCount + ' rows' : 'does not exist'}`);
}

checkAlertsTable();