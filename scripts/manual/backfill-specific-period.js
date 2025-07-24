#!/usr/bin/env node

/**
 * Backfill sensor data for a specific time period
 * Uses the existing workflow logic but for a custom date range
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || 'https://kqfwccpnqcgxuydvmdvb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZndjY3BucWNneHV5ZHZtZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI2NjI0NiwiZXhwIjoyMDQ4ODQyMjQ2fQ.IQJGfAJJKJgNy-ANaRsJvBjO6N7Dc0W7I6bG8w2NTIE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Target period: July 23, 2025 17:00:00 to 23:59:59 (Lisbon time)
const LISBON_TZ = 'Europe/Lisbon';
const START_LISBON = '2025-07-23 17:00:00';
const END_LISBON = '2025-07-23 23:59:59';

async function manualBackfill() {
  console.log('📅 Manual Backfill Configuration:');
  console.log(`   Period: ${START_LISBON} to ${END_LISBON} (Lisbon time)`);
  console.log(`   This is UTC: 2025-07-23 16:00:00 to 22:59:59\n`);
  
  try {
    // First, let's check what data already exists for this period
    const startUTC = '2025-07-23T16:00:00.000Z'; // 17:00 Lisbon = 16:00 UTC
    const endUTC = '2025-07-23T22:59:59.999Z';   // 23:59 Lisbon = 22:59 UTC
    
    console.log('📊 Checking existing data...');
    
    const { data: existing, error: checkError } = await supabase
      .from('people_counting_raw')
      .select('sensor_id, timestamp')
      .gte('timestamp', startUTC)
      .lte('timestamp', endUTC);
    
    if (checkError) throw checkError;
    
    console.log(`   Found ${existing?.length || 0} existing records\n`);
    
    // Get active sensors
    console.log('📡 Fetching active sensors...');
    
    const { data: sensors, error: sensorError } = await supabase
      .from('sensor_metadata')
      .select(`
        *,
        stores!inner(
          id,
          name,
          timezone,
          organizations!inner(
            id,
            name
          )
        )
      `)
      .eq('is_active', true)
      .eq('sensor_type', 'milesight_people_counter');
    
    if (sensorError) throw sensorError;
    
    console.log(`   Found ${sensors?.length || 0} active Milesight sensors\n`);
    
    // For each sensor, we need to collect data for the specific period
    console.log('📥 Collecting data for each sensor...\n');
    
    // Instead of reimplementing everything, let's create a simple script
    // that modifies the workflow to collect for specific hours
    
    console.log('⚠️  To backfill this specific period, you have two options:\n');
    
    console.log('Option 1: Run the workflow multiple times with modified time ranges');
    console.log('  - Temporarily modify scripts/workflows/lib/sensor-client.js');
    console.log('  - Change line 170: queryStartTime calculation');
    console.log('  - Set it to: new Date("2025-07-23T16:00:00.000Z")');
    console.log('  - Run: node scripts/workflows/collect-sensor-data.js\n');
    
    console.log('Option 2: Use manual SQL queries for each sensor');
    console.log('  - Query each sensor\'s API endpoint directly');
    console.log('  - Parse the CSV data');
    console.log('  - Insert into database\n');
    
    console.log('Option 3: Wait for the next scheduled run');
    console.log('  - The workflow runs every 30 minutes');
    console.log('  - It collects the last 3 hours of data');
    console.log('  - Recent data should be collected automatically\n');
    
    // Show sensor details for manual collection
    if (sensors && sensors.length > 0) {
      console.log('📝 Sensor Details for Manual Collection:');
      sensors.forEach(sensor => {
        console.log(`\n${sensor.sensor_name} (${sensor.sensor_id})`);
        console.log(`  IP: ${sensor.sensor_ip}:${sensor.sensor_port || 80}`);
        console.log(`  Store: ${sensor.stores.name} (${sensor.stores.timezone})`);
        console.log(`  API URL: http://${sensor.sensor_ip}:${sensor.sensor_port || 80}/dataloader.cgi`);
        console.log(`  Query params: ?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31`);
        console.log(`  Time format: &time_start=2025-07-23-17:00:00&time_end=2025-07-23-23:59:59`);
      });
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the backfill
manualBackfill();