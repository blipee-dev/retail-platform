#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJJSensor() {
  console.log('=== Checking JJ Sensor Data ===\n');
  
  // Get JJ sensor details
  const { data: jjSensor, error: sensorError } = await supabase
    .from('sensor_metadata')
    .select('*')
    .like('sensor_name', '%JJ%')
    .single();
    
  if (sensorError || !jjSensor) {
    console.error('Could not find JJ sensor:', sensorError);
    return;
  }
  
  console.log('JJ Sensor Details:');
  console.log('ID:', jjSensor.id);
  console.log('Name:', jjSensor.sensor_name);
  console.log('Type:', jjSensor.sensor_type);
  console.log('Data Type:', jjSensor.data_type || 'NOT SET');
  console.log('API URL:', jjSensor.api_url);
  console.log('Store ID:', jjSensor.store_id);
  
  // Check if JJ has people counting data
  const { count: peopleCount } = await supabase
    .from('people_counting_raw')
    .select('*', { count: 'exact', head: true })
    .eq('sensor_id', jjSensor.id)
    .gte('timestamp', '2025-07-12');
    
  console.log(`\nPeople counting records since July 12: ${peopleCount || 0}`);
  
  // Check if JJ has regional data
  const { count: regionalCount } = await supabase
    .from('regional_counting_raw')
    .select('*', { count: 'exact', head: true })
    .eq('sensor_id', jjSensor.id)
    .gte('timestamp', '2025-07-12');
    
  console.log(`Regional counting records since July 12: ${regionalCount || 0}`);
  
  // Check if Milesight sensors support regional counting
  console.log('\n=== Milesight Sensor Capabilities ===');
  console.log('Sensor Type:', jjSensor.sensor_type);
  console.log('API URL suggests:', jjSensor.api_url.includes('regional') ? 'Regional support' : 'People counting only');
  
  // Show sample API URL for regional data if possible
  if (jjSensor.api_url) {
    console.log('\nCurrent API URL:', jjSensor.api_url);
    console.log('Regional API URL would be:', jjSensor.api_url.replace('peoplecountlogcsv', 'regionalcountlogcsv'));
  }
}