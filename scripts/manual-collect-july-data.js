#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY
);

// Date range for collection
const START_DATE = new Date('2025-07-01T00:00:00Z');
const END_DATE = new Date('2025-07-26T18:59:59Z');

// Fetch sensor configurations from database
async function getSensorConfigurations() {
  const { data: sensors, error } = await supabase
    .from('sensor_metadata')
    .select('sensor_id, sensor_name, host, auth_config')
    .eq('is_active', true)
    .order('sensor_name');
    
  if (error) {
    throw new Error(`Failed to fetch sensor configurations: ${error.message}`);
  }
  
  return sensors.map(sensor => ({
    id: sensor.sensor_id,
    name: sensor.sensor_name,
    host: sensor.host,
    username: sensor.auth_config?.username || 'admin',
    password: process.env[`SENSOR_${sensor.sensor_id.replace(/-/g, '_').toUpperCase()}_PASSWORD`] || 
              process.env.DEFAULT_SENSOR_PASSWORD ||
              sensor.auth_config?.password
  }));
}

async function collectSensorData(sensor, startDate, endDate) {
  console.log(`\n📊 Collecting data for ${sensor.name}`);
  console.log(`   Period: ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  const url = `http://${sensor.host}/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(startDate)}&time_end=${formatDate(endDate)}`;
  
  try {
    console.log(`   🌐 Fetching from: ${url.replace(sensor.password, '****')}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sensor.username}:${sensor.password}`).toString('base64')
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    console.log(`   📥 Received ${lines.length - 1} data records`);
    
    if (lines.length < 2) {
      console.log('   ⚠️  No data found');
      return { success: true, records: 0 };
    }
    
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    // Get sensor metadata
    const { data: sensorData } = await supabase
      .from('sensor_metadata')
      .select('store_id, stores(organizations(id))')
      .eq('id', sensor.id)
      .single();
    
    const storeId = sensorData?.store_id;
    const orgId = sensorData?.stores?.organizations?.id;
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      
      if (parts.length >= 17) {
        try {
          const timestamp = new Date(parts[0].replace(/\//g, '-'));
          const endTime = new Date(parts[1].replace(/\//g, '-'));
          
          const record = {
            sensor_id: sensor.id,
            store_id: storeId,
            organization_id: orgId,
            timestamp: timestamp.toISOString(),
            end_time: endTime.toISOString(),
            line1_in: parseInt(parts[5]) || 0,
            line1_out: parseInt(parts[6]) || 0,
            line2_in: parseInt(parts[8]) || 0,
            line2_out: parseInt(parts[9]) || 0,
            line3_in: parseInt(parts[11]) || 0,
            line3_out: parseInt(parts[12]) || 0,
            line4_in: parseInt(parts[14]) || 0,
            line4_out: parseInt(parts[15]) || 0
          };
          
          // Check if record exists
          const { data: existing } = await supabase
            .from('people_counting_raw')
            .select('id')
            .eq('sensor_id', sensor.id)
            .eq('timestamp', record.timestamp)
            .single();
          
          if (existing) {
            // Update existing record
            const { error } = await supabase
              .from('people_counting_raw')
              .update(record)
              .eq('id', existing.id);
              
            if (error) throw error;
            updated++;
          } else {
            // Insert new record
            const { error } = await supabase
              .from('people_counting_raw')
              .insert(record);
              
            if (error) throw error;
            inserted++;
          }
          
          // Show progress every 100 records
          if ((i - 1) % 100 === 0) {
            console.log(`   ⏳ Progress: ${i}/${lines.length - 1} records`);
          }
          
        } catch (error) {
          console.error(`   ❌ Error processing line ${i}: ${error.message}`);
          errors++;
        }
      }
    }
    
    console.log(`   ✅ Complete: ${inserted} inserted, ${updated} updated, ${errors} errors`);
    return { success: true, inserted, updated, errors };
    
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function collectRegionalData(sensor, startDate, endDate) {
  console.log(`\n🗺️  Collecting regional data for ${sensor.name}`);
  
  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  const url = `http://${sensor.host}/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&region1=1&region2=1&region3=1&region4=1&time_start=${formatDate(startDate)}&time_end=${formatDate(endDate)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${sensor.username}:${sensor.password}`).toString('base64')
      },
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    const lines = text.trim().split('\n');
    
    console.log(`   📥 Received ${lines.length - 1} regional records`);
    
    let inserted = 0;
    
    // Get sensor metadata
    const { data: sensorData } = await supabase
      .from('sensor_metadata')
      .select('store_id, stores(organizations(id))')
      .eq('id', sensor.id)
      .single();
    
    // Process regional data (implementation depends on format)
    // This is a placeholder - adjust based on actual data format
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      
      if (parts.length >= 2) {
        try {
          const timestamp = new Date(parts[0].replace(/\//g, '-'));
          
          // Extract regional data from CSV
          // Adjust this based on actual CSV format
          const regions = [];
          for (let r = 1; r <= 4; r++) {
            if (parts[r * 2] !== undefined) {
              regions.push({
                sensor_id: sensor.id,
                store_id: sensorData?.store_id,
                organization_id: sensorData?.stores?.organizations?.id,
                timestamp: timestamp.toISOString(),
                region_id: `region${r}`,
                region_name: `Region ${r}`,
                current_occupancy: parseInt(parts[r * 2]) || 0,
                max_occupancy: parseInt(parts[r * 2 + 1]) || 0
              });
            }
          }
          
          if (regions.length > 0) {
            const { error } = await supabase
              .from('regional_counting_raw')
              .insert(regions);
              
            if (error) throw error;
            inserted += regions.length;
          }
          
        } catch (error) {
          console.error(`   ❌ Error processing regional line ${i}: ${error.message}`);
        }
      }
    }
    
    console.log(`   ✅ Regional data: ${inserted} records inserted`);
    return { success: true, inserted };
    
  } catch (error) {
    console.error(`   ❌ Regional collection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Manual Data Collection for July 2025');
  console.log('=====================================');
  console.log(`Start: ${START_DATE.toISOString()}`);
  console.log(`End: ${END_DATE.toISOString()}`);
  console.log(`Duration: ${Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24))} days`);
  
  // Fetch sensor configurations from database
  console.log('\n📋 Fetching sensor configurations...');
  const SENSORS = await getSensorConfigurations();
  console.log(`Found ${SENSORS.length} active sensors`);
  
  // Check for missing passwords
  const missingPasswords = SENSORS.filter(s => !s.password || s.password === 'YOUR_PASSWORD');
  if (missingPasswords.length > 0) {
    console.log('\n⚠️  Missing passwords for sensors:');
    missingPasswords.forEach(s => console.log(`  - ${s.name} (${s.id})`));
    console.log('\nSet passwords using environment variables:');
    missingPasswords.forEach(s => {
      const envVar = `SENSOR_${s.id.replace(/-/g, '_').toUpperCase()}_PASSWORD`;
      console.log(`  export ${envVar}=YOUR_PASSWORD`);
    });
    console.log('\nOr set a default: export DEFAULT_SENSOR_PASSWORD=YOUR_PASSWORD');
    process.exit(1);
  }
  
  // Process each sensor
  for (const sensor of SENSORS) {
    console.log('\n' + '='.repeat(50));
    
    // Collect in daily chunks to avoid timeouts
    const currentDate = new Date(START_DATE);
    
    while (currentDate < END_DATE) {
      const chunkStart = new Date(currentDate);
      const chunkEnd = new Date(currentDate);
      chunkEnd.setDate(chunkEnd.getDate() + 1);
      chunkEnd.setSeconds(chunkEnd.getSeconds() - 1);
      
      // Don't go past end date
      if (chunkEnd > END_DATE) {
        chunkEnd.setTime(END_DATE.getTime());
      }
      
      console.log(`\n📅 Processing ${chunkStart.toISOString().split('T')[0]}`);
      
      // Collect people counting data
      await collectSensorData(sensor, chunkStart, chunkEnd);
      
      // Collect regional data (if applicable)
      if (sensor.name.includes('Omnia')) {
        await collectRegionalData(sensor, chunkStart, chunkEnd);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Small delay to avoid overwhelming the sensors
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n✅ Data collection complete!');
}

// Run the collection
main().catch(console.error);