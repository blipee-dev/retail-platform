#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function debugSensors() {
  console.log('=== Debugging Sensor Data ===\n');
  
  // Get all sensors
  const { data: sensors, error } = await supabase
    .from('sensor_metadata')
    .select('*');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total sensors: ${sensors.length}\n`);
  
  sensors.forEach(sensor => {
    console.log(`Sensor: ${sensor.sensor_name}`);
    console.log(`  ID: ${sensor.id}`);
    console.log(`  Type: ${sensor.sensor_type}`);
    console.log(`  Data Type: ${sensor.data_type || 'NULL'}`);
    console.log(`  Active: ${sensor.is_active}`);
    if (sensor.api_url) {
      console.log(`  API URL: ${sensor.api_url}`);
    }
    console.log('');
  });
  
  // Check regional data by sensor
  console.log('\n=== Regional Data by Sensor ===');
  for (const sensor of sensors) {
    const { count } = await supabase
      .from('regional_counting_raw')
      .select('*', { count: 'exact', head: true })
      .eq('sensor_id', sensor.id);
      
    if (count > 0) {
      console.log(`${sensor.sensor_name}: ${count} regional records`);
    }
  }
}

debugSensors().catch(console.error);