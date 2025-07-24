-- Clean and rebuild analytics data with new KPIs
-- This script removes all existing analytics data and prepares for fresh import

-- Step 1: Backup current data (optional - uncomment if needed)
-- CREATE TABLE hourly_analytics_backup AS SELECT * FROM hourly_analytics;
-- CREATE TABLE daily_analytics_backup AS SELECT * FROM daily_analytics;

-- Step 2: Clear analytics tables
TRUNCATE TABLE hourly_analytics CASCADE;
TRUNCATE TABLE daily_analytics CASCADE;

-- Step 3: Clear raw data tables to start fresh
TRUNCATE TABLE people_counting_raw CASCADE;
TRUNCATE TABLE regional_counting_raw CASCADE;

-- Step 4: Reset any sequences if needed
-- ALTER SEQUENCE IF EXISTS hourly_analytics_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS daily_analytics_id_seq RESTART WITH 1;

-- Step 5: Verify tables are empty
SELECT 'people_counting_raw' as table_name, COUNT(*) as record_count FROM people_counting_raw
UNION ALL
SELECT 'regional_counting_raw', COUNT(*) FROM regional_counting_raw
UNION ALL
SELECT 'hourly_analytics', COUNT(*) FROM hourly_analytics
UNION ALL
SELECT 'daily_analytics', COUNT(*) FROM daily_analytics;

-- Step 6: Check that all new columns exist (from our migrations)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics' 
AND column_name IN (
  'store_entries', 'store_exits', 'passerby_count', 'capture_rate',
  'avg_store_dwell_time', 'total_zone_occupancy', 'zone1_share_pct'
)
ORDER BY ordinal_position;

-- Ready for fresh data import!