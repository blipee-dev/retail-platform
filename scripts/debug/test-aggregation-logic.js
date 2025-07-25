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

async function testAggregationLogic() {
  console.log('🔍 Testing Aggregation Logic');
  console.log('=' .repeat(60));
  
  // Use environment variables from GitHub Actions
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables');
    console.log('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  const now = new Date();
  console.log(`\n📅 Current UTC time: ${now.toISOString()}`);
  
  try {
    // 1. Check if we have any raw data at all
    console.log('\n1️⃣ Checking for ANY raw data in the last 24 hours...');
    const anyDataResponse = await fetch(
      `${supabaseUrl}/rest/v1/people_counting_raw?` +
      `select=store_id,timestamp,line1_in,line2_in,line3_in,line1_out,line2_out,line3_out&` +
      `timestamp=gte.${new Date(now - 24 * 60 * 60 * 1000).toISOString()}&` +
      `order=timestamp.desc&` +
      `limit=20`,
      { headers }
    );
    
    if (anyDataResponse.ok) {
      const anyData = await anyDataResponse.json();
      console.log(`✅ Found ${anyData.length} records in last 24 hours`);
      
      if (anyData.length > 0) {
        console.log('\nSample records:');
        anyData.slice(0, 5).forEach(record => {
          const entries = (record.line1_in || 0) + (record.line2_in || 0) + (record.line3_in || 0);
          const exits = (record.line1_out || 0) + (record.line2_out || 0) + (record.line3_out || 0);
          console.log(`  ${record.timestamp}: Entries=${entries}, Exits=${exits}`);
        });
      }
    } else {
      console.log('❌ Failed to query raw data');
    }
    
    // 2. Get all stores with timezones
    console.log('\n2️⃣ Checking stores and their timezones...');
    const storesResponse = await fetch(
      `${supabaseUrl}/rest/v1/stores?select=id,name,timezone`,
      { headers }
    );
    
    if (storesResponse.ok) {
      const stores = await storesResponse.json();
      console.log(`✅ Found ${stores.length} stores`);
      
      stores.forEach(store => {
        console.log(`  ${store.name}: timezone=${store.timezone || 'UTC'}`);
      });
      
      // 3. Simulate the aggregation logic for the last 3 hours
      console.log('\n3️⃣ Simulating aggregation logic for last 3 hours...');
      
      for (let h = 0; h < 3; h++) {
        const hourStart = new Date(now.getTime() - (h + 1) * 60 * 60 * 1000);
        hourStart.setMinutes(0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setMinutes(59, 59, 999);
        
        console.log(`\n⏰ Hour ${h + 1}: ${hourStart.toISOString()} to ${hourEnd.toISOString()}`);
        
        for (const store of stores) {
          const storeTimezone = store.timezone || 'UTC';
          const storeLocalHour = getLocalHour(hourStart, storeTimezone);
          
          console.log(`\n  🏪 ${store.name} (${storeTimezone}):`);
          console.log(`     Local hour: ${storeLocalHour}:00`);
          
          // Check business hours logic
          if (storeLocalHour >= 1 && storeLocalHour < 9) {
            console.log(`     ❌ SKIPPED - Outside business hours (1 AM - 9 AM)`);
            continue;
          } else {
            console.log(`     ✅ Within business hours`);
          }
          
          // Check for data
          const dataCheckResponse = await fetch(
            `${supabaseUrl}/rest/v1/people_counting_raw?` +
            `store_id=eq.${store.id}&` +
            `timestamp=gte.${hourStart.toISOString()}&` +
            `timestamp=lte.${hourEnd.toISOString()}&` +
            `select=timestamp`,
            { headers }
          );
          
          if (dataCheckResponse.ok) {
            const dataCheck = await dataCheckResponse.json();
            console.log(`     📊 Raw data records: ${dataCheck.length}`);
            
            if (dataCheck.length === 0) {
              console.log(`     ⚠️  NO DATA for this hour`);
            }
          }
        }
      }
      
      // 4. Check existing hourly analytics
      console.log('\n4️⃣ Checking existing hourly analytics...');
      const analyticsResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?` +
        `select=hour_start,store_id,store_entries,store_exits,sample_count&` +
        `order=hour_start.desc&` +
        `limit=10`,
        { headers }
      );
      
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json();
        console.log(`✅ Found ${analytics.length} analytics records`);
        
        if (analytics.length > 0) {
          const latest = analytics[0];
          const latestTime = new Date(latest.hour_start);
          const hoursAgo = Math.round((now - latestTime) / 1000 / 60 / 60);
          
          console.log(`\n📊 Latest analytics record:`);
          console.log(`   Hour: ${latest.hour_start}`);
          console.log(`   Age: ${hoursAgo} hours ago`);
          console.log(`   Entries: ${latest.store_entries || 0}`);
          console.log(`   Exits: ${latest.store_exits || 0}`);
          console.log(`   Samples: ${latest.sample_count || 0}`);
        }
      }
      
    } else {
      console.log('❌ Failed to fetch stores');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testAggregationLogic()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });