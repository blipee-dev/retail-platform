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
  
  const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';
  
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
    
    for (const store of stores) {
      // Check business hours for this store's timezone
      const storeTimezone = store.timezone || 'UTC';
      const storeLocalHour = getLocalHour(hourStart, storeTimezone);
      
      // Skip if outside business hours (1 AM - 9 AM)
      if (storeLocalHour >= 1 && storeLocalHour < 9) {
        console.log(`    ⏰ Skipping ${store.name} - outside business hours (${storeLocalHour}:00 local)`);
        continue;
      }
      
      // Skip future hours
      if (hourStart > now) {
        console.log(`    ⏭️  Skipping ${store.name} - future hour`);
        continue;
      }
      
      // Get raw data for this hour (complete hour period)
      const rawResponse = await fetch(
        `${supabaseUrl}/rest/v1/people_counting_raw?` +
        `store_id=eq.${store.id}&` +
        `timestamp=gte.${hourStart.toISOString()}&` +
        `timestamp=lte.${hourEnd.toISOString()}&` +
        `timestamp=lte.${now.toISOString()}`, // Exclude future data
        { headers }
      );
      
      if (!rawResponse.ok) continue;
      
      const rawData = await rawResponse.json();
      if (rawData.length === 0) continue;
      
      // Calculate aggregates
      let totals = {
        entries: 0,
        exits: 0,
        lines: { in: [0, 0, 0, 0], out: [0, 0, 0, 0] }
      };
      
      for (const record of rawData) {
        for (let i = 1; i <= 4; i++) {
          const lineIn = record[`line${i}_in`] || 0;
          const lineOut = record[`line${i}_out`] || 0;
          totals.entries += lineIn;
          totals.exits += lineOut;
          totals.lines.in[i-1] += lineIn;
          totals.lines.out[i-1] += lineOut;
        }
      }
      
      // Prepare hourly record
      const hourlyRecord = {
        store_id: store.id,
        organization_id: store.organization_id,
        hour_start: hourStart.toISOString(),
        date: hourStart.toISOString().split('T')[0],
        hour: hourStart.getHours(),
        total_entries: totals.entries,
        total_exits: totals.exits,
        total_in: totals.entries,
        total_out: totals.exits,
        net_flow: totals.entries - totals.exits,
        sample_count: rawData.length,
        avg_occupancy: 0,
        peak_occupancy: 0
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
        `hour_start=eq.${hourStart.toISOString()}`,
        { headers }
      );
      
      if (checkResponse.ok && (await checkResponse.json()).length > 0) {
        // Update existing
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/hourly_analytics?` +
          `store_id=eq.${store.id}&` +
          `hour_start=eq.${hourStart.toISOString()}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(hourlyRecord)
          }
        );
        
        if (updateResponse.ok) {
          totalProcessed++;
          console.log(`  📝 Updated ${store.name} - ${hourStart.toISOString()}`);
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
        }
      }
    }
  }
  
  console.log(`\n📊 Processed ${totalProcessed} hourly records`);
}

async function showRecentAnalytics(supabaseUrl, supabaseKey) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };
  
  // Get recent hourly analytics
  const recentResponse = await fetch(
    `${supabaseUrl}/rest/v1/hourly_analytics?select=*&order=hour_start.desc&limit=10`,
    { headers }
  );
  
  if (recentResponse.ok) {
    const recentData = await recentResponse.json();
    console.log('\n📊 Recent Hourly Analytics:');
    console.log('Hour                     | Entries | Exits | Net Flow | Samples');
    console.log('-'.repeat(65));
    
    for (const record of recentData.slice(0, 5)) {
      const hourStr = record.hour_start ? 
        new Date(record.hour_start).toISOString().replace('T', ' ').slice(0, 19) : 
        'Unknown';
      const entries = record.total_entries || record.total_in || 0;
      const exits = record.total_exits || record.total_out || 0;
      const netFlow = record.net_flow || (entries - exits);
      const samples = record.sample_count || 0;
      
      console.log(
        `${hourStr.padEnd(24)} | ${entries.toString().padStart(7)} | ${exits.toString().padStart(5)} | ${netFlow.toString().padStart(8)} | ${samples.toString().padStart(7)}`
      );
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