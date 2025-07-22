-- Clean all sensor data to force fresh collection
-- This will allow us to collect the last 24 hours properly

-- Delete in reverse dependency order
DELETE FROM daily_analytics;
DELETE FROM hourly_analytics;
DELETE FROM people_counting_data;
DELETE FROM people_counting_raw;

-- Verify cleanup
SELECT 
    'people_counting_raw' as table_name, 
    COUNT(*) as record_count 
FROM people_counting_raw
UNION ALL
SELECT 
    'people_counting_data' as table_name, 
    COUNT(*) as record_count 
FROM people_counting_data
UNION ALL
SELECT 
    'hourly_analytics' as table_name, 
    COUNT(*) as record_count 
FROM hourly_analytics
UNION ALL
SELECT 
    'daily_analytics' as table_name, 
    COUNT(*) as record_count 
FROM daily_analytics;