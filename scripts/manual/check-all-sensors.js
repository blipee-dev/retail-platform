#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSensors() {
  console.log('=== All Sensors in System ===\n');
  
  const { data: sensors, error } = await supabase
    .from('sensor_metadata')
    .select('*')
    .order('sensor_name');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total sensors:', sensors.length);
  console.log('\nSensor Details:');
  console.log('Name         | Type      | Data Type         | Active | Store');
  console.log('-------------|-----------|-------------------|--------|------');
  
  sensors.forEach(sensor => {
    console.log(
      `${(sensor.sensor_name || '').padEnd(12)} | ` +
      `${(sensor.sensor_type || '').padEnd(9)} | ` +
      `${(sensor.data_type || '').padEnd(17)} | ` +
      `${sensor.is_active ? 'Yes' : 'No '} | ` +
      `${sensor.store_id || ''}`
    );
  });
  
  // Check specifically for JJ sensors
  const jjSensors = sensors.filter(s => s.sensor_name.includes('JJ'));
  if (jjSensors.length > 0) {
    console.log('\n=== JJ Sensors Found ===');
    jjSensors.forEach(sensor => {
      console.log(`\nName: ${sensor.sensor_name}`);
      console.log(`Type: ${sensor.sensor_type}`);
      console.log(`Data Type: ${sensor.data_type}`);
      console.log(`API URL: ${sensor.api_url}`);
      console.log(`Active: ${sensor.is_active}`);
    });
  }
  
  // Check for regional counting sensors
  const regionalSensors = sensors.filter(s => s.data_type === 'regional_counting');
  console.log(`\n\nRegional Counting Sensors: ${regionalSensors.length}`);
  regionalSensors.forEach(s => {
    console.log(`  - ${s.sensor_name} (${s.sensor_type}) - Active: ${s.is_active}`);
  });
}

checkSensors().catch(console.error);