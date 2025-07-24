#!/usr/bin/env node

/**
 * Analytics aggregation with proper time column handling
 * This script aggregates hourly analytics including start_time and end_time
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function aggregateHourlyAnalytics() {
  console.log('🔄 Starting hourly analytics aggregation with time columns...');
  
  try {
    // Get the current hour (complete hours only)
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);
    
    // Calculate start and end times
    const startTime = previousHour.toISOString();
    const endTime = new Date(currentHour.getTime() - 1000).toISOString(); // 1 second before current hour
    
    console.log(`📊 Aggregating data for hour: ${previousHour.toISOString()}`);
    console.log(`   Start time: ${startTime}`);
    console.log(`   End time: ${endTime}`);
    
    // Call the stored procedure or run the aggregation
    const { data, error } = await supabase.rpc('aggregate_hourly_analytics_v3', {
      target_date: previousHour.toISOString().split('T')[0],
      target_hour: previousHour.getHours(),
      start_timestamp: startTime,
      end_timestamp: endTime
    });
    
    if (error) {
      console.log('⚠️  Stored procedure not found, using manual aggregation...');
      
      // Manual aggregation with FULL OUTER JOIN
      const query = `
        INSERT INTO hourly_analytics (
          organization_id, store_id, date, hour, start_time, end_time,
          -- People counting metrics
          total_entries, total_exits, store_entries, store_exits,
          passerby_count, passerby_in, passerby_out, capture_rate,
          entry_line1_pct, entry_line2_pct, entry_line3_pct,
          exit_line1_pct, exit_line2_pct, exit_line3_pct,
          line1_in, line1_out, line2_in, line2_out,
          line3_in, line3_out, line4_in, line4_out,
          -- Regional metrics
          total_zone_occupancy, zone1_peak_occupancy, zone2_peak_occupancy,
          zone3_peak_occupancy, zone4_peak_occupancy,
          zone1_share_pct, zone2_share_pct, zone3_share_pct, zone4_share_pct,
          avg_store_dwell_time, sample_count
        )
        SELECT 
          COALESCE(pc.organization_id, rc.organization_id),
          COALESCE(pc.store_id, rc.store_id),
          $1::DATE as date,
          $2::INTEGER as hour,
          $3::TIMESTAMPTZ as start_time,
          $4::TIMESTAMPTZ as end_time,
          -- People counting aggregates
          COALESCE(pc.total_entries, 0),
          COALESCE(pc.total_exits, 0),
          COALESCE(pc.store_entries, 0),
          COALESCE(pc.store_exits, 0),
          COALESCE(pc.passerby_count, 0),
          COALESCE(pc.passerby_in, 0),
          COALESCE(pc.passerby_out, 0),
          COALESCE(pc.capture_rate, 0),
          COALESCE(pc.entry_line1_pct, 0),
          COALESCE(pc.entry_line2_pct, 0),
          COALESCE(pc.entry_line3_pct, 0),
          COALESCE(pc.exit_line1_pct, 0),
          COALESCE(pc.exit_line2_pct, 0),
          COALESCE(pc.exit_line3_pct, 0),
          COALESCE(pc.line1_in, 0),
          COALESCE(pc.line1_out, 0),
          COALESCE(pc.line2_in, 0),
          COALESCE(pc.line2_out, 0),
          COALESCE(pc.line3_in, 0),
          COALESCE(pc.line3_out, 0),
          COALESCE(pc.line4_in, 0),
          COALESCE(pc.line4_out, 0),
          -- Regional aggregates
          COALESCE(rc.total_occupancy, 0),
          COALESCE(rc.zone1_peak, 0),
          COALESCE(rc.zone2_peak, 0),
          COALESCE(rc.zone3_peak, 0),
          COALESCE(rc.zone4_peak, 0),
          COALESCE(rc.zone1_share, 0),
          COALESCE(rc.zone2_share, 0),
          COALESCE(rc.zone3_share, 0),
          COALESCE(rc.zone4_share, 0),
          -- Dwell time calculation
          CASE 
            WHEN COALESCE(pc.store_entries, 0) > 0 AND COALESCE(rc.total_occupancy, 0) > 0 THEN 
              ROUND((rc.total_occupancy * 5.0 / pc.store_entries), 2)
            ELSE 0 
          END,
          GREATEST(COALESCE(pc.sample_count, 0), COALESCE(rc.sample_count, 0))
        FROM (
          -- People counting aggregation subquery
          SELECT 
            organization_id, store_id,
            SUM(total_in) as total_entries,
            SUM(total_out) as total_exits,
            SUM(line1_in + line2_in + line3_in) as store_entries,
            SUM(line1_out + line2_out + line3_out) as store_exits,
            SUM(line4_in + line4_out) as passerby_count,
            SUM(line4_in) as passerby_in,
            SUM(line4_out) as passerby_out,
            -- Capture rate and other calculations...
            COUNT(*) as sample_count
          FROM people_counting_raw
          WHERE timestamp >= $3 AND timestamp < $4
          GROUP BY organization_id, store_id
        ) pc
        FULL OUTER JOIN (
          -- Regional counting aggregation subquery
          SELECT 
            organization_id, store_id,
            SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy,
            MAX(region1_count) as zone1_peak,
            MAX(region2_count) as zone2_peak,
            MAX(region3_count) as zone3_peak,
            MAX(region4_count) as zone4_peak,
            -- Zone share calculations...
            COUNT(*) as sample_count
          FROM regional_counting_raw
          WHERE timestamp >= $3 AND timestamp < $4
          GROUP BY organization_id, store_id
        ) rc
        ON pc.store_id = rc.store_id
        ON CONFLICT (store_id, date, hour) DO NOTHING;
      `;
      
      // Execute manual aggregation
      const { error: insertError } = await supabase.rpc('exec_sql', {
        sql: query,
        params: [
          previousHour.toISOString().split('T')[0],
          previousHour.getHours(),
          startTime,
          endTime
        ]
      });
      
      if (insertError) {
        console.error('❌ Manual aggregation failed:', insertError);
        throw insertError;
      }
    }
    
    console.log('✅ Hourly aggregation completed successfully');
    
    // Update any records that don't have time columns set
    const { error: updateError } = await supabase
      .from('hourly_analytics')
      .update({ 
        start_time: startTime,
        end_time: endTime 
      })
      .eq('date', previousHour.toISOString().split('T')[0])
      .eq('hour', previousHour.getHours())
      .is('start_time', null);
      
    if (updateError) {
      console.warn('⚠️  Could not update time columns:', updateError.message);
    }
    
  } catch (error) {
    console.error('❌ Aggregation failed:', error);
    process.exit(1);
  }
}

// Main execution
aggregateHourlyAnalytics().catch(console.error);