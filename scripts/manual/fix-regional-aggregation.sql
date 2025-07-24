-- Fix regional data aggregation for July 2025
-- This script properly aggregates the regional data we collected

-- First, let's verify we have the raw data
SELECT 
  'Regional raw data to aggregate:' as step,
  COUNT(*) as total_records,
  COUNT(DISTINCT store_id) as stores,
  SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01';

-- Now update the hourly_analytics table with the correct regional data
-- We'll do this in batches by date to avoid timeout

-- Update July 1-7
WITH regional_hourly AS (
  SELECT 
    store_id,
    DATE(timestamp) as date,
    EXTRACT(hour FROM timestamp) as hour,
    -- Aggregates
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
  WHERE timestamp >= '2025-07-01' AND timestamp < '2025-07-08'
  GROUP BY store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
)
UPDATE hourly_analytics ha
SET 
  total_zone_occupancy = rh.total_occupancy,
  zone1_peak_occupancy = rh.zone1_peak,
  zone2_peak_occupancy = rh.zone2_peak,
  zone3_peak_occupancy = rh.zone3_peak,
  zone4_peak_occupancy = rh.zone4_peak,
  zone1_share_pct = rh.zone1_share,
  zone2_share_pct = rh.zone2_share,
  zone3_share_pct = rh.zone3_share,
  zone4_share_pct = rh.zone4_share,
  -- Calculate dwell time if we have store entries
  avg_store_dwell_time = CASE 
    WHEN ha.store_entries > 0 THEN 
      ROUND((rh.total_occupancy * 5.0 / ha.store_entries), 2) -- 5 min intervals
    ELSE 0 
  END,
  -- Update sample count to include regional samples
  sample_count = GREATEST(ha.sample_count, rh.sample_count),
  updated_at = NOW()
FROM regional_hourly rh
WHERE ha.store_id = rh.store_id
  AND ha.date = rh.date
  AND ha.hour = rh.hour;

-- Check first week results
SELECT 
  'Updated records (week 1):' as step,
  COUNT(*) as records_updated
FROM hourly_analytics
WHERE date >= '2025-07-01' AND date < '2025-07-08'
  AND total_zone_occupancy > 0;

-- Update July 8-14
WITH regional_hourly AS (
  SELECT 
    store_id,
    DATE(timestamp) as date,
    EXTRACT(hour FROM timestamp) as hour,
    SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy,
    MAX(region1_count) as zone1_peak,
    MAX(region2_count) as zone2_peak,
    MAX(region3_count) as zone3_peak,
    MAX(region4_count) as zone4_peak,
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
  WHERE timestamp >= '2025-07-08' AND timestamp < '2025-07-15'
  GROUP BY store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
)
UPDATE hourly_analytics ha
SET 
  total_zone_occupancy = rh.total_occupancy,
  zone1_peak_occupancy = rh.zone1_peak,
  zone2_peak_occupancy = rh.zone2_peak,
  zone3_peak_occupancy = rh.zone3_peak,
  zone4_peak_occupancy = rh.zone4_peak,
  zone1_share_pct = rh.zone1_share,
  zone2_share_pct = rh.zone2_share,
  zone3_share_pct = rh.zone3_share,
  zone4_share_pct = rh.zone4_share,
  avg_store_dwell_time = CASE 
    WHEN ha.store_entries > 0 THEN 
      ROUND((rh.total_occupancy * 5.0 / ha.store_entries), 2)
    ELSE 0 
  END,
  sample_count = GREATEST(ha.sample_count, rh.sample_count),
  updated_at = NOW()
FROM regional_hourly rh
WHERE ha.store_id = rh.store_id
  AND ha.date = rh.date
  AND ha.hour = rh.hour;

-- Update July 15-24
WITH regional_hourly AS (
  SELECT 
    store_id,
    DATE(timestamp) as date,
    EXTRACT(hour FROM timestamp) as hour,
    SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy,
    MAX(region1_count) as zone1_peak,
    MAX(region2_count) as zone2_peak,
    MAX(region3_count) as zone3_peak,
    MAX(region4_count) as zone4_peak,
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
  WHERE timestamp >= '2025-07-15' AND timestamp <= '2025-07-24'
  GROUP BY store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
)
UPDATE hourly_analytics ha
SET 
  total_zone_occupancy = rh.total_occupancy,
  zone1_peak_occupancy = rh.zone1_peak,
  zone2_peak_occupancy = rh.zone2_peak,
  zone3_peak_occupancy = rh.zone3_peak,
  zone4_peak_occupancy = rh.zone4_peak,
  zone1_share_pct = rh.zone1_share,
  zone2_share_pct = rh.zone2_share,
  zone3_share_pct = rh.zone3_share,
  zone4_share_pct = rh.zone4_share,
  avg_store_dwell_time = CASE 
    WHEN ha.store_entries > 0 THEN 
      ROUND((rh.total_occupancy * 5.0 / ha.store_entries), 2)
    ELSE 0 
  END,
  sample_count = GREATEST(ha.sample_count, rh.sample_count),
  updated_at = NOW()
FROM regional_hourly rh
WHERE ha.store_id = rh.store_id
  AND ha.date = rh.date
  AND ha.hour = rh.hour;

-- Final check
SELECT 
  'Final results:' as step;

SELECT 
  COUNT(*) as total_hourly_records,
  COUNT(CASE WHEN total_zone_occupancy > 0 THEN 1 END) as records_with_occupancy,
  SUM(total_zone_occupancy) as total_occupancy_sum,
  ROUND(AVG(CASE WHEN total_zone_occupancy > 0 THEN total_zone_occupancy END), 2) as avg_occupancy_per_hour
FROM hourly_analytics
WHERE date >= '2025-07-01';

-- Sample of updated data
SELECT 
  'Sample updated records:' as step;

SELECT 
  store_id,
  date,
  hour,
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
ORDER BY date DESC, hour DESC
LIMIT 10;

-- Now update daily analytics with regional data
UPDATE daily_analytics da
SET 
  total_zone_occupancy = daily_totals.total_occupancy,
  zone1_share_pct = daily_totals.zone1_share,
  zone2_share_pct = daily_totals.zone2_share,
  zone3_share_pct = daily_totals.zone3_share,
  zone4_share_pct = daily_totals.zone4_share,
  avg_store_dwell_time = daily_totals.avg_dwell,
  zone1_peak_hour = daily_totals.zone1_peak_hour,
  zone2_peak_hour = daily_totals.zone2_peak_hour,
  zone3_peak_hour = daily_totals.zone3_peak_hour,
  zone4_peak_hour = daily_totals.zone4_peak_hour,
  updated_at = NOW()
FROM (
  SELECT 
    store_id,
    date,
    SUM(total_zone_occupancy) as total_occupancy,
    AVG(zone1_share_pct) as zone1_share,
    AVG(zone2_share_pct) as zone2_share,
    AVG(zone3_share_pct) as zone3_share,
    AVG(zone4_share_pct) as zone4_share,
    AVG(CASE WHEN avg_store_dwell_time > 0 THEN avg_store_dwell_time END) as avg_dwell,
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
     ORDER BY zone4_peak_occupancy DESC LIMIT 1) as zone4_peak_hour
  FROM hourly_analytics ha
  WHERE date >= '2025-07-01'
  GROUP BY store_id, date
) daily_totals
WHERE da.store_id = daily_totals.store_id
  AND da.date = daily_totals.date;

SELECT 
  'Daily analytics updated:' as step,
  COUNT(*) as records_updated
FROM daily_analytics
WHERE date >= '2025-07-01'
  AND total_zone_occupancy > 0;