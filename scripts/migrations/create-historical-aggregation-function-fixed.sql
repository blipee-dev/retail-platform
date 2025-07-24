-- Create function to aggregate historical hourly data
-- FIXED VERSION: Uses correct people_counting_raw table structure

CREATE OR REPLACE FUNCTION aggregate_hourly_data_range(
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TEXT AS $$
DECLARE
  current_hour TIMESTAMP;
  store_record RECORD;
  processed_count INTEGER := 0;
BEGIN
  -- Loop through each hour in the range
  current_hour := date_trunc('hour', start_date);
  
  WHILE current_hour <= end_date LOOP
    -- Process each store for this hour
    FOR store_record IN 
      SELECT DISTINCT s.id as store_id, s.organization_id, s.timezone
      FROM stores s
      WHERE s.is_active = true
    LOOP
      -- Delete existing record for this hour if exists
      DELETE FROM hourly_analytics 
      WHERE store_id = store_record.store_id 
        AND date = current_hour::date
        AND hour = EXTRACT(hour FROM current_hour);
      
      -- Insert aggregated data
      INSERT INTO hourly_analytics (
        store_id,
        organization_id,
        date,
        hour,
        -- People counting metrics
        total_entries,
        total_exits,
        store_entries,
        store_exits,
        passerby_count,
        passerby_in,
        passerby_out,
        capture_rate,
        entry_line1_pct,
        entry_line2_pct,
        entry_line3_pct,
        exit_line1_pct,
        exit_line2_pct,
        exit_line3_pct,
        line1_in,
        line1_out,
        line2_in,
        line2_out,
        line3_in,
        line3_out,
        line4_in,
        line4_out,
        -- Regional metrics
        avg_store_dwell_time,
        total_zone_occupancy,
        zone1_share_pct,
        zone2_share_pct,
        zone3_share_pct,
        zone4_share_pct,
        zone1_peak_occupancy,
        zone2_peak_occupancy,
        zone3_peak_occupancy,
        zone4_peak_occupancy,
        zone1_dwell_contribution,
        zone2_dwell_contribution,
        zone3_dwell_contribution,
        zone4_dwell_contribution,
        -- Metadata
        sample_count,
        created_at,
        updated_at
      )
      SELECT
        store_record.store_id,
        store_record.organization_id,
        current_hour::date as date,
        EXTRACT(hour FROM current_hour) as hour,
        -- People counting aggregates using ACTUAL column names
        SUM(p.total_in) as total_entries,  -- Using computed column
        SUM(p.total_out) as total_exits,   -- Using computed column
        -- Store entries/exits (Lines 1-3)
        SUM(p.line1_in + p.line2_in + p.line3_in) as store_entries,
        SUM(p.line1_out + p.line2_out + p.line3_out) as store_exits,
        -- Passerby traffic (Line 4)
        SUM(p.line4_in + p.line4_out) as passerby_count,
        SUM(p.line4_in) as passerby_in,
        SUM(p.line4_out) as passerby_out,
        -- Capture rate
        CASE 
          WHEN SUM(p.line4_in + p.line4_out) > 0 THEN
            ROUND((SUM(p.line1_in + p.line2_in + p.line3_in)::DECIMAL / 
                   SUM(p.line4_in + p.line4_out)::DECIMAL * 100), 2)
          ELSE 0
        END as capture_rate,
        -- Entry distribution percentages
        CASE 
          WHEN SUM(p.line1_in + p.line2_in + p.line3_in) > 0 THEN
            ROUND(SUM(p.line1_in)::DECIMAL / 
                  SUM(p.line1_in + p.line2_in + p.line3_in)::DECIMAL * 100, 2)
          ELSE 0
        END as entry_line1_pct,
        CASE 
          WHEN SUM(p.line1_in + p.line2_in + p.line3_in) > 0 THEN
            ROUND(SUM(p.line2_in)::DECIMAL / 
                  SUM(p.line1_in + p.line2_in + p.line3_in)::DECIMAL * 100, 2)
          ELSE 0
        END as entry_line2_pct,
        CASE 
          WHEN SUM(p.line1_in + p.line2_in + p.line3_in) > 0 THEN
            ROUND(SUM(p.line3_in)::DECIMAL / 
                  SUM(p.line1_in + p.line2_in + p.line3_in)::DECIMAL * 100, 2)
          ELSE 0
        END as entry_line3_pct,
        -- Exit distribution percentages
        CASE 
          WHEN SUM(p.line1_out + p.line2_out + p.line3_out) > 0 THEN
            ROUND(SUM(p.line1_out)::DECIMAL / 
                  SUM(p.line1_out + p.line2_out + p.line3_out)::DECIMAL * 100, 2)
          ELSE 0
        END as exit_line1_pct,
        CASE 
          WHEN SUM(p.line1_out + p.line2_out + p.line3_out) > 0 THEN
            ROUND(SUM(p.line2_out)::DECIMAL / 
                  SUM(p.line1_out + p.line2_out + p.line3_out)::DECIMAL * 100, 2)
          ELSE 0
        END as exit_line2_pct,
        CASE 
          WHEN SUM(p.line1_out + p.line2_out + p.line3_out) > 0 THEN
            ROUND(SUM(p.line3_out)::DECIMAL / 
                  SUM(p.line1_out + p.line2_out + p.line3_out)::DECIMAL * 100, 2)
          ELSE 0
        END as exit_line3_pct,
        -- Line details
        SUM(p.line1_in) as line1_in,
        SUM(p.line1_out) as line1_out,
        SUM(p.line2_in) as line2_in,
        SUM(p.line2_out) as line2_out,
        SUM(p.line3_in) as line3_in,
        SUM(p.line3_out) as line3_out,
        SUM(p.line4_in) as line4_in,
        SUM(p.line4_out) as line4_out,
        -- Regional metrics (from regional_counting_raw)
        0 as avg_store_dwell_time, -- Calculated separately
        0 as total_zone_occupancy,
        0 as zone1_share_pct,
        0 as zone2_share_pct,
        0 as zone3_share_pct,
        0 as zone4_share_pct,
        0 as zone1_peak_occupancy,
        0 as zone2_peak_occupancy,
        0 as zone3_peak_occupancy,
        0 as zone4_peak_occupancy,
        0 as zone1_dwell_contribution,
        0 as zone2_dwell_contribution,
        0 as zone3_dwell_contribution,
        0 as zone4_dwell_contribution,
        -- Quality metrics
        COUNT(DISTINCT p.id) as sample_count,
        NOW() as created_at,
        NOW() as updated_at
      FROM people_counting_raw p
      WHERE p.store_id = store_record.store_id
        AND p.timestamp >= current_hour
        AND p.timestamp < current_hour + INTERVAL '1 hour'
      GROUP BY store_record.store_id, store_record.organization_id
      HAVING COUNT(p.id) > 0;
      
      -- Update regional metrics for this hour
      UPDATE hourly_analytics ha
      SET 
        total_zone_occupancy = r.total_occupancy,
        zone1_share_pct = r.zone1_share,
        zone2_share_pct = r.zone2_share,
        zone3_share_pct = r.zone3_share,
        zone4_share_pct = r.zone4_share,
        zone1_peak_occupancy = r.zone1_peak,
        zone2_peak_occupancy = r.zone2_peak,
        zone3_peak_occupancy = r.zone3_peak,
        zone4_peak_occupancy = r.zone4_peak,
        avg_store_dwell_time = CASE 
          WHEN ha.store_entries > 0 THEN 
            (r.total_occupancy * 5.0 / ha.store_entries) -- 5 min intervals
          ELSE 0 
        END
      FROM (
        SELECT 
          store_id,
          SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy,
          CASE WHEN SUM(region1_count + region2_count + region3_count + region4_count) > 0 THEN
            ROUND(SUM(region1_count)::DECIMAL / SUM(region1_count + region2_count + region3_count + region4_count) * 100, 2)
          ELSE 0 END as zone1_share,
          CASE WHEN SUM(region1_count + region2_count + region3_count + region4_count) > 0 THEN
            ROUND(SUM(region2_count)::DECIMAL / SUM(region1_count + region2_count + region3_count + region4_count) * 100, 2)
          ELSE 0 END as zone2_share,
          CASE WHEN SUM(region1_count + region2_count + region3_count + region4_count) > 0 THEN
            ROUND(SUM(region3_count)::DECIMAL / SUM(region1_count + region2_count + region3_count + region4_count) * 100, 2)
          ELSE 0 END as zone3_share,
          CASE WHEN SUM(region1_count + region2_count + region3_count + region4_count) > 0 THEN
            ROUND(SUM(region4_count)::DECIMAL / SUM(region1_count + region2_count + region3_count + region4_count) * 100, 2)
          ELSE 0 END as zone4_share,
          MAX(region1_count) as zone1_peak,
          MAX(region2_count) as zone2_peak,
          MAX(region3_count) as zone3_peak,
          MAX(region4_count) as zone4_peak
        FROM regional_counting_raw
        WHERE store_id = store_record.store_id
          AND timestamp >= current_hour
          AND timestamp < current_hour + INTERVAL '1 hour'
        GROUP BY store_id
      ) r
      WHERE ha.store_id = r.store_id
        AND ha.date = current_hour::date
        AND ha.hour = EXTRACT(hour FROM current_hour);
      
      processed_count := processed_count + 1;
    END LOOP;
    
    -- Move to next hour
    current_hour := current_hour + INTERVAL '1 hour';
  END LOOP;
  
  RETURN format('Processed %s store-hours from %s to %s', 
    processed_count, 
    start_date::text, 
    end_date::text
  );
END;
$$ LANGUAGE plpgsql;

-- Create daily aggregation function  
CREATE OR REPLACE FUNCTION aggregate_daily_data_range(
  start_date DATE,
  end_date DATE
)
RETURNS TEXT AS $$
DECLARE
  current_day DATE;
  processed_count INTEGER := 0;
BEGIN
  current_day := start_date;
  
  WHILE current_day <= end_date LOOP
    -- Delete existing records for this date
    DELETE FROM daily_analytics WHERE date = current_day;
    
    -- Insert aggregated daily data
    INSERT INTO daily_analytics (
      store_id,
      organization_id,
      date,
      -- People counting metrics
      total_entries,
      total_exits,
      store_entries,
      store_exits,
      passerby_count,
      passerby_in,
      passerby_out,
      capture_rate,
      peak_hour,
      -- Regional metrics
      avg_store_dwell_time,
      total_zone_occupancy,
      zone1_share_pct,
      zone2_share_pct,
      zone3_share_pct,
      zone4_share_pct,
      zone1_peak_hour,
      zone2_peak_hour,
      zone3_peak_hour,
      zone4_peak_hour,
      -- Metadata
      created_at,
      updated_at
    )
    SELECT
      store_id,
      organization_id,
      date,
      SUM(total_entries) as total_entries,
      SUM(total_exits) as total_exits,
      SUM(store_entries) as store_entries,
      SUM(store_exits) as store_exits,
      SUM(passerby_count) as passerby_count,
      SUM(passerby_in) as passerby_in,
      SUM(passerby_out) as passerby_out,
      AVG(capture_rate) as capture_rate,
      -- Peak hour (when most entries occurred)
      (SELECT hour FROM hourly_analytics h2 
       WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
       ORDER BY store_entries DESC LIMIT 1) as peak_hour,
      -- Regional metrics
      AVG(avg_store_dwell_time) as avg_store_dwell_time,
      SUM(total_zone_occupancy) as total_zone_occupancy,
      AVG(zone1_share_pct) as zone1_share_pct,
      AVG(zone2_share_pct) as zone2_share_pct,
      AVG(zone3_share_pct) as zone3_share_pct,
      AVG(zone4_share_pct) as zone4_share_pct,
      -- Zone peak hours
      (SELECT hour FROM hourly_analytics h2 
       WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
       ORDER BY zone1_peak_occupancy DESC LIMIT 1) as zone1_peak_hour,
      (SELECT hour FROM hourly_analytics h2 
       WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
       ORDER BY zone2_peak_occupancy DESC LIMIT 1) as zone2_peak_hour,
      (SELECT hour FROM hourly_analytics h2 
       WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
       ORDER BY zone3_peak_occupancy DESC LIMIT 1) as zone3_peak_hour,
      (SELECT hour FROM hourly_analytics h2 
       WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
       ORDER BY zone4_peak_occupancy DESC LIMIT 1) as zone4_peak_hour,
      NOW() as created_at,
      NOW() as updated_at
    FROM hourly_analytics ha
    WHERE date = current_day
    GROUP BY store_id, organization_id, date
    HAVING COUNT(*) > 0;
    
    processed_count := processed_count + (SELECT COUNT(*) FROM daily_analytics WHERE date = current_day);
    current_day := current_day + INTERVAL '1 day';
  END LOOP;
  
  RETURN format('Processed %s store-days from %s to %s', 
    processed_count, 
    start_date::text, 
    end_date::text
  );
END;
$$ LANGUAGE plpgsql;

-- Usage:
-- SELECT aggregate_hourly_data_range('2025-07-01 00:00:00'::timestamptz, '2025-07-24 23:59:59'::timestamptz);
-- SELECT aggregate_daily_data_range('2025-07-01'::date, '2025-07-24'::date);