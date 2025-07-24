-- Analyze empty tables to determine if they should be kept or dropped

-- Check which tables are truly empty
WITH table_counts AS (
  SELECT 
    'data_validation_hourly' as table_name,
    (SELECT COUNT(*) FROM data_validation_hourly) as row_count
  UNION ALL
  SELECT 
    'latest_sensor_data' as table_name,
    (SELECT COUNT(*) FROM latest_sensor_data) as row_count
  UNION ALL
  SELECT 
    'zone_performance_daily' as table_name,
    (SELECT COUNT(*) FROM zone_performance_daily) as row_count
)
SELECT 
  table_name,
  row_count,
  CASE 
    WHEN row_count = 0 THEN 'Empty'
    ELSE 'Has data'
  END as status
FROM table_counts
ORDER BY table_name;

-- Check if these tables are referenced by other objects
SELECT 'Dependencies check:' as info;

-- Check foreign keys
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND (tc.table_name IN ('data_validation_hourly', 'latest_sensor_data', 'zone_performance_daily')
    OR ccu.table_name IN ('data_validation_hourly', 'latest_sensor_data', 'zone_performance_daily'));

-- Check if v_sensor_status view exists and what it references
SELECT 'View definition for v_sensor_status:' as info;
SELECT definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'v_sensor_status';

-- Analysis and recommendations
SELECT 'ANALYSIS AND RECOMMENDATIONS:' as section;
SELECT 
  'data_validation_hourly' as table_name,
  'KEEP' as recommendation,
  'Future feature for data quality monitoring' as reason
UNION ALL
SELECT 
  'latest_sensor_data' as table_name,
  'CHECK' as recommendation,
  'May be populated by triggers or workflows' as reason
UNION ALL
SELECT 
  'zone_performance_daily' as table_name,
  'CONSIDER DROPPING' as recommendation,
  'Redundant - we have zone metrics in daily_analytics' as reason
UNION ALL
SELECT 
  'v_sensor_status' as table_name,
  'KEEP' as recommendation,
  'Useful view for real-time sensor monitoring' as reason;