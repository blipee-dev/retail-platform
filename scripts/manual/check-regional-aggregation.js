#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRegionalData() {
  console.log('=== Checking Why Regional Data is Zero ===\n');
  
  // 1. Check raw regional data
  const { data: rawData, error: rawError } = await supabase
    .from('regional_counting_raw')
    .select('*')
    .gte('timestamp', '2025-07-01')
    .order('timestamp', { ascending: false })
    .limit(5);
    
  if (rawError) {
    console.log('Error fetching raw data:', rawError);
    return;
  }
  
  console.log('1. Sample Regional Raw Data (latest 5 records):');
  console.log('------------------------------------------------');
  rawData.forEach(r => {
    const total = r.region1_count + r.region2_count + r.region3_count + r.region4_count;
    console.log(`Store: ${r.store_id}`);
    console.log(`Time: ${r.timestamp}`);
    console.log(`Total Occupancy: ${total}`);
    console.log(`Zones: R1=${r.region1_count}, R2=${r.region2_count}, R3=${r.region3_count}, R4=${r.region4_count}`);
    console.log('---');
  });
  
  // 2. Check hourly analytics
  const { data: hourlyData, error: hourlyError } = await supabase
    .from('hourly_analytics')
    .select('store_id, date, hour, total_zone_occupancy, zone1_peak_occupancy, zone2_peak_occupancy, zone3_peak_occupancy, zone4_peak_occupancy, zone1_share_pct, avg_store_dwell_time')
    .gte('date', '2025-07-01')
    .order('date', { ascending: false })
    .order('hour', { ascending: false })
    .limit(10);
    
  console.log('\n2. Hourly Analytics Regional Data (latest 10 records):');
  console.log('-----------------------------------------------------');
  if (hourlyData) {
    hourlyData.forEach(h => {
      console.log(`Store: ${h.store_id}`);
      console.log(`Date: ${h.date}, Hour: ${h.hour}`);
      console.log(`Total Zone Occupancy: ${h.total_zone_occupancy}`);
      console.log(`Peak Occupancies: Z1=${h.zone1_peak_occupancy}, Z2=${h.zone2_peak_occupancy}, Z3=${h.zone3_peak_occupancy}, Z4=${h.zone4_peak_occupancy}`);
      console.log(`Zone 1 Share: ${h.zone1_share_pct}%`);
      console.log(`Avg Dwell Time: ${h.avg_store_dwell_time} minutes`);
      console.log('---');
    });
  }
  
  // 3. Check if we have any non-zero regional data in analytics
  const { count: nonZeroCount } = await supabase
    .from('hourly_analytics')
    .select('*', { count: 'exact', head: true })
    .gt('total_zone_occupancy', 0);
    
  console.log(`\n3. Hourly records with non-zero occupancy: ${nonZeroCount || 0}`);
  
  // 4. Manual calculation for a specific hour to see what should be there
  const testDate = '2025-07-01';
  const testHour = 10;
  
  const { data: manualCalc } = await supabase
    .from('regional_counting_raw')
    .select('store_id, region1_count, region2_count, region3_count, region4_count, timestamp')
    .gte('timestamp', `${testDate}T${testHour}:00:00`)
    .lt('timestamp', `${testDate}T${testHour + 1}:00:00`)
    .order('timestamp');
    
  if (manualCalc && manualCalc.length > 0) {
    const grouped = {};
    manualCalc.forEach(r => {
      if (!grouped[r.store_id]) {
        grouped[r.store_id] = {
          total: 0,
          max1: 0, max2: 0, max3: 0, max4: 0,
          count: 0,
          samples: []
        };
      }
      const total = r.region1_count + r.region2_count + r.region3_count + r.region4_count;
      grouped[r.store_id].total += total;
      grouped[r.store_id].max1 = Math.max(grouped[r.store_id].max1, r.region1_count);
      grouped[r.store_id].max2 = Math.max(grouped[r.store_id].max2, r.region2_count);
      grouped[r.store_id].max3 = Math.max(grouped[r.store_id].max3, r.region3_count);
      grouped[r.store_id].max4 = Math.max(grouped[r.store_id].max4, r.region4_count);
      grouped[r.store_id].count++;
      grouped[r.store_id].samples.push({
        time: r.timestamp,
        total: total
      });
    });
    
    console.log(`\n4. What ${testDate} Hour ${testHour} SHOULD have in hourly_analytics:`);
    console.log('--------------------------------------------------------');
    for (const [storeId, data] of Object.entries(grouped)) {
      console.log(`Store ${storeId}:`);
      console.log(`  - Total Occupancy: ${data.total} (sum of all intervals)`);
      console.log(`  - Samples: ${data.count}`);
      console.log(`  - Peak values: Z1=${data.max1}, Z2=${data.max2}, Z3=${data.max3}, Z4=${data.max4}`);
      console.log(`  - First few samples:`, data.samples.slice(0, 3));
      
      // Now check what's actually in hourly_analytics for this store/hour
      const { data: actual } = await supabase
        .from('hourly_analytics')
        .select('total_zone_occupancy, zone1_peak_occupancy, zone2_peak_occupancy, zone3_peak_occupancy, zone4_peak_occupancy')
        .eq('store_id', storeId)
        .eq('date', testDate)
        .eq('hour', testHour)
        .single();
        
      if (actual) {
        console.log(`  - ACTUAL in hourly_analytics: Total=${actual.total_zone_occupancy}`);
        console.log(`    Peaks: Z1=${actual.zone1_peak_occupancy}, Z2=${actual.zone2_peak_occupancy}, Z3=${actual.zone3_peak_occupancy}, Z4=${actual.zone4_peak_occupancy}`);
      } else {
        console.log(`  - ACTUAL in hourly_analytics: No record found`);
      }
      console.log('');
    }
  }
  
  // 5. Summary stats
  const { count: totalRaw } = await supabase
    .from('regional_counting_raw')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', '2025-07-01');
    
  const { data: occupancyStats } = await supabase
    .from('regional_counting_raw')
    .select('region1_count, region2_count, region3_count, region4_count')
    .gte('timestamp', '2025-07-01')
    .limit(1000);
    
  let totalOccupancy = 0;
  let nonZeroSamples = 0;
  
  if (occupancyStats) {
    occupancyStats.forEach(s => {
      const sum = s.region1_count + s.region2_count + s.region3_count + s.region4_count;
      totalOccupancy += sum;
      if (sum > 0) nonZeroSamples++;
    });
  }
  
  console.log('\n5. Summary Statistics:');
  console.log('---------------------');
  console.log(`Total regional raw records since July 1: ${totalRaw}`);
  console.log(`Non-zero occupancy samples (first 1000): ${nonZeroSamples}`);
  console.log(`Total occupancy sum (first 1000): ${totalOccupancy}`);
  
  // 6. Diagnosis
  console.log('\n6. DIAGNOSIS:');
  console.log('-------------');
  if (totalRaw > 0 && nonZeroCount === 0) {
    console.log('❌ We have regional raw data but NO aggregated regional data in hourly_analytics');
    console.log('   This means the aggregation function is not processing regional data correctly');
    console.log('   The UPDATE step in the aggregation function is likely failing');
  } else if (nonZeroCount > 0) {
    console.log('✅ We have some aggregated regional data');
    console.log(`   Records with data: ${nonZeroCount}`);
  } else {
    console.log('⚠️  No regional raw data found');
  }
}

checkRegionalData().catch(console.error);