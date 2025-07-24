#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const AbortController = require('abort-controller');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Configuration
const START_DATE = '2025-07-12';
const END_DATE = '2025-07-24';

async function collectJJRegionalData() {
  console.log('🗺️  JJ Sensor Regional Data Collection - July 12-24, 2025');
  console.log('=' .repeat(60));
  console.log(`📅 Date range: ${START_DATE} to ${END_DATE}`);
  console.log('');
  
  try {
    // Get JJ sensor
    const { data: sensors, error } = await supabase
      .from('sensor_metadata')
      .select('*')
      .like('sensor_name', 'J&J%');
      
    if (error || !sensors || sensors.length === 0) {
      console.error('Could not find JJ sensor');
      return;
    }
    
    const sensor = sensors[0];
    console.log(`📡 Found sensor: ${sensor.sensor_name}`);
    console.log(`   ID: ${sensor.id}`);
    console.log(`   Store: ${sensor.store_id}`);
    console.log(`   IP: ${sensor.sensor_ip}:${sensor.sensor_port}`);
    console.log('');
    
    let totalRecords = 0;
    let totalDays = 0;
    
    // Process each day
    const startDate = new Date(START_DATE);
    const endDate = new Date(END_DATE);
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      console.log(`\n📅 Processing ${dateStr}...`);
      
      try {
        // Set up date range for full day
        const dayStart = new Date(dateStr + 'T00:00:00');
        const dayEnd = new Date(dateStr + 'T23:59:59');
        
        // Format dates for sensor query (YYYY-MM-DD-HH:MM:SS)
        const formatDate = (date) => {
          const pad = (n) => n.toString().padStart(2, '0');
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        };
        
        const startStr = formatDate(dayStart);
        const endStr = formatDate(dayEnd);
        
        // Build URL for regional data
        // Milesight sensors use the same endpoint pattern as Omnia
        const endpoint = `/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&region1=1&region2=1&region3=1&region4=1&time_start=${startStr}&time_end=${endStr}`;
        
        console.log(`   📍 Fetching data from ${startStr} to ${endStr}`);
        
        // Build full URL
        const fullUrl = `http://${sensor.sensor_ip}:${sensor.sensor_port}${endpoint}`;
        
        // Fetch data with authentication and timeout
        const auth = Buffer.from('admin:grnl.2024').toString('base64');
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        let data;
        try {
          const response = await fetch(fullUrl, {
            headers: {
              'Authorization': `Basic ${auth}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeout);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          data = await response.text();
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === 'AbortError') {
            throw new Error('Request timeout after 15 seconds');
          }
          throw err;
        }
        
        if (typeof data !== 'string' || !data.trim()) {
          console.log('   ⚠️  No data returned');
          continue;
        }
        
        // Parse CSV data
        const lines = data.trim().split('\n');
        if (lines.length < 2) {
          console.log('   ⚠️  No data rows found');
          continue;
        }
        
        // Process data lines (skip header)
        const records = [];
        let skippedFuture = 0;
        const now = new Date();
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < 7) continue;
          
          // Parse timestamps
          const timestamp = new Date(values[0].replace(/\//g, '-'));
          const endTime = new Date(values[1].replace(/\//g, '-'));
          
          // Skip future data
          if (timestamp > now) {
            skippedFuture++;
            continue;
          }
          
          // Create record
          const record = {
            sensor_id: sensor.id,
            store_id: sensor.store_id,
            organization_id: sensor.organization_id,
            timestamp: timestamp.toISOString(),
            end_time: endTime.toISOString(),
            region1_count: parseInt(values[2]) || 0,
            region2_count: parseInt(values[3]) || 0,
            region3_count: parseInt(values[4]) || 0,
            region4_count: parseInt(values[5]) || 0,
            created_at: new Date().toISOString()
          };
          
          records.push(record);
        }
        
        if (records.length > 0) {
          // Insert records in batches
          const BATCH_SIZE = 100;
          for (let i = 0; i < records.length; i += BATCH_SIZE) {
            const batch = records.slice(i, i + BATCH_SIZE);
            
            const { error } = await supabase
              .from('regional_counting_raw')
              .insert(batch);
            
            if (error) {
              console.log(`   ❌ Insert error: ${error.message}`);
            }
          }
          
          console.log(`   ✅ Inserted ${records.length} records` + 
            (skippedFuture > 0 ? ` (skipped ${skippedFuture} future)` : ''));
          totalRecords += records.length;
        } else {
          console.log('   ⚠️  No valid records found');
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      totalDays++;
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('✅ JJ Regional Data Collection Complete!');
    console.log(`📊 Total records inserted: ${totalRecords}`);
    console.log(`📅 Days processed: ${totalDays}`);
    console.log(`📈 Average per day: ${totalDays > 0 ? Math.round(totalRecords / totalDays) : 0}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the collection
collectJJRegionalData().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});