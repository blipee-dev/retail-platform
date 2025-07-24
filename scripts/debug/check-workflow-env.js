#!/usr/bin/env node

console.log('🔍 Checking workflow environment configuration...\n');

// Check Supabase config
const config = require('../workflows/lib/config');
console.log('📋 Config loaded:');
console.log(`  Supabase URL: ${config.supabase.url || 'NOT SET'}`);
console.log(`  Service Key: ${config.supabase.serviceKey ? '✓ Present' : '✗ Missing'}`);
console.log(`  Sensor Auth: ${config.sensors.milesight.auth ? '✓ Present' : '✗ Missing'}`);

// Check if we can connect
if (config.supabase.url && config.supabase.serviceKey) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(config.supabase.url, config.supabase.serviceKey);
  
  console.log('\n🔌 Testing Supabase connection...');
  
  supabase
    .from('sensor_metadata')
    .select('count(*)', { count: 'exact', head: true })
    .then(({ count, error }) => {
      if (error) {
        console.log('❌ Connection failed:', error.message);
      } else {
        console.log(`✅ Connection successful! Found ${count} sensors in database.`);
      }
    });
} else {
  console.log('\n❌ Cannot test connection - missing credentials');
  console.log('\nSet these environment variables:');
  console.log('  export SUPABASE_URL="your-url"');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="your-key"');
}