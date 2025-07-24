-- Check the structure of empty tables to understand their purpose

-- data_validation_hourly structure
SELECT 'Table: data_validation_hourly' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'data_validation_hourly'
ORDER BY ordinal_position;

-- latest_sensor_data structure  
SELECT E'\n\nTable: latest_sensor_data' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'latest_sensor_data'
ORDER BY ordinal_position;

-- zone_performance_daily structure
SELECT E'\n\nTable: zone_performance_daily' as table_info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'zone_performance_daily'
ORDER BY ordinal_position;

-- Check if latest_sensor_data might be a materialized view
SELECT E'\n\nChecking if latest_sensor_data is special:' as info;
SELECT 
  c.relname,
  c.relkind,
  CASE c.relkind
    WHEN 'r' THEN 'ordinary table'
    WHEN 'v' THEN 'view'
    WHEN 'm' THEN 'materialized view'
    WHEN 'f' THEN 'foreign table'
  END as type
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relname IN ('latest_sensor_data', 'v_sensor_status', 'data_validation_hourly', 'zone_performance_daily');