const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
  console.log('Checking sensor_metadata table structure...\n');
  
  // Get table columns
  const { data: columns, error } = await supabase
    .from('sensor_metadata')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error:', error.message);
    return;
  }
  
  if (columns && columns.length > 0) {
    console.log('Available columns in sensor_metadata:');
    Object.keys(columns[0]).forEach(col => {
      console.log(`  - ${col}`);
    });
    
    console.log('\nSample data:');
    console.log(JSON.stringify(columns[0], null, 2));
  } else {
    console.log('No data found in sensor_metadata table');
  }
}

checkColumns().catch(console.error);