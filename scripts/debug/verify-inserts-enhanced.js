#!/usr/bin/env node

const fetch = require('node-fetch');

async function verifyInsertsEnhanced() {
  console.log('🔍 Enhanced Insert Verification');
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
    // 1. First, verify we can connect to Supabase
    console.log('\n🔌 Testing Supabase connection...');
    const healthCheck = await fetch(`${supabaseUrl}/rest/v1/`, { 
      headers: {
        'apikey': supabaseKey
      }
    });
    
    console.log(`Connection status: ${healthCheck.status} ${healthCheck.statusText}`);
    
    // 2. Check if hourly_analytics table exists
    console.log('\n📊 Checking table existence...');
    const tableCheck = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?limit=0`,
      { headers }
    );
    
    if (!tableCheck.ok) {
      const error = await tableCheck.text();
      console.log(`❌ Table check failed: ${tableCheck.status} - ${error}`);
      return;
    }
    
    console.log('✅ Table exists and is accessible');
    
    // 3. Get ALL records (not just count)
    console.log('\n📈 Fetching ALL records from hourly_analytics...');
    
    const allRecordsResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?select=*&order=created_at.desc`,
      { headers }
    );
    
    if (allRecordsResponse.ok) {
      const allRecords = await allRecordsResponse.json();
      console.log(`\nTotal records in table: ${allRecords.length}`);
      
      if (allRecords.length > 0) {
        // Group by date
        const recordsByDate = {};
        allRecords.forEach(record => {
          const date = record.date || 'unknown';
          if (!recordsByDate[date]) {
            recordsByDate[date] = 0;
          }
          recordsByDate[date]++;
        });
        
        console.log('\nRecords by date:');
        Object.entries(recordsByDate)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 10)
          .forEach(([date, count]) => {
            console.log(`  ${date}: ${count} records`);
          });
        
        // Show most recent records
        console.log('\nMost recent 5 records:');
        console.log('Created At                | Date       | Hour | Store ID                             | Entries | Exits');
        console.log('-'.repeat(110));
        
        allRecords.slice(0, 5).forEach(record => {
          const created = record.created_at ? new Date(record.created_at).toISOString() : 'N/A';
          const storeId = (record.store_id || 'N/A').substring(0, 36);
          console.log(
            `${created} | ${record.date || 'N/A'} | ${String(record.hour || 0).padStart(2, '0')}   | ${storeId} | ${String(record.store_entries || 0).padStart(7)} | ${String(record.store_exits || 0).padStart(5)}`
          );
        });
      }
    } else {
      const error = await allRecordsResponse.text();
      console.log(`❌ Failed to fetch records: ${error}`);
    }
    
    // 4. Check for records with specific store IDs from the logs
    console.log('\n🏪 Checking specific stores that were supposedly inserted...');
    
    // These are partial IDs from the logs
    const partialStoreIds = ['d719cc6b', 'dfee65ba'];
    
    for (const partialId of partialStoreIds) {
      console.log(`\nSearching for store ID containing: ${partialId}`);
      
      // Use LIKE operator to search for partial matches
      const storeSearchResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?store_id=like.*${partialId}*&select=*&order=date.desc,hour.desc`,
        { headers }
      );
      
      if (storeSearchResponse.ok) {
        const storeRecords = await storeSearchResponse.json();
        console.log(`Found ${storeRecords.length} records`);
        
        if (storeRecords.length > 0) {
          // Show unique store IDs found
          const uniqueStoreIds = [...new Set(storeRecords.map(r => r.store_id))];
          console.log('Unique store IDs found:');
          uniqueStoreIds.forEach(id => console.log(`  - ${id}`));
          
          // Show recent records
          console.log('\nRecent records for these stores:');
          storeRecords.slice(0, 5).forEach(record => {
            console.log(`  ${record.date} hour ${record.hour}: ${record.store_entries} entries, ${record.store_exits} exits`);
          });
        }
      }
    }
    
    // 5. Try different date formats
    console.log('\n📅 Checking different date formats...');
    const today = new Date();
    const dateFormats = [
      today.toISOString().split('T')[0],  // YYYY-MM-DD
      today.toLocaleDateString('en-US'),   // MM/DD/YYYY
      today.toISOString(),                 // Full ISO
    ];
    
    for (const dateFormat of dateFormats) {
      console.log(`\nChecking date format: ${dateFormat}`);
      const dateResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?date=eq.${dateFormat}&select=count`,
        { 
          headers: {
            ...headers,
            'Prefer': 'count=exact'
          }
        }
      );
      
      if (dateResponse.ok) {
        const count = dateResponse.headers.get('content-range');
        console.log(`Records found: ${count || '0'}`);
      }
    }
    
    // 6. Check if there's a view or RLS policy issue
    console.log('\n🔒 Checking for RLS or view issues...');
    
    // Try to get table info
    const tableInfoResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_table_info?table_name=hourly_analytics`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ table_name: 'hourly_analytics' })
      }
    );
    
    if (tableInfoResponse.ok) {
      const tableInfo = await tableInfoResponse.json();
      console.log('Table info:', tableInfo);
    } else {
      console.log('Could not retrieve table info (function may not exist)');
    }
    
    // 7. Try a raw SQL query if possible
    console.log('\n🔧 Attempting direct count...');
    const countResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?select=*`,
      { 
        headers,
        method: 'HEAD'
      }
    );
    
    if (countResponse.ok) {
      const range = countResponse.headers.get('content-range');
      console.log(`Content-Range header: ${range}`);
    }
    
    // 8. Check created_at timestamps
    console.log('\n⏰ Checking recent created_at timestamps...');
    const recentResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?select=created_at,store_id,date,hour&order=created_at.desc&limit=10`,
      { headers }
    );
    
    if (recentResponse.ok) {
      const recentData = await recentResponse.json();
      if (recentData.length > 0) {
        console.log('Most recently created records:');
        recentData.forEach(record => {
          const age = Date.now() - new Date(record.created_at).getTime();
          const ageMinutes = Math.round(age / 1000 / 60);
          console.log(`  Created ${ageMinutes} minutes ago: ${record.date} hour ${record.hour} (${record.store_id?.substring(0, 8)}...)`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run enhanced verification
verifyInsertsEnhanced()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });