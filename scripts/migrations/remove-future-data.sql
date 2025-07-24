-- Check and remove future data from people_counting_raw
-- Run this in Supabase SQL editor

-- 1. First, check how much future data exists (from next hour onwards)
-- Note: DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour' gives us the start of the next hour
SELECT 
    COUNT(*) as future_records,
    MIN(timestamp) as earliest_future,
    MAX(timestamp) as latest_future,
    COUNT(DISTINCT DATE(timestamp)) as days_affected
FROM people_counting_raw
WHERE timestamp >= DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour';

-- 2. Show sample of future data by sensor
SELECT 
    s.sensor_name,
    s.sensor_id,
    COUNT(*) as future_records,
    MIN(p.timestamp) as earliest_future,
    MAX(p.timestamp) as latest_future
FROM people_counting_raw p
JOIN sensor_metadata s ON s.id = p.sensor_id
WHERE p.timestamp >= DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour'
GROUP BY s.sensor_name, s.sensor_id
ORDER BY COUNT(*) DESC;

-- 3. Show hourly distribution of future data
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as records,
    SUM(total_in) as total_in,
    SUM(total_out) as total_out
FROM people_counting_raw
WHERE timestamp >= DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour'
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour
LIMIT 20;

-- 4. Show what will be kept vs deleted
SELECT 
    CASE 
        WHEN timestamp < DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour' 
        THEN 'KEEP (current hour or past)' 
        ELSE 'DELETE (future hours)' 
    END as action,
    COUNT(*) as records,
    MIN(timestamp) as earliest,
    MAX(timestamp) as latest
FROM people_counting_raw
WHERE timestamp >= DATE_TRUNC('hour', CURRENT_TIMESTAMP)
GROUP BY 1
ORDER BY 1;

-- 5. DELETE FUTURE DATA (uncomment to execute)
-- WARNING: This will permanently delete all records from NEXT HOUR onwards
-- Current hour data is preserved
/*
DELETE FROM people_counting_raw
WHERE timestamp >= DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour';
*/

-- 6. After deletion, verify no future data remains
/*
SELECT COUNT(*) as remaining_future_records
FROM people_counting_raw
WHERE timestamp >= DATE_TRUNC('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour';
*/