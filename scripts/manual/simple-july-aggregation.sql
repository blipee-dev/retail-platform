-- Simple aggregation for July 2025 data
-- This script directly aggregates the raw data we have

-- First, let's check what data we actually have
SELECT 
  'People Counting Raw' as table_name,
  COUNT(*) as records,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM people_counting_raw
WHERE timestamp >= '2025-07-01'
UNION ALL
SELECT 
  'Regional Counting Raw' as table_name,
  COUNT(*) as records,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01';

-- Since we don't have people counting data yet, let's focus on regional data
-- Aggregate regional data into hourly analytics

-- Clear existing July hourly data
DELETE FROM hourly_analytics 
WHERE date >= '2025-07-01' AND date <= '2025-07-24';

-- Insert hourly aggregates from regional data
INSERT INTO hourly_analytics (
  store_id,
  organization_id,
  date,
  hour,
  -- Set people counting to 0 (no data)
  total_entries,
  total_exits,
  store_entries,
  store_exits,
  passerby_count,
  passerby_in,
  passerby_out,
  -- Regional metrics
  total_zone_occupancy,
  zone1_share_pct,
  zone2_share_pct,
  zone3_share_pct,
  zone4_share_pct,
  zone1_peak_occupancy,
  zone2_peak_occupancy,
  zone3_peak_occupancy,
  zone4_peak_occupancy,
  -- Metadata
  sample_count,
  created_at,
  updated_at
)
SELECT 
  r.store_id,
  r.organization_id,
  DATE(r.timestamp) as date,
  EXTRACT(hour FROM r.timestamp) as hour,
  -- People counting (no data)
  0 as total_entries,
  0 as total_exits,
  0 as store_entries,
  0 as store_exits,
  0 as passerby_count,
  0 as passerby_in,
  0 as passerby_out,
  -- Regional aggregates
  SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) as total_zone_occupancy,
  -- Zone share percentages
  CASE WHEN SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) > 0 THEN
    ROUND(SUM(r.region1_count)::DECIMAL / SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) * 100, 2)
  ELSE 0 END as zone1_share_pct,
  CASE WHEN SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) > 0 THEN
    ROUND(SUM(r.region2_count)::DECIMAL / SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) * 100, 2)
  ELSE 0 END as zone2_share_pct,
  CASE WHEN SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) > 0 THEN
    ROUND(SUM(r.region3_count)::DECIMAL / SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) * 100, 2)
  ELSE 0 END as zone3_share_pct,
  CASE WHEN SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) > 0 THEN
    ROUND(SUM(r.region4_count)::DECIMAL / SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) * 100, 2)
  ELSE 0 END as zone4_share_pct,
  -- Peak occupancy per zone
  MAX(r.region1_count) as zone1_peak_occupancy,
  MAX(r.region2_count) as zone2_peak_occupancy,
  MAX(r.region3_count) as zone3_peak_occupancy,
  MAX(r.region4_count) as zone4_peak_occupancy,
  -- Sample count
  COUNT(*) as sample_count,
  NOW() as created_at,
  NOW() as updated_at
FROM regional_counting_raw r
WHERE r.timestamp >= '2025-07-01' 
  AND r.timestamp < '2025-07-25'
GROUP BY 
  r.store_id,
  r.organization_id,
  DATE(r.timestamp),
  EXTRACT(hour FROM r.timestamp);

-- Check results
SELECT 
  COUNT(*) as hourly_records_created,
  COUNT(DISTINCT store_id) as stores,
  COUNT(DISTINCT date) as days,
  MIN(date) as first_date,
  MAX(date) as last_date
FROM hourly_analytics
WHERE date >= '2025-07-01';

-- Now create daily aggregates
DELETE FROM daily_analytics 
WHERE date >= '2025-07-01' AND date <= '2025-07-24';

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
  -- Regional metrics
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
  -- Sum people counting metrics (all 0 for now)
  SUM(total_entries) as total_entries,
  SUM(total_exits) as total_exits,
  SUM(store_entries) as store_entries,
  SUM(store_exits) as store_exits,
  SUM(passerby_count) as passerby_count,
  -- Regional metrics
  SUM(total_zone_occupancy) as total_zone_occupancy,
  AVG(zone1_share_pct) as zone1_share_pct,
  AVG(zone2_share_pct) as zone2_share_pct,
  AVG(zone3_share_pct) as zone3_share_pct,
  AVG(zone4_share_pct) as zone4_share_pct,
  -- Peak hours
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
WHERE date >= '2025-07-01' AND date <= '2025-07-24'
GROUP BY store_id, organization_id, date;

-- Final summary
SELECT 
  'Summary:' as report,
  (SELECT COUNT(*) FROM hourly_analytics WHERE date >= '2025-07-01') as hourly_records,
  (SELECT COUNT(*) FROM daily_analytics WHERE date >= '2025-07-01') as daily_records,
  (SELECT COUNT(DISTINCT store_id) FROM hourly_analytics WHERE date >= '2025-07-01') as stores_processed;