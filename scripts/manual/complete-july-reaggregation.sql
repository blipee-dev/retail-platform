-- Complete re-aggregation of July 2025 data
-- This fixes all issues and properly calculates all metrics

-- STEP 1: Fix the trigger function first
CREATE OR REPLACE FUNCTION update_name_columns()
RETURNS TRIGGER AS $$
DECLARE
  v_sensor_id UUID;
  v_sensor_name VARCHAR(255);
BEGIN
  -- Get organization name
  IF NEW.organization_id IS NOT NULL THEN
    SELECT name INTO NEW.organization_name
    FROM organizations
    WHERE id = NEW.organization_id;
  END IF;
  
  -- Get store name
  IF NEW.store_id IS NOT NULL THEN
    SELECT name INTO NEW.store_name
    FROM stores
    WHERE id = NEW.store_id;
  END IF;
  
  -- Handle sensor_name only for tables that actually have sensor_id
  BEGIN
    IF TG_TABLE_NAME IN ('people_counting_raw', 'regional_counting_raw') THEN
      EXECUTE format('SELECT $1.sensor_id', NEW) INTO v_sensor_id;
      
      IF v_sensor_id IS NOT NULL THEN
        SELECT sensor_name INTO v_sensor_name
        FROM sensor_metadata
        WHERE id = v_sensor_id;
        
        NEW.sensor_name := v_sensor_name;
      END IF;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      NULL; -- sensor_id doesn't exist, that's OK
    WHEN OTHERS THEN
      NULL; -- Any other error, skip
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Clear existing July analytics data
DELETE FROM hourly_analytics WHERE date >= '2025-07-01' AND date <= '2025-07-31';
DELETE FROM daily_analytics WHERE date >= '2025-07-01' AND date <= '2025-07-31';

-- STEP 2.5: Add time columns if they don't exist
ALTER TABLE hourly_analytics 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

ALTER TABLE daily_analytics
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- STEP 3: Create hourly analytics from BOTH people counting and regional data
INSERT INTO hourly_analytics (
  organization_id,
  store_id,
  date,
  hour,
  start_time,
  end_time,
  -- People counting metrics (will be 0 if no data)
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
  total_zone_occupancy,
  zone1_peak_occupancy,
  zone2_peak_occupancy,
  zone3_peak_occupancy,
  zone4_peak_occupancy,
  zone1_share_pct,
  zone2_share_pct,
  zone3_share_pct,
  zone4_share_pct,
  avg_store_dwell_time,
  -- Metadata
  sample_count
)
SELECT 
  COALESCE(pc.organization_id, rc.organization_id) as organization_id,
  COALESCE(pc.store_id, rc.store_id) as store_id,
  COALESCE(pc.date, rc.date) as date,
  COALESCE(pc.hour, rc.hour) as hour,
  -- Calculate start and end times
  COALESCE(pc.date, rc.date) + (COALESCE(pc.hour, rc.hour) || ' hours')::INTERVAL as start_time,
  COALESCE(pc.date, rc.date) + (COALESCE(pc.hour, rc.hour) || ' hours')::INTERVAL + INTERVAL '59 minutes 59 seconds' as end_time,
  -- People counting metrics
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
  -- Regional metrics
  COALESCE(rc.total_occupancy, 0),
  COALESCE(rc.zone1_peak, 0),
  COALESCE(rc.zone2_peak, 0),
  COALESCE(rc.zone3_peak, 0),
  COALESCE(rc.zone4_peak, 0),
  COALESCE(rc.zone1_share, 0),
  COALESCE(rc.zone2_share, 0),
  COALESCE(rc.zone3_share, 0),
  COALESCE(rc.zone4_share, 0),
  -- Calculate dwell time
  CASE 
    WHEN COALESCE(pc.store_entries, 0) > 0 AND COALESCE(rc.total_occupancy, 0) > 0 THEN 
      ROUND((rc.total_occupancy * 5.0 / pc.store_entries), 2) -- 5 min intervals
    ELSE 0 
  END,
  -- Sample count
  GREATEST(COALESCE(pc.sample_count, 0), COALESCE(rc.sample_count, 0))
