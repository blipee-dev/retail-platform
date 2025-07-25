#!/usr/bin/env node

const fetch = require('node-fetch');

async function checkAnalyticsData() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDI0MDgxLCJleHAiOjIwNDU4MTYwODF9.u_JV3YNksccbnp6SqvOaL-7BSBozV_z0RIwrmniPHDU';
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  console.log('🔍 Checking Analytics Data Status');
  console.log('=' .repeat(60));
  console.log(`📅 Current UTC time: ${new Date().toISOString()}`);
  
  try {
    // 1. Check recent raw data
    console.log('\n📊 Recent People Counting Raw Data:');
    const rawResponse = await fetch(
      `${supabaseUrl}/rest/v1/people_counting_raw?` +
      `select=*,stores(name,timezone)&` +
      `order=timestamp.desc&` +
      `limit=10`,
      { headers }
    );
    
    if (rawResponse.ok) {
      const rawData = await rawResponse.json();
      console.log(`Found ${rawData.length} recent records`);
      
      if (rawData.length > 0) {
        const latest = rawData[0];
        const latestTime = new Date(latest.timestamp);
        const ageMinutes = Math.round((Date.now() - latestTime) / 1000 / 60);
        
        console.log(`Latest record: ${latest.timestamp} (${ageMinutes} minutes ago)`);
        console.log(`Store: ${latest.stores?.name || latest.store_id}`);
        console.log(`Entries: ${(latest.line1_in || 0) + (latest.line2_in || 0) + (latest.line3_in || 0)}`);
        console.log(`Exits: ${(latest.line1_out || 0) + (latest.line2_out || 0) + (latest.line3_out || 0)}`);
      }
    } else {
      console.log('Failed to fetch raw data:', await rawResponse.text());
    }
    
    // 2. Check data from last 3 hours
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    console.log(`\n📊 Data in Last 3 Hours (since ${threeHoursAgo.toISOString()}):`);
    
    const last3HoursResponse = await fetch(
      `${supabaseUrl}/rest/v1/people_counting_raw?` +
      `timestamp=gte.${threeHoursAgo.toISOString()}&` +
      `select=store_id,stores(name)`,
      { headers }
    );
    
    if (last3HoursResponse.ok) {
      const last3HoursData = await last3HoursResponse.json();
      
      // Group by store
      const storeCount = {};
      last3HoursData.forEach(record => {
        const storeName = record.stores?.name || record.store_id;
        storeCount[storeName] = (storeCount[storeName] || 0) + 1;
      });
      
      console.log(`Total records: ${last3HoursData.length}`);
      console.log('Records by store:');
      Object.entries(storeCount).forEach(([store, count]) => {
        console.log(`  ${store}: ${count} records`);
      });
    }
    
    // 3. Check hourly analytics
    console.log('\n📊 Recent Hourly Analytics:');
    const analyticsResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?` +
      `select=*,stores(name,timezone)&` +
      `order=hour_start.desc&` +
      `limit=10`,
      { headers }
    );
    
    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      console.log(`Found ${analyticsData.length} hourly records`);
      
      if (analyticsData.length > 0) {
        console.log('\nLatest 5 hourly records:');
        console.log('Hour Start          | Store              | Entries | Exits | Samples');
        console.log('-'.repeat(70));
        
        analyticsData.slice(0, 5).forEach(record => {
          const hourStr = record.hour_start.slice(0, 19).replace('T', ' ');
          const storeName = (record.stores?.name || 'Unknown').padEnd(18);
          const entries = (record.store_entries || 0).toString().padStart(7);
          const exits = (record.store_exits || 0).toString().padStart(5);
          const samples = (record.sample_count || 0).toString().padStart(7);
          
          console.log(`${hourStr} | ${storeName} | ${entries} | ${exits} | ${samples}`);
        });
        
        // Check gap
        const latestHour = new Date(analyticsData[0].hour_start);
        const hoursAgo = Math.round((Date.now() - latestHour) / 1000 / 60 / 60);
        console.log(`\n⏰ Latest hourly record is ${hoursAgo} hours old`);
      }
    } else {
      console.log('Failed to fetch analytics data:', await analyticsResponse.text());
    }
    
    // 4. Check for gaps
    console.log('\n🔍 Checking for Data Gaps:');
    
    // Get stores
    const storesResponse = await fetch(
      `${supabaseUrl}/rest/v1/stores?select=id,name,timezone`,
      { headers }
    );
    
    if (storesResponse.ok) {
      const stores = await storesResponse.json();
      
      for (const store of stores) {
        // Check if store has recent raw data
        const storeRawResponse = await fetch(
          `${supabaseUrl}/rest/v1/people_counting_raw?` +
          `store_id=eq.${store.id}&` +
          `timestamp=gte.${threeHoursAgo.toISOString()}&` +
          `limit=1`,
          { headers }
        );
        
        const hasRawData = storeRawResponse.ok && (await storeRawResponse.json()).length > 0;
        
        // Check if store has recent analytics
        const storeAnalyticsResponse = await fetch(
          `${supabaseUrl}/rest/v1/hourly_analytics?` +
          `store_id=eq.${store.id}&` +
          `hour_start=gte.${threeHoursAgo.toISOString()}&` +
          `limit=1`,
          { headers }
        );
        
        const hasAnalytics = storeAnalyticsResponse.ok && (await storeAnalyticsResponse.json()).length > 0;
        
        if (hasRawData && !hasAnalytics) {
          console.log(`⚠️  ${store.name}: Has raw data but NO analytics in last 3 hours`);
        } else if (!hasRawData) {
          console.log(`❌ ${store.name}: No raw data in last 3 hours`);
        } else {
          console.log(`✅ ${store.name}: Both raw data and analytics present`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

// Run the check
checkAnalyticsData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });