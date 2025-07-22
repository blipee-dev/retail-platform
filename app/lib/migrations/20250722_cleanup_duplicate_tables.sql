-- Cleanup duplicate and unused tables
-- This migration removes redundant tables and consolidates the schema

-- 1. Drop the duplicate 'sensors' table (we use sensor_metadata instead)
DROP TABLE IF EXISTS sensors CASCADE;

-- 2. Drop the 'profiles' table creation attempt (we use user_profiles instead)
-- Note: The table doesn't exist, but remove any references
-- No action needed as it was never created

-- 3. Optionally drop unused regional analytics tables
-- These can be kept if regional analytics will be implemented later
-- For now, we'll comment them out to preserve them

-- Regional analytics tables that have no data and no clear current use:
-- DROP TABLE IF EXISTS regional_counting_raw CASCADE;
-- DROP TABLE IF EXISTS regional_counts CASCADE;
-- DROP TABLE IF EXISTS heatmap_temporal_raw CASCADE;
-- DROP TABLE IF EXISTS vca_alarm_status CASCADE;
-- DROP TABLE IF EXISTS customer_journeys CASCADE;
-- DROP TABLE IF EXISTS queue_analytics CASCADE;
-- DROP TABLE IF EXISTS regional_flow_matrix CASCADE;
-- DROP TABLE IF EXISTS regional_occupancy_snapshots CASCADE;
-- DROP TABLE IF EXISTS region_dwell_times CASCADE;
-- DROP TABLE IF EXISTS region_entrance_exit_events CASCADE;
-- DROP TABLE IF EXISTS region_configurations CASCADE;
-- DROP TABLE IF EXISTS regional_alerts CASCADE;

-- Note: Keeping these tables as they may be used:
-- - regions (needed for regional analytics)
-- - regional_analytics (core regional analytics table)
-- - region_type_templates (has data)

-- 4. Add missing indexes for better performance
-- Check if index exists before creating
CREATE INDEX IF NOT EXISTS idx_people_counting_raw_timestamp 
    ON people_counting_raw(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_people_counting_data_timestamp 
    ON people_counting_data(timestamp DESC);

-- 5. Add comment documentation to important tables
COMMENT ON TABLE people_counting_raw IS 'Raw sensor data collected directly from people counting sensors';
COMMENT ON TABLE people_counting_data IS 'Processed sensor data with calculated totals';
COMMENT ON TABLE hourly_analytics IS 'Aggregated hourly statistics from people counting data';
COMMENT ON TABLE daily_analytics IS 'Aggregated daily statistics from hourly analytics';
COMMENT ON TABLE sensor_metadata IS 'Configuration and metadata for all sensors';
COMMENT ON TABLE user_profiles IS 'User profiles with organization association and roles';

-- 6. Create a view for easy access to latest sensor data
CREATE OR REPLACE VIEW latest_sensor_data AS
SELECT 
    s.sensor_name,
    s.location,
    st.name as store_name,
    o.name as organization_name,
    p.timestamp,
    p.total_in,
    p.total_out,
    p.total_in - p.total_out as net_traffic
FROM people_counting_data p
JOIN sensor_metadata s ON p.sensor_id = s.id
JOIN stores st ON p.store_id = st.id
JOIN organizations o ON p.organization_id = o.id
WHERE p.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY p.timestamp DESC;

-- Grant access to the view
GRANT SELECT ON latest_sensor_data TO authenticated;