FROM (
  -- People counting aggregation (currently empty but structure is here)
  SELECT 
    organization_id,
    store_id,
    DATE(timestamp) as date,
    EXTRACT(hour FROM timestamp) as hour,
    SUM(total_in) as total_entries,
    SUM(total_out) as total_exits,
    SUM(line1_in + line2_in + line3_in) as store_entries,
    SUM(line1_out + line2_out + line3_out) as store_exits,
    SUM(line4_in + line4_out) as passerby_count,
    SUM(line4_in) as passerby_in,
    SUM(line4_out) as passerby_out,
    -- Capture rate
    CASE 
      WHEN SUM(line4_in + line4_out) > 0 THEN
        ROUND((SUM(line1_in + line2_in + line3_in)::DECIMAL / 
               SUM(line4_in + line4_out)::DECIMAL * 100), 2)
      ELSE 0
    END as capture_rate,
    -- Entry percentages
    CASE WHEN SUM(line1_in + line2_in + line3_in) > 0 THEN
      ROUND(SUM(line1_in)::DECIMAL / SUM(line1_in + line2_in + line3_in) * 100, 2)
    ELSE 0 END as entry_line1_pct,
    CASE WHEN SUM(line1_in + line2_in + line3_in) > 0 THEN
      ROUND(SUM(line2_in)::DECIMAL / SUM(line1_in + line2_in + line3_in) * 100, 2)
    ELSE 0 END as entry_line2_pct,
    CASE WHEN SUM(line1_in + line2_in + line3_in) > 0 THEN
      ROUND(SUM(line3_in)::DECIMAL / SUM(line1_in + line2_in + line3_in) * 100, 2)
    ELSE 0 END as entry_line3_pct,
    -- Exit percentages
    CASE WHEN SUM(line1_out + line2_out + line3_out) > 0 THEN
      ROUND(SUM(line1_out)::DECIMAL / SUM(line1_out + line2_out + line3_out) * 100, 2)
    ELSE 0 END as exit_line1_pct,
    CASE WHEN SUM(line1_out + line2_out + line3_out) > 0 THEN
      ROUND(SUM(line2_out)::DECIMAL / SUM(line1_out + line2_out + line3_out) * 100, 2)
    ELSE 0 END as exit_line2_pct,
    CASE WHEN SUM(line1_out + line2_out + line3_out) > 0 THEN
      ROUND(SUM(line3_out)::DECIMAL / SUM(line1_out + line2_out + line3_out) * 100, 2)
    ELSE 0 END as exit_line3_pct,
    -- Line details
    SUM(line1_in) as line1_in,
    SUM(line1_out) as line1_out,
    SUM(line2_in) as line2_in,
    SUM(line2_out) as line2_out,
    SUM(line3_in) as line3_in,
    SUM(line3_out) as line3_out,
    SUM(line4_in) as line4_in,
    SUM(line4_out) as line4_out,
    COUNT(*) as sample_count
  FROM people_counting_raw
  WHERE timestamp >= '2025-07-01' AND timestamp < '2025-08-01'
  GROUP BY organization_id, store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
) pc
FULL OUTER JOIN (
  -- Regional counting aggregation
  SELECT 
    organization_id,
    store_id,
    DATE(timestamp) as date,
    EXTRACT(hour FROM timestamp) as hour,
    SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy,
    MAX(region1_count) as zone1_peak,
    MAX(region2_count) as zone2_peak,
    MAX(region3_count) as zone3_peak,
    MAX(region4_count) as zone4_peak,
    -- Zone shares
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
    COUNT(*) as sample_count
  FROM regional_counting_raw
  WHERE timestamp >= '2025-07-01' AND timestamp < '2025-08-01'
  GROUP BY organization_id, store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
) rc
ON pc.store_id = rc.store_id 
   AND pc.date = rc.date 
   AND pc.hour = rc.hour;

