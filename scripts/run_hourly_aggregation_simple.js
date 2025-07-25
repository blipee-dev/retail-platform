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
    return date.getUTCHours();
  }
}

async function runHourlyAggregation() {
  console.log('🚀 Starting Hourly Analytics Aggregation (Simplified)');
  console.log('=' .repeat(60));
  console.log(`📅 Current UTC time: ${new Date().toISOString()}`);
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };
  
  try {
    // Get data from last 3 hours
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    console.log(`\n📊 Manual aggregation from ${threeHoursAgo.toISOString()} to ${now.toISOString()}`);
    
    // Get all stores
    const storesResponse = await fetch(`${supabaseUrl}/rest/v1/stores?select=id,name,organization_id,timezone`, {
      headers
    });
    
    if (!storesResponse.ok) {
      throw new Error('Failed to fetch stores');
    }
    
    const stores = await storesResponse.json();
    console.log(`Found ${stores.length} stores to process`);
    
    let totalProcessed = 0;
    
    // Process each hour
    for (let h = 0; h < 3; h++) {
      const hourStart = new Date(now.getTime() - (h + 1) * 60 * 60 * 1000);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setMinutes(59, 59, 999);
      
      console.log(`\n⏰ Processing hour: ${hourStart.toISOString()} to ${hourEnd.toISOString()}`);
      
      for (const store of stores) {
        const storeTimezone = store.timezone || 'UTC';
        const storeLocalHour = getLocalHour(hourStart, storeTimezone);
        
        console.log(`  🏪 ${store.name} (${storeTimezone}): Local hour is ${storeLocalHour}:00`);
        
        // Skip if outside business hours (1 AM - 9 AM)
        if (storeLocalHour >= 1 && storeLocalHour < 9) {
          console.log(`    ⏰ Skipping - outside business hours`);
          continue;
        }
        
        // Get raw data for this hour
        const rawResponse = await fetch(
          `${supabaseUrl}/rest/v1/people_counting_raw?` +
          `store_id=eq.${store.id}&` +
          `timestamp=gte.${hourStart.toISOString()}&` +
          `timestamp=lte.${hourEnd.toISOString()}`,
          { headers }
        );
        
        if (!rawResponse.ok) {
          console.log(`    ❌ Failed to fetch data: ${rawResponse.status}`);
          continue;
        }
        
        const rawData = await rawResponse.json();
        console.log(`    📊 Found ${rawData.length} records`);
        
        if (rawData.length === 0) continue;
        
        // Calculate simple aggregates - only columns we know exist
        let totals = {
          entries: 0,
          exits: 0,
          line1_in: 0,
          line1_out: 0,
          line2_in: 0,
          line2_out: 0,
          line3_in: 0,
          line3_out: 0,
          line4_in: 0,
          line4_out: 0
        };
        
        for (const record of rawData) {
          // Sum entries/exits from lines 1-3 only
          for (let i = 1; i <= 3; i++) {
            const lineIn = record[`line${i}_in`] || 0;
            const lineOut = record[`line${i}_out`] || 0;
            totals.entries += lineIn;
            totals.exits += lineOut;
            totals[`line${i}_in`] += lineIn;
            totals[`line${i}_out`] += lineOut;
          }
          // Line 4 tracked separately
          totals.line4_in += record.line4_in || 0;
          totals.line4_out += record.line4_out || 0;
        }
        
        // Prepare minimal hourly record with only confirmed columns
        const hourlyRecord = {
          store_id: store.id,
          organization_id: store.organization_id,
          date: hourStart.toISOString().split('T')[0],
          hour: hourStart.getHours(),
          store_entries: totals.entries,
          store_exits: totals.exits,
          sample_count: rawData.length,
          // Include line data
          line1_in: totals.line1_in,
          line1_out: totals.line1_out,
          line2_in: totals.line2_in,
          line2_out: totals.line2_out,
          line3_in: totals.line3_in,
          line3_out: totals.line3_out,
          line4_in: totals.line4_in,
          line4_out: totals.line4_out
        };
        
        // Check if record exists
        const checkResponse = await fetch(
          `${supabaseUrl}/rest/v1/hourly_analytics?` +
          `store_id=eq.${store.id}&` +
          `date=eq.${hourStart.toISOString().split('T')[0]}&` +
          `hour=eq.${hourStart.getHours()}`,
          { headers }
        );
        
        if (!checkResponse.ok) {
          console.log(`    ❌ Check failed: ${checkResponse.status}`);
          continue;
        }
        
        const existingRecords = await checkResponse.json();
        
        if (existingRecords.length > 0) {
          // Update existing
          console.log(`    ✅ Found existing record, updating...`);
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
            console.log(`    📝 Updated successfully`);
          } else {
            const errorText = await updateResponse.text();
            console.log(`    ❌ Failed to update: ${updateResponse.status} - ${errorText}`);
          }
        } else {
          // Insert new
          console.log(`    ➕ No existing record, inserting new...`);
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
            console.log(`    ✅ Inserted successfully`);
          } else {
            const errorText = await insertResponse.text();
            console.log(`    ❌ Failed to insert: ${insertResponse.status} - ${errorText}`);
          }
        }
      }
    }
    
    console.log(`\n📊 Processed ${totalProcessed} hourly records`);
    console.log('\n✅ Aggregation completed!');
    
  } catch (error) {
    console.error(`❌ Aggregation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the aggregation
runHourlyAggregation()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });