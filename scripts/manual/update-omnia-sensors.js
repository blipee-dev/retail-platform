#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateOmniaSensors() {
  console.log('🔄 Updating Omnia sensor types...\n');
  
  // Update OML sensors to 'omnia' type
  const { data, error } = await supabase
    .from('sensor_metadata')
    .update({ sensor_type: 'omnia' })
    .in('sensor_id', ['OML01-SENSOR-001', 'OML02-SENSOR-001', 'OML03-SENSOR-001'])
    .select();
  
  if (error) {
    console.error('❌ Error updating sensors:', error.message);
    return;
  }
  
  console.log(`✅ Updated ${data.length} sensors to 'omnia' type\n`);
  
  // Show all sensors
  const { data: allSensors } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, sensor_type, is_active')
    .order('sensor_name');
  
  console.log('📊 Current sensor configuration:');
  allSensors.forEach(s => {
    console.log(`  ${s.sensor_name} (${s.sensor_id}) - Type: ${s.sensor_type}, Active: ${s.is_active}`);
  });
}

updateOmniaSensors();