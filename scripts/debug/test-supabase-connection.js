#!/usr/bin/env node

// Try multiple env files
require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env.production' });
require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env' });

// Set environment variables
process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...\n');
console.log('Environment:');
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL}`);
console.log(`  Has Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Yes' : 'No'}`);
console.log();

try {
  const { SupabaseClient } = require('../workflows/lib/supabase-client');
  
  console.log('Creating Supabase client...');
  const supabase = new SupabaseClient();
  console.log('✓ Client created successfully\n');
  
  console.log('Fetching active sensors...');
  supabase.getActiveSensors()
    .then(sensors => {
      console.log(`✓ Found ${sensors.length} active sensors`);
      
      if (sensors.length > 0) {
        console.log('\nFirst sensor:');
        console.log(JSON.stringify(sensors[0], null, 2));
      }
    })
    .catch(error => {
      console.error('✗ Error fetching sensors:', error.message);
      console.error('Stack:', error.stack);
    });
    
} catch (error) {
  console.error('✗ Error creating client:', error.message);
  console.error('Stack:', error.stack);
}