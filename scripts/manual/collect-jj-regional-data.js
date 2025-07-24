#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function collectJJRegionalData() {
  console.log('=== Collecting Regional Data from JJ Sensor ===\n');
  
  try {
    // Get JJ sensor
    const { data: sensors, error } = await supabase
      .from('sensor_metadata')
      .select('*')
      .like('sensor_name', '%JJ%');
      
    if (error || !sensors || sensors.length === 0) {
      console.error('Could not find JJ sensor');
      return;
    }
    
    const jjSensor = sensors[0];
    console.log(`Found sensor: ${jjSensor.sensor_name}`);
    console.log(`Type: ${jjSensor.sensor_type}`);
    console.log(`API URL: ${jjSensor.api_url}\n`);
    
    // Check if Milesight sensor supports regional counting
    // Milesight sensors can have regional data at a different endpoint
    if (!jjSensor.api_url) {
      console.error('No API URL configured for this sensor');
      return;
    }
    
    // Build regional API URL by modifying the people counting URL
    // Change peoplecountlogcsv to regionalcountlogcsv
    const regionalUrl = jjSensor.api_url.replace('peoplecountlogcsv', 'regionalcountlogcsv');
    console.log(`Testing regional URL: ${regionalUrl}\n`);
    
    // Test with a single day first
    const testDate = new Date('2025-07-12');
    const startStr = formatDate(testDate, '00:00:00');
    const endStr = formatDate(testDate, '23:59:59');
    
    const testUrl = regionalUrl
      .replace('{start}', startStr)
      .replace('{end}', endStr);
      
    console.log(`Testing URL: ${testUrl}\n`);
    
    // Try to fetch data
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:7ujMko0admin').toString('base64')
        },
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        console.log(`HTTP ${response.status}: ${response.statusText}`);
        console.log('The JJ sensor may not support regional counting.');
        return;
      }
      
      const data = await response.text();
      console.log('Response received, length:', data.length);
      
      if (data.includes('regional') || data.includes('Region')) {
        console.log('✅ JJ sensor supports regional counting!');
        console.log('\nSample data:');
        console.log(data.split('\n').slice(0, 5).join('\n'));
        
        // If successful, we can proceed with full collection
        console.log('\nWould you like to collect all regional data from July 12-24?');
        console.log('Run: node scripts/manual/collect-jj-regional-july.js');
        
      } else {
        console.log('❌ Response does not appear to contain regional data');
        console.log('Sample response:', data.substring(0, 200));
      }
      
    } catch (err) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.log('❌ Request timeout - sensor may not support regional counting');
      } else {
        console.log('❌ Error:', err.message);
      }
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
  }
}

function formatDate(date, time) {
  const pad = (n) => n.toString().padStart(2, '0');
  const [hours, minutes, seconds] = time.split(':');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${hours}:${minutes}:${seconds}`;
}

// Run the test
collectJJRegionalData();