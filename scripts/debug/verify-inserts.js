#!/usr/bin/env node

const fetch = require('node-fetch');

async function verifyInserts() {
  console.log('🔍 Verifying Recent Inserts');
  console.log('=' .repeat(60));
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // 1. Check total records in hourly_analytics
    console.log('\n📊 Checking hourly_analytics table...');
    
    const countResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?select=count`,
      { 
        headers: {
          ...headers,
          'Prefer': 'count=exact'
        }
      }
    );
    
    if (countResponse.ok) {
      const count = countResponse.headers.get('content-range');
      console.log(`Total records: ${count || 'Unknown'}`);
    }
    
    // 2. Check records from today
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n📅 Checking records for today (${today})...`);
    
    const todayResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?` +
      `date=eq.${today}&` +
      `select=*&` +
      `order=hour.desc`,
      { headers }
    );
    
    if (todayResponse.ok) {
      const todayData = await todayResponse.json();
      console.log(`Found ${todayData.length} records for today`);
      
      if (todayData.length > 0) {
        console.log('\nToday\'s records:');
        console.log('Hour | Store ID                             | Entries | Exits | Created');
        console.log('-'.repeat(85));
        
        todayData.forEach(record => {
          const created = record.created_at ? new Date(record.created_at).toLocaleTimeString() : 'N/A';
          console.log(
            `${String(record.hour).padStart(2, '0')}:00 | ${record.store_id} | ${String(record.store_entries || 0).padStart(7)} | ${String(record.store_exits || 0).padStart(5)} | ${created}`
          );
        });
      }
    } else {
      const error = await todayResponse.text();
      console.log(`❌ Error fetching today's data: ${error}`);
    }
    
    // 3. Check if RLS is blocking data
    console.log('\n🔒 Checking Row Level Security...');
    
    // Try with anon key (if available)
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (anonKey) {
      const anonHeaders = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      };
      
      const rlsResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?limit=1`,
        { headers: anonHeaders }
      );
      
      if (!rlsResponse.ok) {
        console.log('⚠️  RLS might be blocking access for anonymous users');
      } else {
        const rlsData = await rlsResponse.json();
        console.log(`✅ Anonymous access returns ${rlsData.length} records`);
      }
    }
    
    // 4. Check specific store IDs that were inserted
    console.log('\n🏪 Checking specific stores from logs...');
    const storeIds = ['d719cc6b', 'dfee65ba']; // From the logs
    
    for (const storeId of storeIds) {
      const storeResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?` +
        `store_id=eq.${storeId}&` +
        `date=eq.${today}&` +
        `select=hour,store_entries,store_exits`,
        { headers }
      );
      
      if (storeResponse.ok) {
        const storeData = await storeResponse.json();
        console.log(`\nStore ${storeId}: ${storeData.length} records today`);
        if (storeData.length > 0) {
          storeData.forEach(record => {
            console.log(`  Hour ${record.hour}: ${record.store_entries} entries, ${record.store_exits} exits`);
          });
        }
      }
    }
    
    // 5. Try to insert a test record
    console.log('\n🧪 Testing insert capability...');
    const testRecord = {
      store_id: 'd719cc6b-1111-1111-1111-111111111111', // Test ID
      organization_id: 'a719cc6b-1111-1111-1111-111111111111',
      date: today,
      hour: 23, // Late hour to avoid conflicts
      store_entries: 999,
      store_exits: 999,
      sample_count: 1
    };
    
    const testResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(testRecord)
      }
    );
    
    if (testResponse.ok) {
      console.log('✅ Test insert successful - deleting test record...');
      
      // Delete test record
      await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?` +
        `store_id=eq.${testRecord.store_id}&` +
        `hour=eq.23`,
        {
          method: 'DELETE',
          headers
        }
      );
    } else {
      const error = await testResponse.text();
      console.log(`❌ Test insert failed: ${error}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  }
}

// Run verification
verifyInserts()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });