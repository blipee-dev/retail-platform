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
      
      // Aggregate the hourly data with new metrics including regional
      const dailyStats = hourlyData.reduce((acc, hour) => {
        // Store traffic (use new fields if available, fallback to legacy)
        const storeEntries = hour.store_entries || hour.total_entries || 0;
        const storeExits = hour.store_exits || hour.total_exits || 0;
        
        acc.store_entries += storeEntries;
        acc.store_exits += storeExits;
        acc.passerby_count += hour.passerby_count || 0;
        acc.passerby_in += hour.passerby_in || 0;
        acc.passerby_out += hour.passerby_out || 0;
        
        // Line-specific accumulation
        for (let i = 1; i <= 4; i++) {
          acc.lines.in[i-1] += hour[`line${i}_in`] || 0;
          acc.lines.out[i-1] += hour[`line${i}_out`] || 0;
        }
        
        // Peak tracking
        if (storeEntries > acc.peak_store_entries) {
          acc.peak_store_entries = storeEntries;
          acc.peak_entry_hour = hour.hour;
        }
        
        if (storeExits > acc.peak_store_exits) {
          acc.peak_store_exits = storeExits;
          acc.peak_exit_hour = hour.hour;
        }
        
        if (hour.passerby_count > acc.peak_passerby) {
          acc.peak_passerby = hour.passerby_count;
          acc.peak_passerby_hour = hour.hour;
        }
        
        // Business hours (9 AM - 1 AM)
        if (hour.hour >= 9 || hour.hour === 0) {
          acc.business_hours_entries += storeEntries;
          acc.business_hours_passerby += hour.passerby_count || 0;
        } else {
          acc.after_hours_entries += storeEntries;
        }
        
        acc.sample_count += hour.sample_count || 0;
        acc.data_quality += hour.data_quality || 0;
        acc.hours_count++;
        
        // Regional metrics aggregation
        if (hour.total_zone_occupancy) {
          acc.total_zone_occupancy += hour.total_zone_occupancy || 0;
          acc.zone_hours_count++;
          
          // Sum zone occupancies for averaging
          acc.zone1_occupancy_sum += (hour.zone1_peak_occupancy || 0);
          acc.zone2_occupancy_sum += (hour.zone2_peak_occupancy || 0);
          acc.zone3_occupancy_sum += (hour.zone3_peak_occupancy || 0);
          acc.zone4_occupancy_sum += (hour.zone4_peak_occupancy || 0);
          
          // Track peak zone occupancies
          acc.zone1_peak = Math.max(acc.zone1_peak, hour.zone1_peak_occupancy || 0);
          acc.zone2_peak = Math.max(acc.zone2_peak, hour.zone2_peak_occupancy || 0);
          acc.zone3_peak = Math.max(acc.zone3_peak, hour.zone3_peak_occupancy || 0);
          acc.zone4_peak = Math.max(acc.zone4_peak, hour.zone4_peak_occupancy || 0);
          
          // Track when peaks occur
          if ((hour.zone1_peak_occupancy || 0) > acc.zone1_peak_value) {
            acc.zone1_peak_value = hour.zone1_peak_occupancy || 0;
            acc.zone1_peak_hour = hour.hour;
          }
          
          // Sum dwell times for averaging
          acc.total_dwell_minutes += (hour.avg_store_dwell_time || 0) * storeEntries;
          acc.dwell_entries += storeEntries;
        }
        
        return acc;
      }, {
        store_entries: 0,
        store_exits: 0,
        passerby_count: 0,
        passerby_in: 0,
        passerby_out: 0,
        lines: { in: [0, 0, 0, 0], out: [0, 0, 0, 0] },
        peak_store_entries: 0,
        peak_store_exits: 0,
        peak_passerby: 0,
        peak_entry_hour: 0,
        peak_exit_hour: 0,
        peak_passerby_hour: 0,
        business_hours_entries: 0,
        business_hours_passerby: 0,
        after_hours_entries: 0,
        sample_count: 0,
        data_quality: 0,
        hours_count: 0,
        // Regional metrics
        total_zone_occupancy: 0,
        zone_hours_count: 0,
        zone1_occupancy_sum: 0,
        zone2_occupancy_sum: 0,
        zone3_occupancy_sum: 0,
        zone4_occupancy_sum: 0,
        zone1_peak: 0,
        zone2_peak: 0,
        zone3_peak: 0,
        zone4_peak: 0,
        zone1_peak_hour: 0,
        zone1_peak_value: 0,
        total_dwell_minutes: 0,
        dwell_entries: 0
      });
      
      // Calculate distribution percentages
      const storeEntriesTotal = dailyStats.lines.in[0] + dailyStats.lines.in[1] + dailyStats.lines.in[2];
      const storeExitsTotal = dailyStats.lines.out[0] + dailyStats.lines.out[1] + dailyStats.lines.out[2];
      
      const entryLine1Pct = storeEntriesTotal > 0 ? 
        Math.round((dailyStats.lines.in[0] / storeEntriesTotal) * 100) : 0;
      const entryLine2Pct = storeEntriesTotal > 0 ? 
        Math.round((dailyStats.lines.in[1] / storeEntriesTotal) * 100) : 0;
      const entryLine3Pct = storeEntriesTotal > 0 ? 
        Math.round((dailyStats.lines.in[2] / storeEntriesTotal) * 100) : 0;
      
      const exitLine1Pct = storeExitsTotal > 0 ? 
        Math.round((dailyStats.lines.out[0] / storeExitsTotal) * 100) : 0;
      const exitLine2Pct = storeExitsTotal > 0 ? 
        Math.round((dailyStats.lines.out[1] / storeExitsTotal) * 100) : 0;
      const exitLine3Pct = storeExitsTotal > 0 ? 
        Math.round((dailyStats.lines.out[2] / storeExitsTotal) * 100) : 0;
      
      // Calculate capture rates
      const captureRate = dailyStats.passerby_count > 0 ? 
        Math.round((dailyStats.store_entries / dailyStats.passerby_count) * 100 * 100) / 100 : 0;
      const businessHoursCaptureRate = dailyStats.business_hours_passerby > 0 ? 
        Math.round((dailyStats.business_hours_entries / dailyStats.business_hours_passerby) * 100 * 100) / 100 : 0;
      
      const avgDataQuality = dailyStats.hours_count > 0 ? 
        Math.round(dailyStats.data_quality / dailyStats.hours_count) : 100;
      
      // Calculate regional metrics
      const avgStoreDwellTime = dailyStats.dwell_entries > 0 ?
        Math.round((dailyStats.total_dwell_minutes / dailyStats.dwell_entries) * 10) / 10 : 0;
      
      // Calculate daily zone shares (based on average occupancy)
      const avgZone1Occupancy = dailyStats.zone_hours_count > 0 ? 
        dailyStats.zone1_occupancy_sum / dailyStats.zone_hours_count : 0;
      const avgZone2Occupancy = dailyStats.zone_hours_count > 0 ? 
        dailyStats.zone2_occupancy_sum / dailyStats.zone_hours_count : 0;
      const avgZone3Occupancy = dailyStats.zone_hours_count > 0 ? 
        dailyStats.zone3_occupancy_sum / dailyStats.zone_hours_count : 0;
      const avgZone4Occupancy = dailyStats.zone_hours_count > 0 ? 
        dailyStats.zone4_occupancy_sum / dailyStats.zone_hours_count : 0;
      
      const totalAvgOccupancy = avgZone1Occupancy + avgZone2Occupancy + avgZone3Occupancy + avgZone4Occupancy;
      
      // Prepare daily record with all new KPIs
      const dailyRecord = {
        store_id: store.id,
        date: startDate.toISOString().split('T')[0],
        // New comprehensive metrics
        store_entries: dailyStats.store_entries,
        store_exits: dailyStats.store_exits,
        passerby_count: dailyStats.passerby_count,
        passerby_in: dailyStats.passerby_in,
        passerby_out: dailyStats.passerby_out,
        capture_rate: captureRate,
        entry_line1_pct: entryLine1Pct,
        entry_line2_pct: entryLine2Pct,
        entry_line3_pct: entryLine3Pct,
        exit_line1_pct: exitLine1Pct,
        exit_line2_pct: exitLine2Pct,
        exit_line3_pct: exitLine3Pct,
        peak_entry_hour: dailyStats.peak_entry_hour,
        peak_exit_hour: dailyStats.peak_exit_hour,
        peak_passerby_hour: dailyStats.peak_passerby_hour,
        business_hours_entries: dailyStats.business_hours_entries,
        after_hours_entries: dailyStats.after_hours_entries,
        business_hours_capture_rate: businessHoursCaptureRate,
        // Regional metrics
        avg_store_dwell_time: avgStoreDwellTime,
        total_zone_occupancy: Math.round(totalAvgOccupancy),
        zone1_share_pct: totalAvgOccupancy > 0 ? 
          Math.round((avgZone1Occupancy / totalAvgOccupancy) * 100) : 0,
        zone2_share_pct: totalAvgOccupancy > 0 ? 
          Math.round((avgZone2Occupancy / totalAvgOccupancy) * 100) : 0,
        zone3_share_pct: totalAvgOccupancy > 0 ? 
          Math.round((avgZone3Occupancy / totalAvgOccupancy) * 100) : 0,
        zone4_share_pct: totalAvgOccupancy > 0 ? 
          Math.round((avgZone4Occupancy / totalAvgOccupancy) * 100) : 0,
        zone1_peak_occupancy: dailyStats.zone1_peak,
        zone2_peak_occupancy: dailyStats.zone2_peak,
        zone3_peak_occupancy: dailyStats.zone3_peak,
        zone4_peak_occupancy: dailyStats.zone4_peak,
        zone1_peak_hour: dailyStats.zone1_peak_hour,
        // Combined people + regional metrics
        occupancy_accuracy_score: 0, // Would need to compare entries-exits vs total occupancy
        // Metadata
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