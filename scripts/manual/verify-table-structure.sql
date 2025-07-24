-- Verify the table restructure was successful

-- Check if old tables exist (backup tables)
SELECT 
  'Backup tables:' as info,
  table_name 
FROM information_schema.tables 
WHERE table_name IN ('hourly_analytics_old', 'daily_analytics_old')
  AND table_schema = 'public';

-- Check new hourly_analytics structure
SELECT 
  'hourly_analytics columns:' as info;

SELECT 
  ordinal_position,
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check new daily_analytics structure  
SELECT 
  'daily_analytics columns:' as info;

SELECT 
  ordinal_position,
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_analytics' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we have any data
SELECT 
  'Data summary:' as info;

SELECT 
  'hourly_analytics' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT store_id) as stores,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM hourly_analytics
UNION ALL
SELECT 
  'daily_analytics' as table_name,
  COUNT(*) as row_count,
  COUNT(DISTINCT store_id) as stores,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM daily_analytics;

-- Sample a few rows to see the data structure
SELECT 
  'Sample hourly_analytics data:' as info;

SELECT 
  store_id,
  date,
  hour,
  store_entries,
  passerby_count,
  capture_rate,
  total_zone_occupancy,
  avg_store_dwell_time
FROM hourly_analytics
ORDER BY date DESC, hour DESC
LIMIT 5;

-- If the migration was successful, we can drop the old tables
-- DROP TABLE IF EXISTS hourly_analytics_old;
-- DROP TABLE IF EXISTS daily_analytics_old;