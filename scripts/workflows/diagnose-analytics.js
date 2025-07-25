#!/usr/bin/env node

const { SupabaseClient } = require('./lib/supabase-client');

async function diagnoseAnalytics() {
  console.log('🔍 Diagnosing Analytics Issues');
  console.log('=' .repeat(60));
  console.log(`📅 Current UTC time: ${new Date().toISOString()}\n`);
  
  const supabase = new SupabaseClient();
  const client = supabase.client;

  try {
    // 1. Check raw data in last 24 hours
    console.log('1️⃣ Checking people_counting_raw data (last 24 hours)...');
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: rawData, error: rawError } = await client
      .from('people_counting_raw')
      .select('*')
      .gte('timestamp', yesterday.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (rawError) {
      console.log('❌ Error querying raw data:', rawError.message);
    } else {
      console.log(`✅ Found ${rawData?.length || 0} recent records`);
      
      if (rawData && rawData.length > 0) {
        const latest = rawData[0];
        const latestTime = new Date(latest.timestamp);
        const ageMinutes = Math.round((Date.now() - latestTime) / 1000 / 60);
        
        console.log(`   Latest: ${latest.timestamp} (${ageMinutes} minutes ago)`);
        console.log(`   Store ID: ${latest.store_id}`);
        console.log(`   Entries: ${(latest.line1_in || 0) + (latest.line2_in || 0) + (latest.line3_in || 0)}`);
        console.log(`   Exits: ${(latest.line1_out || 0) + (latest.line2_out || 0) + (latest.line3_out || 0)}`);
      }
    }
    
    // 2. Check raw data for last 3 hours (aggregation window)
    console.log('\n2️⃣ Checking data in aggregation window (last 3 hours)...');
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    
    const { data: recentRaw, error: recentError } = await client
      .from('people_counting_raw')
      .select('store_id, timestamp')
      .gte('timestamp', threeHoursAgo.toISOString())
      .order('timestamp', { ascending: false });
    
    if (!recentError && recentRaw) {
      // Group by store
      const storeData = {};
      recentRaw.forEach(record => {
        storeData[record.store_id] = (storeData[record.store_id] || 0) + 1;
      });
      
      console.log(`✅ Found ${recentRaw.length} total records`);
      console.log('   Records by store:');
      Object.entries(storeData).forEach(([storeId, count]) => {
        console.log(`   - ${storeId}: ${count} records`);
      });
    }
    
    // 3. Check stores and their timezones
    console.log('\n3️⃣ Checking stores configuration...');
    const { data: stores, error: storesError } = await client
      .from('stores')
      .select('id, name, timezone');
    
    if (!storesError && stores) {
      console.log(`✅ Found ${stores.length} stores:`);
      stores.forEach(store => {
        const tz = store.timezone || 'UTC';
        const localTime = new Date().toLocaleString('en-US', { timeZone: tz, hour12: false });
        console.log(`   - ${store.name} (${store.id}): ${tz} - Local time: ${localTime}`);
      });
    }
    
    // 4. Check hourly analytics
    console.log('\n4️⃣ Checking hourly_analytics table...');
    const { data: analytics, error: analyticsError } = await client
      .from('hourly_analytics')
      .select('*')
      .order('hour_start', { ascending: false })
      .limit(10);
    
    if (analyticsError) {
      console.log('❌ Error querying analytics:', analyticsError.message);
    } else {
      console.log(`✅ Found ${analytics?.length || 0} hourly records`);
      
      if (analytics && analytics.length > 0) {
        const latest = analytics[0];
        const latestTime = new Date(latest.hour_start);
        const hoursAgo = Math.round((Date.now() - latestTime) / 1000 / 60 / 60);
        
        console.log(`   Latest: ${latest.hour_start} (${hoursAgo} hours ago)`);
        console.log(`   Store ID: ${latest.store_id}`);
        console.log(`   Entries: ${latest.store_entries || 0}`);
        console.log(`   Exits: ${latest.store_exits || 0}`);
        console.log(`   Samples: ${latest.sample_count || 0}`);
      }
    }
    
    // 5. Simulate aggregation logic for current hour
    console.log('\n5️⃣ Simulating aggregation logic...');
    const now = new Date();
    const currentHour = new Date(now);
    currentHour.setMinutes(0, 0, 0);
    const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);
    
    console.log(`   Current hour: ${currentHour.toISOString()}`);
    console.log(`   Previous hour: ${previousHour.toISOString()}`);
    
    // Check if we have data for previous hour
    const { data: prevHourData, error: prevHourError } = await client
      .from('people_counting_raw')
      .select('store_id')
      .gte('timestamp', previousHour.toISOString())
      .lt('timestamp', currentHour.toISOString());
    
    if (!prevHourError && prevHourData) {
      const uniqueStores = [...new Set(prevHourData.map(r => r.store_id))];
      console.log(`   Previous hour has data for ${uniqueStores.length} stores`);
      
      // Check if analytics exists for previous hour
      const { data: prevAnalytics } = await client
        .from('hourly_analytics')
        .select('store_id')
        .eq('hour_start', previousHour.toISOString());
      
      if (prevAnalytics) {
        console.log(`   Analytics exists for ${prevAnalytics.length} stores`);
        
        // Find missing
        const analyticsStores = new Set(prevAnalytics.map(a => a.store_id));
        const missing = uniqueStores.filter(s => !analyticsStores.has(s));
        
        if (missing.length > 0) {
          console.log(`   ⚠️  Missing analytics for stores: ${missing.join(', ')}`);
        }
      }
    }
    
    // 6. Check business hours logic
    console.log('\n6️⃣ Checking business hours impact...');
    if (stores) {
      for (const store of stores) {
        const tz = store.timezone || 'UTC';
        const storeTime = new Date().toLocaleString('en-US', { 
          timeZone: tz, 
          hour: 'numeric',
          hour12: false 
        });
        const hour = parseInt(storeTime);
        
        if (hour >= 1 && hour < 9) {
          console.log(`   ⚠️  ${store.name}: Currently ${hour}:00 - OUTSIDE business hours (1-9 AM excluded)`);
        } else {
          console.log(`   ✅ ${store.name}: Currently ${hour}:00 - Within business hours`);
        }
      }
    }
    
    console.log('\n✅ Diagnosis complete!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run diagnosis
diagnoseAnalytics()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });