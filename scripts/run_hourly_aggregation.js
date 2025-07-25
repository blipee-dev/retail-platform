#!/usr/bin/env node

const fetch = require('node-fetch');

// Helper function to get local hour for a given timezone
function getLocalHour(date, timezone) {
  try {
    const options = {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    };
    return parseInt(new Intl.DateTimeFormat('en-US', options).format(date));
  } catch (e) {
    // Fallback to UTC if timezone is invalid
    return date.getUTCHours();
  }
}

async function runHourlyAggregation() {
  console.log('🚀 Starting Hourly Analytics Aggregation');
  console.log('=' .repeat(60));
  console.log(`📅 Current UTC time: ${new Date().toISOString()}`);
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  try {
    // Method 1: Try calling the database function
    console.log('\n📊 Attempting database function aggregation...');
    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/aggregate_hourly_data`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (dbResponse.ok) {
      const result = await dbResponse.json();
      console.log(`✅ Database aggregation successful: ${result}`);
    } else {
      console.log('⚠️  Database function not available, using manual aggregation...');
      
      // Method 2: Manual aggregation
      await manualAggregation(supabaseUrl, supabaseKey);
    }
    
    // Show recent results
    await showRecentAnalytics(supabaseUrl, supabaseKey);
    
    console.log('\n✅ Aggregation completed successfully!');
    
  } catch (error) {
    console.error(`❌ Aggregation failed: ${error.message}`);
    process.exit(1);
  }
}

async function manualAggregation(supabaseUrl, supabaseKey) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  // Get data from last 3 hours (matching collection window)
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  
  // Don't process data older than 24 hours
  const maxAge = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (threeHoursAgo < maxAge) {
    console.log('⏰ Limiting aggregation to last 24 hours');
    threeHoursAgo.setTime(maxAge.getTime());
  }
  
  console.log(`\n📊 Manual aggregation from ${threeHoursAgo.toISOString()} to ${now.toISOString()}`);
  
  // Get all stores with organization_id and timezone
  const storesResponse = await fetch(`${supabaseUrl}/rest/v1/stores?select=id,name,organization_id,timezone`, {
    headers
  });
  
  if (!storesResponse.ok) {
    throw new Error('Failed to fetch stores');
  }
  
  const stores = await storesResponse.json();
  console.log(`Found ${stores.length} stores to process`);
  
  let totalProcessed = 0;
  
  // Process each hour (complete hour periods only)
  for (let h = 0; h < 3; h++) {
    const hourStart = new Date(now.getTime() - (h + 1) * 60 * 60 * 1000);
    hourStart.setMinutes(0, 0, 0); // HH:00:00
    const hourEnd = new Date(hourStart);
    hourEnd.setMinutes(59, 59, 999); // HH:59:59
    
    console.log(`\n⏰ Processing hour: ${hourStart.toISOString()} to ${hourEnd.toISOString()}`);
    
    for (const store of stores) {
      // Check business hours for this store's timezone
      const storeTimezone = store.timezone || 'UTC';
      const storeLocalHour = getLocalHour(hourStart, storeTimezone);
      
      console.log(`  🏪 ${store.name} (${storeTimezone}): Local hour is ${storeLocalHour}:00`);
      
      // Skip if outside business hours (1 AM - 9 AM)
      if (storeLocalHour >= 1 && storeLocalHour < 9) {
        console.log(`    ⏰ Skipping - outside business hours`);
        continue;
      }
      
      // Skip future hours
      if (hourStart > now) {
        console.log(`    ⏭️  Skipping ${store.name} - future hour`);
        continue;
      }
      
      // Get raw data for this hour (complete hour period)
      const queryUrl = `${supabaseUrl}/rest/v1/people_counting_raw?` +
        `store_id=eq.${store.id}&` +
        `timestamp=gte.${hourStart.toISOString()}&` +
        `timestamp=lte.${hourEnd.toISOString()}&` +
        `timestamp=lte.${now.toISOString()}`; // Exclude future data
        
      console.log(`    📥 Fetching data...`);
      
      const rawResponse = await fetch(queryUrl, { headers });
      
      if (!rawResponse.ok) {
        console.log(`    ❌ Failed to fetch data: ${rawResponse.status}`);
        continue;
      }
      
      const rawData = await rawResponse.json();
      console.log(`    📊 Found ${rawData.length} records`);
      
      if (rawData.length === 0) continue;
      
      // Calculate aggregates with proper separation
      let totals = {
        storeEntries: 0,      // Lines 1-3 only
        storeExits: 0,        // Lines 1-3 only
        passerbyTotal: 0,     // Line 4 total
        passerbyIn: 0,        // Line 4 in
        passerbyOut: 0,       // Line 4 out
        lines: { in: [0, 0, 0, 0], out: [0, 0, 0, 0] }
      };
      
      for (const record of rawData) {
        // Process each line
        for (let i = 1; i <= 4; i++) {
          const lineIn = record[`line${i}_in`] || 0;
          const lineOut = record[`line${i}_out`] || 0;
          
          totals.lines.in[i-1] += lineIn;
          totals.lines.out[i-1] += lineOut;
          
          // Lines 1-3 are store traffic
          if (i <= 3) {
            totals.storeEntries += lineIn;
            totals.storeExits += lineOut;
          } else {
            // Line 4 is passerby traffic
            totals.passerbyIn += lineIn;
            totals.passerbyOut += lineOut;
            totals.passerbyTotal += lineIn + lineOut;
          }
        }
      }
      
      // Calculate distribution percentages
      const entryLine1Pct = totals.storeEntries > 0 ? 
        Math.round((totals.lines.in[0] / totals.storeEntries) * 100) : 0;
      const entryLine2Pct = totals.storeEntries > 0 ? 
        Math.round((totals.lines.in[1] / totals.storeEntries) * 100) : 0;
      const entryLine3Pct = totals.storeEntries > 0 ? 
        Math.round((totals.lines.in[2] / totals.storeEntries) * 100) : 0;
      
      const exitLine1Pct = totals.storeExits > 0 ? 
        Math.round((totals.lines.out[0] / totals.storeExits) * 100) : 0;
      const exitLine2Pct = totals.storeExits > 0 ? 
        Math.round((totals.lines.out[1] / totals.storeExits) * 100) : 0;
      const exitLine3Pct = totals.storeExits > 0 ? 
        Math.round((totals.lines.out[2] / totals.storeExits) * 100) : 0;
      
      // Calculate capture rate
      const captureRate = totals.passerbyTotal > 0 ? 
        Math.round((totals.storeEntries / totals.passerbyTotal) * 100 * 100) / 100 : 0;
      
      // Prepare hourly record
      const hourlyRecord = {
        // id will be auto-generated by database
        store_id: store.id,
        organization_id: store.organization_id,
        date: hourStart.toISOString().split('T')[0],
        hour: hourStart.getHours(),
        // New comprehensive metrics
        store_entries: totals.storeEntries,
        store_exits: totals.storeExits,
        passerby_count: totals.passerbyTotal,
        passerby_in: totals.passerbyIn,
        passerby_out: totals.passerbyOut,
        capture_rate: captureRate,
        entry_line1_pct: entryLine1Pct,
        entry_line2_pct: entryLine2Pct,
        entry_line3_pct: entryLine3Pct,
        exit_line1_pct: exitLine1Pct,
        exit_line2_pct: exitLine2Pct,
        exit_line3_pct: exitLine3Pct,
        sample_count: rawData.length,
        // Additional columns that exist in the table
        total_entries: totals.storeEntries,
        total_exits: totals.storeExits
        // net_flow is a generated column - don't insert it
      };
      
      // Add line data
      for (let i = 1; i <= 4; i++) {
        hourlyRecord[`line${i}_in`] = totals.lines.in[i-1];
        hourlyRecord[`line${i}_out`] = totals.lines.out[i-1];
      }
      
      // Check if record exists
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?` +
        `store_id=eq.${store.id}&` +
        `date=eq.${hourStart.toISOString().split('T')[0]}&` +
        `hour=eq.${hourStart.getHours()}`,
        { headers }
      );
      
      console.log(`    🔍 Checking for existing record...`);
      
      if (!checkResponse.ok) {
        const errorText = await checkResponse.text();
        console.log(`    ❌ Check failed: ${checkResponse.status} - ${errorText}`);
        continue;
      }
      
      const existingRecords = await checkResponse.json();
      
      if (existingRecords.length > 0) {
        console.log(`    ✅ Found existing record, updating...`);
      } else {
        console.log(`    ➕ No existing record, inserting new...`);
      }
      
      if (existingRecords.length > 0) {
        // Update existing
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/hourly_analytics?` +
          `store_id=eq.${store.id}&` +
          `date=eq.${hourStart.toISOString().split('T')[0]}&` +
          `hour=eq.${hourStart.getHours()}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(hourlyRecord)
          }
        );
        
        if (updateResponse.ok) {
          totalProcessed++;
          console.log(`  📝 Updated ${store.name} - ${hourStart.toISOString()}`);
        } else {
          const errorText = await updateResponse.text();
          console.log(`  ❌ Failed to update: ${updateResponse.status} - ${errorText}`);
        }
      } else {
        // Insert new
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/hourly_analytics`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(hourlyRecord)
          }
        );
        
        if (insertResponse.ok) {
          totalProcessed++;
          console.log(`  ➕ Inserted ${store.name} - ${hourStart.toISOString()}`);
        } else {
          const errorText = await insertResponse.text();
          console.log(`  ❌ Failed to insert: ${insertResponse.status} - ${errorText}`);
        }
      }
      
      // Now process regional data for the same hour
      const regionalResponse = await fetch(
        `${supabaseUrl}/rest/v1/regional_counting_raw?` +
        `store_id=eq.${store.id}&` +
        `timestamp=gte.${hourStart.toISOString()}&` +
        `timestamp=lte.${hourEnd.toISOString()}&` +
        `timestamp=lte.${now.toISOString()}`, // Exclude future data
        { headers }
      );
      
      if (regionalResponse.ok) {
        const regionalData = await regionalResponse.json();
        
        if (regionalData.length > 0) {
          // Calculate regional metrics
          const regionalMetrics = calculateRegionalMetrics(
            regionalData, 
            totals.storeEntries,
            store.id,
            hourStart
          );
          
          // Update the hourly record with regional data
          if (Object.keys(regionalMetrics).length > 0) {
            const updateRegionalResponse = await fetch(
              `${supabaseUrl}/rest/v1/hourly_analytics?` +
              `store_id=eq.${store.id}&` +
              `date=eq.${hourStart.toISOString().split('T')[0]}&` +
              `hour=eq.${hourStart.getHours()}`,
              {
                method: 'PATCH',
                headers,
                body: JSON.stringify(regionalMetrics)
              }
            );
            
            if (updateRegionalResponse.ok) {
              console.log(`  🗺️  Updated regional metrics`);
            } else {
              const errorText = await updateRegionalResponse.text();
              console.log(`  ⚠️  Failed to update regional metrics: ${errorText}`);
            }
          }
        }
      }
    }
  }
  
  console.log(`\n📊 Processed ${totalProcessed} hourly records`);
}

/**
 * Calculate regional metrics from raw regional counting data
 */
function calculateRegionalMetrics(regionalData, storeEntries, storeId, hourStart) {
  const metrics = {};
  
  // Group by region and calculate occupancy
  const regionOccupancy = { 1: 0, 2: 0, 3: 0, 4: 0 };
  const regionReadings = { 1: 0, 2: 0, 3: 0, 4: 0 };
  let maxOccupancy = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  regionalData.forEach(record => {
    // Sum occupancy for each region
    for (let i = 1; i <= 4; i++) {
      const count = record[`region${i}_count`] || 0;
      regionOccupancy[i] += count;
      regionReadings[i]++;
      maxOccupancy[i] = Math.max(maxOccupancy[i], count);
    }
  });
  
  // Calculate total store occupancy (sum of all zones)
  const totalOccupancy = Object.values(regionOccupancy).reduce((a, b) => a + b, 0);
  const avgTotalOccupancy = totalOccupancy / Math.max(regionalData.length, 1);
  
  // Only proceed if we have data
  if (totalOccupancy === 0) return metrics;
  
  // 1. Store-Wide Dwell Time (if we have store entries)
  if (storeEntries > 0) {
    // Assuming 5-minute intervals between readings
    const intervalMinutes = 5;
    const totalPersonMinutes = totalOccupancy * intervalMinutes;
    metrics.avg_store_dwell_time = Math.round((totalPersonMinutes / storeEntries) * 10) / 10;
  }
  
  // 2. Zone Share % for each region
  metrics.zone1_share_pct = totalOccupancy > 0 ? 
    Math.round((regionOccupancy[1] / totalOccupancy) * 100) : 0;
  metrics.zone2_share_pct = totalOccupancy > 0 ? 
    Math.round((regionOccupancy[2] / totalOccupancy) * 100) : 0;
  metrics.zone3_share_pct = totalOccupancy > 0 ? 
    Math.round((regionOccupancy[3] / totalOccupancy) * 100) : 0;
  metrics.zone4_share_pct = totalOccupancy > 0 ? 
    Math.round((regionOccupancy[4] / totalOccupancy) * 100) : 0;
  
  // 3. Peak Occupancy per Zone
  metrics.zone1_peak_occupancy = maxOccupancy[1];
  metrics.zone2_peak_occupancy = maxOccupancy[2];
  metrics.zone3_peak_occupancy = maxOccupancy[3];
  metrics.zone4_peak_occupancy = maxOccupancy[4];
  
  // 4. Zone Dwell Contribution (person-minutes contribution)
  const totalPersonMinutes = totalOccupancy * 5; // 5-minute intervals
  metrics.zone1_dwell_contribution = totalPersonMinutes > 0 ? 
    Math.round((regionOccupancy[1] * 5 / totalPersonMinutes) * 100) : 0;
  metrics.zone2_dwell_contribution = totalPersonMinutes > 0 ? 
    Math.round((regionOccupancy[2] * 5 / totalPersonMinutes) * 100) : 0;
  metrics.zone3_dwell_contribution = totalPersonMinutes > 0 ? 
    Math.round((regionOccupancy[3] * 5 / totalPersonMinutes) * 100) : 0;
  metrics.zone4_dwell_contribution = totalPersonMinutes > 0 ? 
    Math.round((regionOccupancy[4] * 5 / totalPersonMinutes) * 100) : 0;
  
  // 5. Total Store Occupancy
  metrics.total_zone_occupancy = Math.round(avgTotalOccupancy);
  
  // Combined metrics: Occupancy Validation
  // Removed occupancy_accuracy_score - column doesn't exist in table
  
  return metrics;
}

async function showRecentAnalytics(supabaseUrl, supabaseKey) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };
  
  // Get recent hourly analytics
  const recentResponse = await fetch(
    `${supabaseUrl}/rest/v1/hourly_analytics?select=*&order=date.desc,hour.desc&limit=10`,
    { headers }
  );
  
  if (recentResponse.ok) {
    const recentData = await recentResponse.json();
    console.log('\n📊 Recent Hourly Analytics:');
    console.log(`Total records found: ${recentData.length}`);
    
    if (recentData.length > 0) {
      console.log('\nHour                     | Store    | Entries | Exits | Samples');
      console.log('-'.repeat(70));
      
      for (const record of recentData.slice(0, 10)) {
        const hourStr = record.date && record.hour !== undefined ? 
          `${record.date} ${String(record.hour).padStart(2, '0')}:00:00` : 
          'Unknown';
        const storeName = (record.stores?.name || record.store_id || 'Unknown').slice(0, 8);
        const entries = record.store_entries || record.total_entries || record.total_in || 0;
        const exits = record.store_exits || record.total_exits || record.total_out || 0;
        const samples = record.sample_count || 0;
        
        console.log(
          `${hourStr.padEnd(24)} | ${storeName.padEnd(8)} | ${entries.toString().padStart(7)} | ${exits.toString().padStart(5)} | ${samples.toString().padStart(7)}`
        );
      }
      
      // Show data age
      const latestRecord = recentData[0];
      if (latestRecord.date && latestRecord.hour !== undefined) {
        const recordTime = new Date(`${latestRecord.date}T${String(latestRecord.hour).padStart(2, '0')}:00:00Z`);
        const hoursAgo = Math.round((Date.now() - recordTime.getTime()) / 1000 / 60 / 60);
        console.log(`\n⏰ Latest record is ${hoursAgo} hours old`);
      }
    } else {
      console.log('⚠️  No hourly analytics records found');
    }
  } else {
    const errorText = await recentResponse.text();
    console.log(`❌ Failed to fetch recent analytics: ${recentResponse.status} - ${errorText}`);
  }
}

// Run the aggregation
runHourlyAggregation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });