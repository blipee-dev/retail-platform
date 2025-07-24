#!/usr/bin/env node

/**
 * Check timezone issues in sensor data
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimezones() {
  console.log('🕐 Checking timezone issues...\n');

  try {
    // Get current time in different timezones
    const nowUTC = new Date();
    const nowBrazil = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000); // UTC-3
    const nowPortugal = new Date(nowUTC.getTime() - 2 * 60 * 60 * 1000); // UTC-2 (summer time)
    
    console.log(`Current times:`);
    console.log(`  UTC:      ${nowUTC.toISOString()}`);
    console.log(`  Brazil:   ${nowBrazil.toISOString()} (UTC-3)`);
    console.log(`  Portugal: ${nowPortugal.toISOString()} (UTC-2 summer)`);
    
    // Get future records
    const { data: futureRecords, error } = await supabase
      .from('people_counting_raw')
      .select('id, sensor_id, timestamp, created_at')
      .gt('timestamp', nowUTC.toISOString())
      .order('timestamp', { ascending: true })
      .limit(10);
      
    if (error) throw error;
    
    if (futureRecords.length > 0) {
      console.log(`\nFound ${futureRecords.length} future records:`);
      
      // Get sensor info
      const sensorIds = [...new Set(futureRecords.map(r => r.sensor_id))];
      const { data: sensors } = await supabase
        .from('sensor_metadata')
        .select('id, sensor_name, stores(name)')
        .in('id', sensorIds);
        
      const sensorMap = {};
      sensors?.forEach(s => {
        sensorMap[s.id] = s.sensor_name + ' (' + s.stores?.name + ')';
      });
      
      futureRecords.forEach(record => {
        const timestamp = new Date(record.timestamp);
        const hoursInFuture = (timestamp - nowUTC) / (1000 * 60 * 60);
        console.log(`  ${sensorMap[record.sensor_id] || record.sensor_id}`);
        console.log(`    Timestamp: ${record.timestamp}`);
        console.log(`    Hours in future: ${hoursInFuture.toFixed(1)}`);
        console.log(`    Created at: ${record.created_at}`);
      });
      
      // Analyze pattern
      const uniqueTimestamps = [...new Set(futureRecords.map(r => r.timestamp))];
      console.log(`\nUnique future timestamps: ${uniqueTimestamps.length}`);
      uniqueTimestamps.slice(0, 5).forEach(ts => {
        console.log(`  ${ts}`);
      });
    }
    
    // Check if it's consistent with timezone offset
    console.log('\nAnalysis:');
    if (futureRecords.length > 0) {
      const firstFuture = new Date(futureRecords[0].timestamp);
      const offsetHours = Math.round((firstFuture - nowUTC) / (1000 * 60 * 60));
      console.log(`  Future records appear to be ${offsetHours} hours ahead`);
      console.log(`  This suggests sensors might be reporting in UTC+${offsetHours} timezone`);
      console.log(`  Or the timezone detection is incorrectly calculating offset`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTimezones();