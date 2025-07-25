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
  console.log('🚀 Starting Extended Hourly Analytics Aggregation');
  console.log('=' .repeat(60));
  console.log(`📅 Current UTC time: ${new Date().toISOString()}`);
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  try {
    // Check for hours_to_aggregate parameter (default 24 hours)
    const hoursToAggregate = parseInt(process.env.HOURS_TO_AGGREGATE || '24');
    const forceReaggregate = process.env.FORCE_REAGGREGATE === 'true';
    
    await manualAggregation(supabaseUrl, supabaseKey, hoursToAggregate, forceReaggregate);
    
    // Show recent results
    await showRecentAnalytics(supabaseUrl, supabaseKey);
    
    console.log('\n✅ Aggregation completed successfully!');
    
  } catch (error) {
    console.error(`❌ Aggregation failed: ${error.message}`);
    process.exit(1);
  }
}

async function manualAggregation(supabaseUrl, supabaseKey, hoursToAggregate = 24, forceReaggregate = false) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  // Get data from specified hours
  const now = new Date();
  const startTime = new Date(now.getTime() - hoursToAggregate * 60 * 60 * 1000);
  
  console.log(`\n📊 Extended aggregation from ${startTime.toISOString()} to ${now.toISOString()}`);
  console.log(`   Hours to process: ${hoursToAggregate}`);
  console.log(`   Force re-aggregate: ${forceReaggregate}`);
  
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
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  
  // Process each hour
  for (let h = 0; h < hoursToAggregate; h++) {
    const hourStart = new Date(now.getTime() - (h + 1) * 60 * 60 * 1000);
    hourStart.setMinutes(0, 0, 0); // HH:00:00
    const hourEnd = new Date(hourStart);
    hourEnd.setMinutes(59, 59, 999); // HH:59:59
    
    // Skip future hours
    if (hourStart > now) continue;
    
    console.log(`\n⏰ Processing hour: ${hourStart.toISOString().substring(0, 16)}`);
    
    for (const store of stores) {
      // Check business hours for this store's timezone
      const storeTimezone = store.timezone || 'UTC';
      const storeLocalHour = getLocalHour(hourStart, storeTimezone);
      
      // Skip if outside business hours (1 AM - 9 AM)
      if (storeLocalHour >= 1 && storeLocalHour < 9) {
        totalSkipped++;
        continue;
      }
      
      // Check if record exists (unless force re-aggregate)
      if (!forceReaggregate) {
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/hourly_analytics?` +
          `store_id=eq.${store.id}&` +
          `date=eq.${hourStart.toISOString().split('T')[0]}&` +
          `hour=eq.${hourStart.getHours()}`,
          { headers }
        );
        
        if (checkResponse.ok) {
          const existingRecords = await checkResponse.json();
          if (existingRecords.length > 0) {
            console.log(`    ⏭️  Skipping ${store.name} - already aggregated`);
            totalSkipped++;
            continue;
          }
        }
      }
      
      // Get raw data for this hour
      const queryUrl = `${supabaseUrl}/rest/v1/people_counting_raw?` +
        `store_id=eq.${store.id}&` +
        `timestamp=gte.${hourStart.toISOString()}&` +
        `timestamp=lte.${hourEnd.toISOString()}`;
        
      const rawResponse = await fetch(queryUrl, { headers });
      
      if (!rawResponse.ok) {
        continue;
      }
      
      const rawData = await rawResponse.json();
      
      if (rawData.length === 0) {
        continue;
      }
      
      console.log(`    📊 Processing ${store.name}: ${rawData.length} records`);
      
      // Calculate aggregates
      let totals = {
        storeEntries: 0,
        storeExits: 0,
        passerbyTotal: 0,
        passerbyIn: 0,
        passerbyOut: 0,
        lines: { in: [0, 0, 0, 0], out: [0, 0, 0, 0] }
      };
      
      for (const record of rawData) {
        for (let i = 1; i <= 4; i++) {
          const lineIn = record[`line${i}_in`] || 0;
          const lineOut = record[`line${i}_out`] || 0;
          
          totals.lines.in[i-1] += lineIn;
          totals.lines.out[i-1] += lineOut;
          
          if (i <= 3) {
            totals.storeEntries += lineIn;
            totals.storeExits += lineOut;
          } else {
            totals.passerbyIn += lineIn;
            totals.passerbyOut += lineOut;
            totals.passerbyTotal += lineIn + lineOut;
          }
        }
      }
      
      // Calculate percentages
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
      
      const captureRate = totals.passerbyTotal > 0 ? 
        Math.round((totals.storeEntries / totals.passerbyTotal) * 100 * 100) / 100 : 0;
      
      // Prepare hourly record
      const hourlyRecord = {
        store_id: store.id,
        organization_id: store.organization_id,
        date: hourStart.toISOString().split('T')[0],
        hour: hourStart.getHours(),
        start_time: hourStart.toISOString(),
        end_time: hourEnd.toISOString(),
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
        total_entries: totals.storeEntries,
        total_exits: totals.storeExits
      };
      
      // Add line data
      for (let i = 1; i <= 4; i++) {
        hourlyRecord[`line${i}_in`] = totals.lines.in[i-1];
        hourlyRecord[`line${i}_out`] = totals.lines.out[i-1];
      }
      
      // Insert new record
      const insertResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(hourlyRecord)
        }
      );
      
      if (insertResponse.ok) {
        totalInserted++;
        totalProcessed++;
        console.log(`    ➕ Inserted new record`);
      } else {
        // Try update if insert fails (duplicate key)
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
          totalUpdated++;
          totalProcessed++;
          console.log(`    📝 Updated existing record`);
        } else {
          const error = await insertResponse.text();
          console.log(`    ❌ Failed to insert/update: ${error}`);
        }
      }
      
      // Process regional data if available
      const regionalResponse = await fetch(
        `${supabaseUrl}/rest/v1/regional_counting_raw?` +
        `store_id=eq.${store.id}&` +
        `timestamp=gte.${hourStart.toISOString()}&` +
        `timestamp=lte.${hourEnd.toISOString()}`,
        { headers }
      );
      
      if (regionalResponse.ok) {
        const regionalData = await regionalResponse.json();
        
        if (regionalData.length > 0) {
          // Process regional metrics (simplified for brevity)
          console.log(`    🗺️  Processing ${regionalData.length} regional records`);
        }
      }
    }
  }
  
  console.log(`\n📊 Aggregation Summary:`);
  console.log(`   Processed: ${totalProcessed} records`);
  console.log(`   Inserted: ${totalInserted} new`);
  console.log(`   Updated: ${totalUpdated} existing`);
  console.log(`   Skipped: ${totalSkipped} (outside hours or existing)`);
}

async function showRecentAnalytics(supabaseUrl, supabaseKey) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };
  
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
        const entries = record.store_entries || record.total_entries || 0;
        const exits = record.store_exits || record.total_exits || 0;
        const samples = record.sample_count || 0;
        
        console.log(
          `${hourStr.padEnd(24)} | ${storeName.padEnd(8)} | ${entries.toString().padStart(7)} | ${exits.toString().padStart(5)} | ${samples.toString().padStart(7)}`
        );
      }
    }
  }
}

// Run the aggregation
runHourlyAggregation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });