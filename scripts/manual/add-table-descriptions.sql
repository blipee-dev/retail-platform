-- Add descriptions to all tables for better documentation
-- This helps developers understand the purpose of each table

-- Core Tables
COMMENT ON TABLE organizations IS 'Multi-tenant organizations that own stores and sensors';
COMMENT ON TABLE stores IS 'Physical store locations with timezone and contact information';
COMMENT ON TABLE user_profiles IS 'User accounts with role-based access control (RBAC)';

-- Sensor Tables
COMMENT ON TABLE sensor_metadata IS 'Configuration and metadata for all sensors (Milesight devices)';
COMMENT ON TABLE sensor_health_log IS 'Historical log of sensor health status changes and issues';
COMMENT ON VIEW latest_sensor_data IS 'Real-time view of the most recent data from each sensor';

-- Raw Data Tables
COMMENT ON TABLE people_counting_raw IS 'Raw people counting data from sensors (entries, exits by line)';
COMMENT ON TABLE regional_counting_raw IS 'Raw regional/zone occupancy data from sensors (4 zones)';

-- Analytics Tables
COMMENT ON TABLE hourly_analytics IS 'Hourly aggregated metrics combining people counting and regional data';
COMMENT ON TABLE daily_analytics IS 'Daily aggregated metrics with peak hours and business hours analysis';

-- Configuration Tables
COMMENT ON TABLE region_configurations IS 'Defines regions/zones within each store for analytics tracking';
COMMENT ON TABLE alerts IS 'Alert configurations and rules for sensor monitoring';

-- Monitoring Tables
COMMENT ON TABLE audit_log IS 'Audit trail for compliance - tracks all data changes';
COMMENT ON TABLE data_validation_hourly IS 'Hourly data quality validation results and metrics';
COMMENT ON TABLE zone_performance_daily IS 'Daily performance metrics by zone (derived from regional data)';

-- Views
COMMENT ON VIEW v_sensor_status IS 'Real-time view of sensor status combining metadata and latest data';

-- Show all tables with their new descriptions
SELECT 
  c.relname AS table_name,
  CASE c.relkind 
    WHEN 'r' THEN 'Table'
    WHEN 'v' THEN 'View'
    ELSE 'Other'
  END AS type,
  obj_description(c.oid) AS description
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind IN ('r', 'v')
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE '_prisma%'
ORDER BY c.relkind DESC, c.relname;