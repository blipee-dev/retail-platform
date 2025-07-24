#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env.production' });

// Set environment variables for the workflow scripts
process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
process.env.SENSOR_AUTH_MILESIGHT = process.env.SENSOR_AUTH_MILESIGHT || 'Basic YWRtaW46YWRtaW4=';
process.env.SENSOR_AUTH_OMNIA = process.env.SENSOR_AUTH_OMNIA || 'Basic YWRtaW46YWRtaW4=';

// Import and run the collection script
const { main } = require('../workflows/collect-sensor-data');

console.log('🧪 Testing sensor collection locally...\n');
console.log('Environment check:');
console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '✓' : '✗'}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗'}`);
console.log(`  SENSOR_AUTH_MILESIGHT: ${process.env.SENSOR_AUTH_MILESIGHT ? '✓' : '✗'}`);
console.log(`  SENSOR_AUTH_OMNIA: ${process.env.SENSOR_AUTH_OMNIA ? '✓' : '✗'}`);
console.log('\n');

main()
  .then(() => {
    console.log('\n✅ Collection completed');
  })
  .catch(error => {
    console.error('\n❌ Collection failed:', error.message);
    process.exit(1);
  });