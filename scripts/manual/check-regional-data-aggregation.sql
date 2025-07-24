-- Check why regional counting calculations are zero

-- 1. First, check if we have raw regional data
SELECT 
  'Regional raw data summary:' as check_step;

SELECT 
  COUNT(*) as total_records,
  COUNT(DISTINCT store_id) as stores,
  COUNT(DISTINCT DATE(timestamp)) as days,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest,
  SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01';

-- 2. Check sample of raw regional data
SELECT 
  'Sample regional raw data:' as check_step;

SELECT 
  store_id,
  timestamp,
  region1_count,
  region2_count,
  region3_count,
  region4_count,
  (region1_count + region2_count + region3_count + region4_count) as total_occupancy
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01'
  AND (region1_count > 0 OR region2_count > 0 OR region3_count > 0 OR region4_count > 0)
ORDER BY timestamp DESC
LIMIT 10;

-- 3. Check if hourly_analytics has ANY regional data
SELECT 
  'Hourly analytics regional data:' as check_step;

SELECT 
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE total_zone_occupancy > 0) as records_with_occupancy,
  SUM(total_zone_occupancy) as sum_total_occupancy,
  MAX(total_zone_occupancy) as max_occupancy,
  MAX(zone1_peak_occupancy) as max_zone1,
  MAX(zone2_peak_occupancy) as max_zone2,
  MAX(zone3_peak_occupancy) as max_zone3,
  MAX(zone4_peak_occupancy) as max_zone4
FROM hourly_analytics
WHERE date >= '2025-07-01';

-- 4. Check a specific hour where we know we have regional data
SELECT 
  'Detailed check for specific hours:' as check_step;

WITH raw_hourly AS (
  SELECT 
    store_id,
    DATE(timestamp) as date,
    EXTRACT(hour FROM timestamp) as hour,
    SUM(region1_count) as r1_sum,
    SUM(region2_count) as r2_sum,
    SUM(region3_count) as r3_sum,
    SUM(region4_count) as r4_sum,
    SUM(region1_count + region2_count + region3_count + region4_count) as total_sum,
    COUNT(*) as sample_count
  FROM regional_counting_raw
  WHERE timestamp >= '2025-07-01' 
    AND timestamp < '2025-07-02'
  GROUP BY store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
)
SELECT 
  rh.store_id,
  rh.date,
  rh.hour,
  rh.total_sum as raw_total_occupancy,
  ha.total_zone_occupancy as analytics_occupancy,
  rh.sample_count as raw_samples,
  ha.sample_count as analytics_samples
FROM raw_hourly rh
LEFT JOIN hourly_analytics ha 
  ON rh.store_id = ha.store_id 
  AND rh.date = ha.date 
  AND rh.hour = ha.hour
WHERE rh.total_sum > 0
ORDER BY rh.hour
LIMIT 10;

-- 5. Let's manually calculate what should be there
SELECT 
  'Manual calculation for July 1st:' as check_step;

SELECT 
  store_id,
  DATE(timestamp) as date,
  EXTRACT(hour FROM timestamp) as hour,
  COUNT(*) as intervals,
  SUM(region1_count + region2_count + region3_count + region4_count) as total_occupancy,
  ROUND(AVG(region1_count + region2_count + region3_count + region4_count), 2) as avg_occupancy,
  MAX(region1_count) as zone1_peak,
  MAX(region2_count) as zone2_peak,
  MAX(region3_count) as zone3_peak,
  MAX(region4_count) as zone4_peak
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01' 
  AND timestamp < '2025-07-02'
GROUP BY store_id, DATE(timestamp), EXTRACT(hour FROM timestamp)
ORDER BY hour;

-- 6. Check if the aggregation function was supposed to update regional data
SELECT 
  'Current aggregation approach:' as check_step,
  'The aggregation function creates records with regional metrics set to 0,' as issue,
  'then tries to UPDATE them in a second step' as approach,
  'This UPDATE might be failing or not finding matching records' as possible_cause;