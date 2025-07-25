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
  console.log('🚀 Starting Daily Analytics Aggregation (Fixed)');
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
      
      // Aggregate the hourly data - using ALL columns that exist in daily_analytics
      const dailyStats = hourlyData.reduce((acc, hour) => {
        // Core metrics - handle both column name variants
        const entries = hour.store_entries || hour.total_entries || 0;
        const exits = hour.store_exits || hour.total_exits || 0;
        
        acc.store_entries += entries;
        acc.store_exits += exits;
        acc.total_entries += entries;
        acc.total_exits += exits;
        
        // Passerby metrics
        acc.passerby_count += hour.passerby_count || 0;
        acc.passerby_in += hour.passerby_in || 0;
        acc.passerby_out += hour.passerby_out || 0;
        
        // Track peak hours for different metrics
        if (entries > acc.peakEntries) {
          acc.peakEntries = entries;
          acc.peak_entry_hour = hour.hour;
        }
        
        if (exits > acc.peakExits) {
          acc.peakExits = exits;
          acc.peak_exit_hour = hour.hour;
        }
        
        const hourTotal = entries + exits;
        if (hourTotal > acc.peakTraffic) {
          acc.peakTraffic = hourTotal;
          acc.peak_hour = hour.hour;
        }
        
        if (hour.passerby_count > acc.peakPasserby) {
          acc.peakPasserby = hour.passerby_count || 0;
          acc.peak_passerby_hour = hour.hour;
        }
        
        // Business hours tracking (9 AM - 9 PM typically)
        const storeTimezone = store.timezone || 'UTC';
        const storeLocalHour = getLocalHour(new Date(hour.date + 'T' + String(hour.hour).padStart(2, '0') + ':00:00'), storeTimezone);
        if (storeLocalHour >= 9 && storeLocalHour < 21) {
          acc.business_hours_entries += entries;
          acc.business_hours_passerby += hour.passerby_count || 0;
        } else {
          acc.after_hours_entries += entries;
        }
        
        // Accumulate line percentages weighted by traffic
        if (entries > 0) {
          acc.entry_line1_sum += (hour.entry_line1_pct || 0) * entries;
          acc.entry_line2_sum += (hour.entry_line2_pct || 0) * entries;
          acc.entry_line3_sum += (hour.entry_line3_pct || 0) * entries;
        }
        
        if (exits > 0) {
          acc.exit_line1_sum += (hour.exit_line1_pct || 0) * exits;
          acc.exit_line2_sum += (hour.exit_line2_pct || 0) * exits;
          acc.exit_line3_sum += (hour.exit_line3_pct || 0) * exits;
        }
        
        // Zone metrics
        acc.total_zone_occupancy += hour.total_zone_occupancy || 0;
        acc.zone1_share_sum += (hour.zone1_share_pct || 0);
        acc.zone2_share_sum += (hour.zone2_share_pct || 0);
        acc.zone3_share_sum += (hour.zone3_share_pct || 0);
        acc.zone4_share_sum += (hour.zone4_share_pct || 0);
        
        // Track zone peak hours
        if ((hour.zone1_peak_occupancy || 0) > acc.zone1_peak_value) {
          acc.zone1_peak_value = hour.zone1_peak_occupancy || 0;
          acc.zone1_peak_hour = hour.hour;
        }
        if ((hour.zone2_peak_occupancy || 0) > acc.zone2_peak_value) {
          acc.zone2_peak_value = hour.zone2_peak_occupancy || 0;
          acc.zone2_peak_hour = hour.hour;
        }
        if ((hour.zone3_peak_occupancy || 0) > acc.zone3_peak_value) {
          acc.zone3_peak_value = hour.zone3_peak_occupancy || 0;
          acc.zone3_peak_hour = hour.hour;
        }
        if ((hour.zone4_peak_occupancy || 0) > acc.zone4_peak_value) {
          acc.zone4_peak_value = hour.zone4_peak_occupancy || 0;
          acc.zone4_peak_hour = hour.hour;
        }
        
        // Dwell time accumulation
        if (hour.avg_store_dwell_time && entries > 0) {
          acc.dwell_time_sum += hour.avg_store_dwell_time * entries;
          acc.dwell_entries += entries;
        }
        
        // Capture rates
        if (hour.capture_rate !== undefined) {
          acc.capture_rates.push(hour.capture_rate);
        }
        
        acc.hours_count++;
        
        return acc;
      }, {
        // Initialize all counters
        store_entries: 0,
        store_exits: 0,
        total_entries: 0,
        total_exits: 0,
        passerby_count: 0,
        passerby_in: 0,
        passerby_out: 0,
        peak_hour: 0,
        peak_entry_hour: 0,
        peak_exit_hour: 0,
        peak_passerby_hour: 0,
        peakTraffic: 0,
        peakEntries: 0,
        peakExits: 0,
        peakPasserby: 0,
        business_hours_entries: 0,
        business_hours_passerby: 0,
        after_hours_entries: 0,
        entry_line1_sum: 0,
        entry_line2_sum: 0,
        entry_line3_sum: 0,
        exit_line1_sum: 0,
        exit_line2_sum: 0,
        exit_line3_sum: 0,
        total_zone_occupancy: 0,
        zone1_share_sum: 0,
        zone2_share_sum: 0,
        zone3_share_sum: 0,
        zone4_share_sum: 0,
        zone1_peak_hour: 0,
        zone2_peak_hour: 0,
        zone3_peak_hour: 0,
        zone4_peak_hour: 0,
        zone1_peak_value: 0,
        zone2_peak_value: 0,
        zone3_peak_value: 0,
        zone4_peak_value: 0,
        dwell_time_sum: 0,
        dwell_entries: 0,
        capture_rates: [],
        hours_count: 0
      });
      
      // Calculate derived metrics
      const avgCaptureRate = dailyStats.capture_rates.length > 0 ?
        Math.round(dailyStats.capture_rates.reduce((a, b) => a + b, 0) / dailyStats.capture_rates.length * 100) / 100 : 0;
      
      const businessHoursCaptureRate = dailyStats.business_hours_passerby > 0 ?
        Math.round((dailyStats.business_hours_entries / dailyStats.business_hours_passerby) * 100 * 100) / 100 : 0;
      
      const avgDwellTime = dailyStats.dwell_entries > 0 ?
        Math.round((dailyStats.dwell_time_sum / dailyStats.dwell_entries) * 10) / 10 : 0;
      
      // Calculate weighted average line percentages
      const entryLine1Pct = dailyStats.total_entries > 0 ?
        Math.round(dailyStats.entry_line1_sum / dailyStats.total_entries) : 0;
      const entryLine2Pct = dailyStats.total_entries > 0 ?
        Math.round(dailyStats.entry_line2_sum / dailyStats.total_entries) : 0;
      const entryLine3Pct = dailyStats.total_entries > 0 ?
        Math.round(dailyStats.entry_line3_sum / dailyStats.total_entries) : 0;
        
      const exitLine1Pct = dailyStats.total_exits > 0 ?
        Math.round(dailyStats.exit_line1_sum / dailyStats.total_exits) : 0;
      const exitLine2Pct = dailyStats.total_exits > 0 ?
        Math.round(dailyStats.exit_line2_sum / dailyStats.total_exits) : 0;
      const exitLine3Pct = dailyStats.total_exits > 0 ?
        Math.round(dailyStats.exit_line3_sum / dailyStats.total_exits) : 0;
      
      // Calculate average zone shares
      const zone1SharePct = dailyStats.hours_count > 0 ?
        Math.round(dailyStats.zone1_share_sum / dailyStats.hours_count) : 0;
      const zone2SharePct = dailyStats.hours_count > 0 ?
        Math.round(dailyStats.zone2_share_sum / dailyStats.hours_count) : 0;
      const zone3SharePct = dailyStats.hours_count > 0 ?
        Math.round(dailyStats.zone3_share_sum / dailyStats.hours_count) : 0;
      const zone4SharePct = dailyStats.hours_count > 0 ?
        Math.round(dailyStats.zone4_share_sum / dailyStats.hours_count) : 0;
      
      // Prepare daily record with ALL columns that exist in the table
      const dailyRecord = {
        // Foreign keys
        store_id: store.id,
        organization_id: store.organization_id,
        
        // Core metrics
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        store_entries: dailyStats.store_entries,
        store_exits: dailyStats.store_exits,
        total_entries: dailyStats.total_entries,
        total_exits: dailyStats.total_exits,
        
        // Peak hours
        peak_hour: dailyStats.peak_hour,
        peak_entry_hour: dailyStats.peak_entry_hour,
        peak_exit_hour: dailyStats.peak_exit_hour,
        peak_passerby_hour: dailyStats.peak_passerby_hour,
        
        // Business hours metrics
        business_hours_entries: dailyStats.business_hours_entries,
        after_hours_entries: dailyStats.after_hours_entries,
        business_hours_capture_rate: businessHoursCaptureRate,
        
        // Passerby metrics
        passerby_count: dailyStats.passerby_count,
        passerby_in: dailyStats.passerby_in,
        passerby_out: dailyStats.passerby_out,
        
        // Capture rate
        capture_rate: avgCaptureRate,
        
        // Line distribution percentages
        entry_line1_pct: entryLine1Pct,
        entry_line2_pct: entryLine2Pct,
        entry_line3_pct: entryLine3Pct,
        exit_line1_pct: exitLine1Pct,
        exit_line2_pct: exitLine2Pct,
        exit_line3_pct: exitLine3Pct,
        
        // Zone metrics
        total_zone_occupancy: Math.round(dailyStats.total_zone_occupancy / Math.max(dailyStats.hours_count, 1)),
        zone1_share_pct: zone1SharePct,
        zone2_share_pct: zone2SharePct,
        zone3_share_pct: zone3SharePct,
        zone4_share_pct: zone4SharePct,
        zone1_peak_hour: dailyStats.zone1_peak_hour,
        zone2_peak_hour: dailyStats.zone2_peak_hour,
        zone3_peak_hour: dailyStats.zone3_peak_hour,
        zone4_peak_hour: dailyStats.zone4_peak_hour,
        
        // Dwell time
        avg_store_dwell_time: avgDwellTime
        
        // Don't include:
        // - net_flow (generated column)
        // - organization_name, store_name (lookup columns)
        // - created_at, updated_at (auto-managed)
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
          const errorText = await updateResponse.text();
          console.log(`❌ Failed to update: ${updateResponse.status} - ${errorText}`);
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
          const errorText = await insertResponse.text();
          console.log(`❌ Failed to insert: ${insertResponse.status} - ${errorText}`);
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
      console.log('\nDate       | Store ID                             | Entries | Exits | Peak Hour');
      console.log('-'.repeat(80));
      
      data.forEach(record => {
        console.log(
          `${record.date} | ${record.store_id} | ${String(record.total_entries || 0).padStart(7)} | ` +
          `${String(record.total_exits || 0).padStart(5)} | ${String(record.peak_hour || 0).padStart(9)}h`
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
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseKey) {
    await showRecentDailyAnalytics(supabaseUrl, supabaseKey);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runDailyAggregation };