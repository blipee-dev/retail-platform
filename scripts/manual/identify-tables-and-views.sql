-- First, identify what's a table vs view
SELECT 
  c.relname AS name,
  CASE c.relkind 
    WHEN 'r' THEN 'TABLE'
    WHEN 'v' THEN 'VIEW'
    WHEN 'm' THEN 'MATERIALIZED VIEW'
  END AS type,
  pg_size_pretty(pg_total_relation_size(c.oid)) as size,
  obj_description(c.oid) AS current_description
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind IN ('r', 'v', 'm')
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE '_prisma%'
ORDER BY c.relkind DESC, c.relname;

-- Now add descriptions based on type
-- Tables
COMMENT ON TABLE organizations IS 'Multi-tenant organizations that own stores and sensors';
COMMENT ON TABLE stores IS 'Physical store locations with timezone and contact information';
COMMENT ON TABLE user_profiles IS 'User accounts with role-based access control (RBAC)';
COMMENT ON TABLE sensor_metadata IS 'Configuration and metadata for all sensors (Milesight devices)';
COMMENT ON TABLE sensor_health_log IS 'Historical log of sensor health status changes and issues';
COMMENT ON TABLE people_counting_raw IS 'Raw people counting data from sensors (entries, exits by line)';
COMMENT ON TABLE regional_counting_raw IS 'Raw regional/zone occupancy data from sensors (4 zones)';
COMMENT ON TABLE hourly_analytics IS 'Hourly aggregated metrics combining people counting and regional data';
COMMENT ON TABLE daily_analytics IS 'Daily aggregated metrics with peak hours and business hours analysis';
COMMENT ON TABLE region_configurations IS 'Defines regions/zones within each store for analytics tracking';
COMMENT ON TABLE alerts IS 'Alert configurations and rules for sensor monitoring';
COMMENT ON TABLE audit_log IS 'Audit trail for compliance - tracks all data changes';

-- Handle potential tables/views that might be empty
DO $$
BEGIN
  -- Check if these are tables or views and comment appropriately
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'data_validation_hourly' AND relkind = 'r') THEN
    EXECUTE 'COMMENT ON TABLE data_validation_hourly IS ''Hourly data quality validation results and metrics''';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'data_validation_hourly' AND relkind = 'v') THEN
    EXECUTE 'COMMENT ON VIEW data_validation_hourly IS ''Hourly data quality validation results and metrics''';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'zone_performance_daily' AND relkind = 'r') THEN
    EXECUTE 'COMMENT ON TABLE zone_performance_daily IS ''Daily performance metrics by zone (derived from regional data)''';
  ELSIF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'zone_performance_daily' AND relkind = 'v') THEN
    EXECUTE 'COMMENT ON VIEW zone_performance_daily IS ''Daily performance metrics by zone (derived from regional data)''';
  END IF;
END $$;

-- Views
COMMENT ON VIEW v_sensor_status IS 'Real-time view of sensor status combining metadata and latest data';
COMMENT ON VIEW latest_sensor_data IS 'Real-time view of the most recent data from each sensor';

-- Show results
SELECT 'Objects with descriptions added:' as status;
SELECT 
  c.relname AS name,
  CASE c.relkind 
    WHEN 'r' THEN 'TABLE'
    WHEN 'v' THEN 'VIEW'
    WHEN 'm' THEN 'MATERIALIZED VIEW'
  END AS type,
  obj_description(c.oid) AS description
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind IN ('r', 'v', 'm')
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE '_prisma%'
ORDER BY c.relkind DESC, c.relname;