-- Analyze which empty tables/views can be safely dropped

-- First check what we have
WITH object_info AS (
  SELECT 
    c.relname AS name,
    c.relkind,
    CASE c.relkind 
      WHEN 'r' THEN 'TABLE'
      WHEN 'v' THEN 'VIEW'
      WHEN 'm' THEN 'MATERIALIZED VIEW'
    END AS type,
    pg_size_pretty(pg_total_relation_size(c.oid)) as size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' 
    AND c.relkind IN ('r', 'v', 'm')
    AND c.relname IN ('data_validation_hourly', 'latest_sensor_data', 'zone_performance_daily', 'v_sensor_status')
)
SELECT * FROM object_info ORDER BY name;

-- Check if these views/tables have any data or dependencies
SELECT 'Checking data and dependencies:' as info;

-- For tables, check row count
DO $$
DECLARE
  r RECORD;
  row_count INTEGER;
BEGIN
  FOR r IN (
    SELECT relname 
    FROM pg_class 
    WHERE relkind = 'r' 
      AND relname IN ('data_validation_hourly', 'zone_performance_daily')
      AND relnamespace = 'public'::regnamespace
  )
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', r.relname) INTO row_count;
    RAISE NOTICE '% has % rows', r.relname, row_count;
  END LOOP;
END $$;

-- Check view definitions to understand their purpose
SELECT 'View definitions:' as info;
SELECT 
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('latest_sensor_data', 'v_sensor_status');

-- Check if any functions or triggers reference these objects
SELECT 'Checking for dependencies:' as info;
SELECT DISTINCT
  dep.classid::regclass AS dependent_type,
  dep.objid::regprocedure AS dependent_function
FROM pg_depend dep
JOIN pg_class c ON c.oid = dep.refobjid
WHERE c.relname IN ('data_validation_hourly', 'latest_sensor_data', 'zone_performance_daily', 'v_sensor_status')
  AND dep.deptype = 'n';

-- RECOMMENDATIONS
SELECT 'RECOMMENDATIONS:' as section;
SELECT 
  name,
  recommendation,
  reason
FROM (
  VALUES 
    ('data_validation_hourly', 'KEEP', 'Useful for future data quality monitoring features'),
    ('zone_performance_daily', 'DROP', 'Redundant - zone metrics already in daily_analytics table'),
    ('latest_sensor_data', 'KEEP', 'Useful view for real-time sensor monitoring'),
    ('v_sensor_status', 'KEEP', 'Useful view for sensor health monitoring')
) AS t(name, recommendation, reason)
ORDER BY recommendation DESC, name;

-- Script to drop redundant objects
SELECT 'To drop redundant objects, run:' as action;
SELECT 'DROP TABLE IF EXISTS zone_performance_daily CASCADE;' as command;