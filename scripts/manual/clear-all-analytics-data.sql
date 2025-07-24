-- Clear all data from analytics tables
-- WARNING: This will delete ALL data, not just July data

-- Get counts before deletion
SELECT 'Before Deletion Counts:' as status;

SELECT 
  'regional_counting_raw' as table_name,
  COUNT(*) as record_count,
  MIN(timestamp) as earliest_record,
  MAX(timestamp) as latest_record
FROM regional_counting_raw;

SELECT 
  'hourly_analytics' as table_name,
  COUNT(*) as record_count,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM hourly_analytics;

SELECT 
  'daily_analytics' as table_name,
  COUNT(*) as record_count,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM daily_analytics;

-- Clear all data
DELETE FROM regional_counting_raw;
DELETE FROM hourly_analytics;
DELETE FROM daily_analytics;

-- Verify deletion
SELECT 'After Deletion Counts:' as status;

SELECT 
  'regional_counting_raw' as table_name,
  COUNT(*) as record_count
FROM regional_counting_raw;

SELECT 
  'hourly_analytics' as table_name,
  COUNT(*) as record_count
FROM hourly_analytics;

SELECT 
  'daily_analytics' as table_name,
  COUNT(*) as record_count
FROM daily_analytics;

-- Reset any sequences if needed
-- Note: UUID primary keys don't need sequence resets

SELECT 'All analytics data has been cleared!' as status;