-- STEP 4: Create daily analytics from hourly data
INSERT INTO daily_analytics (
  organization_id,
  store_id,
  date,
  start_time,
  end_time,
  -- People counting daily totals
  total_entries,
  total_exits,
  store_entries,
  store_exits,
  passerby_count,
  passerby_in,
  passerby_out,
  capture_rate,
  -- Peak hours
  peak_hour,
  peak_entry_hour,
  peak_exit_hour,
  peak_passerby_hour,
  -- Distribution averages
  entry_line1_pct,
  entry_line2_pct,
  entry_line3_pct,
  exit_line1_pct,
  exit_line2_pct,
  exit_line3_pct,
  -- Business hours
  business_hours_entries,
  after_hours_entries,
  business_hours_capture_rate,
  -- Regional daily metrics
  total_zone_occupancy,
  zone1_share_pct,
  zone2_share_pct,
  zone3_share_pct,
  zone4_share_pct,
  avg_store_dwell_time,
  zone1_peak_hour,
  zone2_peak_hour,
  zone3_peak_hour,
  zone4_peak_hour
)
SELECT
  organization_id,
  store_id,
  date,
  -- Calculate daily start and end times
  date::TIMESTAMP as start_time,
  date::TIMESTAMP + INTERVAL '23 hours 59 minutes 59 seconds' as end_time,
  -- People counting sums
  SUM(total_entries),
  SUM(total_exits),
  SUM(store_entries),
  SUM(store_exits),
  SUM(passerby_count),
  SUM(passerby_in),
  SUM(passerby_out),
  AVG(CASE WHEN capture_rate > 0 THEN capture_rate END),
  -- Peak hours
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY total_entries DESC LIMIT 1),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY store_entries DESC LIMIT 1),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY store_exits DESC LIMIT 1),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY passerby_count DESC LIMIT 1),
  -- Distribution averages
  AVG(entry_line1_pct),
  AVG(entry_line2_pct),
  AVG(entry_line3_pct),
  AVG(exit_line1_pct),
  AVG(exit_line2_pct),
  AVG(exit_line3_pct),
  -- Business hours (9 AM - 1 AM = hours 9-24,0)
  SUM(CASE WHEN hour >= 9 OR hour = 0 THEN store_entries ELSE 0 END),
  SUM(CASE WHEN hour < 9 AND hour > 0 THEN store_entries ELSE 0 END),
  AVG(CASE WHEN (hour >= 9 OR hour = 0) AND capture_rate > 0 THEN capture_rate END),
  -- Regional sums and averages
  SUM(total_zone_occupancy),
  AVG(zone1_share_pct),
  AVG(zone2_share_pct),
  AVG(zone3_share_pct),
  AVG(zone4_share_pct),
  AVG(CASE WHEN avg_store_dwell_time > 0 THEN avg_store_dwell_time END),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY zone1_peak_occupancy DESC LIMIT 1),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY zone2_peak_occupancy DESC LIMIT 1),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY zone3_peak_occupancy DESC LIMIT 1),
  (SELECT hour FROM hourly_analytics h2 
   WHERE h2.store_id = ha.store_id AND h2.date = ha.date 
   ORDER BY zone4_peak_occupancy DESC LIMIT 1)
FROM hourly_analytics ha
WHERE date >= '2025-07-01' AND date <= '2025-07-31'
GROUP BY organization_id, store_id, date;

-- STEP 5: Verify results
SELECT 'Aggregation Summary:' as report;

SELECT 
  'Hourly Analytics' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT store_id) as stores,
  COUNT(DISTINCT date) as days,
  COUNT(CASE WHEN total_zone_occupancy > 0 THEN 1 END) as records_with_regional_data,
  COUNT(CASE WHEN store_entries > 0 THEN 1 END) as records_with_people_data
FROM hourly_analytics
WHERE date >= '2025-07-01';

SELECT 
  'Daily Analytics' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT store_id) as stores,
  COUNT(DISTINCT date) as days,
  COUNT(CASE WHEN total_zone_occupancy > 0 THEN 1 END) as records_with_regional_data,
  COUNT(CASE WHEN store_entries > 0 THEN 1 END) as records_with_people_data
FROM daily_analytics
WHERE date >= '2025-07-01';

-- Sample data
SELECT 'Sample Hourly Data with Regional Metrics:' as report;

SELECT 
  store_name,
  date,
  hour,
  start_time,
  end_time,
  store_entries,
  passerby_count,
  capture_rate,
  total_zone_occupancy,
  zone1_peak_occupancy,
  zone2_peak_occupancy,
  zone3_peak_occupancy,
  zone4_peak_occupancy,
  zone1_share_pct,
  avg_store_dwell_time
FROM hourly_analytics
WHERE date >= '2025-07-01'
  AND total_zone_occupancy > 0
ORDER BY start_time DESC
LIMIT 10;