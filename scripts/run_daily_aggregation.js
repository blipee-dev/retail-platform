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

async function runDailyAggregation() {
  console.log('🚀 Starting Daily Analytics Aggregation');
  console.log('=' .repeat(60));
  console.log(`📅 Current UTC time: ${new Date().toISOString()}`);
  
  const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Get date range for aggregation
    const now = new Date();
    const endDate = new Date();
    endDate.setUTCHours(0, 0, 0, 0); // Today at midnight
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1); // Yesterday
    
    // Don't aggregate future days
    if (startDate > now) {
      console.log('⏭️  Skipping future date aggregation');
      return;
    }
    
    console.log(`\n📊 Aggregating daily data for: ${startDate.toISOString().split('T')[0]}`);
    
    // Get all stores with timezone
    const storesResponse = await fetch(`${supabaseUrl}/rest/v1/stores?is_active=eq.true&select=*,timezone`, {
      headers
    });
    
    if (!storesResponse.ok) {
      throw new Error(`Failed to fetch stores: ${storesResponse.statusText}`);
    }
    
    const stores = await storesResponse.json();
    console.log(`Found ${stores.length} active stores`);
    
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    
    // Process each store
    for (const store of stores) {
      console.log(`\n📍 Processing store: ${store.name} (${store.id})`);
      
      // Get hourly data for yesterday
      const hourlyResponse = await fetch(
        `${supabaseUrl}/rest/v1/hourly_analytics?store_id=eq.${store.id}&date=eq.${startDate.toISOString().split('T')[0]}`,
        { headers }
      );
      
      if (!hourlyResponse.ok) {
        console.log(`⚠️  No hourly data for store ${store.name}`);
        continue;
      }
      
      const hourlyData = await hourlyResponse.json();
      
      if (hourlyData.length === 0) {
        console.log(`⚠️  No hourly data found for ${store.name} on ${startDate.toISOString().split('T')[0]}`);
        continue;
      }
      
      // Aggregate the hourly data
      const dailyStats = hourlyData.reduce((acc, hour) => {
        acc.total_entries += hour.total_entries || 0;
        acc.total_exits += hour.total_exits || 0;
        acc.peak_occupancy = Math.max(acc.peak_occupancy, hour.peak_occupancy || 0);
        acc.total_dwell_time += hour.avg_dwell_time || 0;
        acc.sample_count += hour.sample_count || 0;
        acc.data_quality += hour.data_quality || 0;
        acc.hours_count++;
        
        // Track peak hour
        if (hour.total_entries > acc.peak_entries) {
          acc.peak_entries = hour.total_entries;
          acc.peak_hour = hour.hour;
        }
        
        // Business hours (9 AM - 1 AM next day)
        // Note: hour 0 is 12 AM (midnight), which is within business hours
        if (hour.hour >= 9 || hour.hour === 0) {
          acc.business_hours_traffic += hour.total_entries || 0;
        }
        
        return acc;
      }, {
        total_entries: 0,
        total_exits: 0,
        peak_occupancy: 0,
        peak_entries: 0,
        peak_hour: 0,
        total_dwell_time: 0,
        sample_count: 0,
        data_quality: 0,
        hours_count: 0,
        business_hours_traffic: 0
      });
      
      // Calculate averages
      const avgDwellTime = dailyStats.hours_count > 0 ? 
        Math.round(dailyStats.total_dwell_time / dailyStats.hours_count) : 0;
      const avgDataQuality = dailyStats.hours_count > 0 ? 
        Math.round(dailyStats.data_quality / dailyStats.hours_count) : 100;
      
      // Prepare daily record
      const dailyRecord = {
        store_id: store.id,
        date: startDate.toISOString().split('T')[0],
        total_entries: dailyStats.total_entries,
        total_exits: dailyStats.total_exits,
        peak_occupancy: dailyStats.peak_occupancy,
        peak_hour: dailyStats.peak_hour,
        avg_dwell_time: avgDwellTime,
        business_hours_traffic: dailyStats.business_hours_traffic,
        conversion_rate: 0, // Would need transaction data
        data_quality: avgDataQuality,
        weather_condition: null, // Would need weather API
        is_holiday: false, // Would need holiday calendar
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Check if record exists
      const existingResponse = await fetch(
        `${supabaseUrl}/rest/v1/daily_analytics?store_id=eq.${store.id}&date=eq.${startDate.toISOString().split('T')[0]}`,
        { headers }
      );
      
      const existing = await existingResponse.json();
      
      if (existing.length > 0) {
        // Update existing record
        const updateResponse = await fetch(
          `${supabaseUrl}/rest/v1/daily_analytics?store_id=eq.${store.id}&date=eq.${startDate.toISOString().split('T')[0]}`,
          {
            method: 'PATCH',
            headers,
            body: JSON.stringify(dailyRecord)
          }
        );
        
        if (updateResponse.ok) {
          console.log(`✅ Updated daily analytics for ${store.name}`);
          totalUpdated++;
        } else {
          console.log(`❌ Failed to update daily analytics for ${store.name}`);
        }
      } else {
        // Insert new record
        const insertResponse = await fetch(
          `${supabaseUrl}/rest/v1/daily_analytics`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(dailyRecord)
          }
        );
        
        if (insertResponse.ok) {
          console.log(`✅ Inserted daily analytics for ${store.name}`);
          totalInserted++;
        } else {
          console.log(`❌ Failed to insert daily analytics for ${store.name}`);
        }
      }
      
      totalProcessed++;
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Daily Aggregation Summary:');
    console.log(`  📍 Stores processed: ${totalProcessed}`);
    console.log(`  ✨ New records: ${totalInserted}`);
    console.log(`  🔄 Updated records: ${totalUpdated}`);
    console.log(`  📅 Date: ${startDate.toISOString().split('T')[0]}`);
    console.log('=' .repeat(60));
    
    console.log('\n✅ Daily aggregation completed successfully!');
    
  } catch (error) {
    console.error(`\n❌ Daily aggregation failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Show recent daily analytics
async function showRecentDailyAnalytics(supabaseUrl, supabaseKey) {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  console.log('\n📊 Recent Daily Analytics:');
  
  const response = await fetch(
    `${supabaseUrl}/rest/v1/daily_analytics?order=date.desc&limit=10`,
    { headers }
  );
  
  if (response.ok) {
    const data = await response.json();
    
    if (data.length > 0) {
      console.log('\nDate       | Store ID                             | Entries | Peak Hour | Avg Dwell');
      console.log('-'.repeat(90));
      
      data.forEach(record => {
        console.log(
          `${record.date} | ${record.store_id} | ${String(record.total_entries).padStart(7)} | ` +
          `${String(record.peak_hour).padStart(9)}h | ${String(record.avg_dwell_time).padStart(9)}m`
        );
      });
    } else {
      console.log('No daily analytics found');
    }
  }
}

// Run aggregation and show results
async function main() {
  await runDailyAggregation();
  
  const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';
  
  await showRecentDailyAnalytics(supabaseUrl, supabaseKey);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runDailyAggregation };