-- Check and remove future data from people_counting_raw
-- Run this in Supabase SQL editor

-- 1. First, check how much future data exists
SELECT 
    COUNT(*) as future_records,
    MIN(timestamp) as earliest_future,
    MAX(timestamp) as latest_future,
    COUNT(DISTINCT DATE(timestamp)) as days_affected
FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP;

-- 2. Show sample of future data by sensor
SELECT 
    s.sensor_name,
    s.sensor_id,
    COUNT(*) as future_records,
    MIN(p.timestamp) as earliest_future,
    MAX(p.timestamp) as latest_future
FROM people_counting_raw p
JOIN sensor_metadata s ON s.id = p.sensor_id
WHERE p.timestamp > CURRENT_TIMESTAMP
GROUP BY s.sensor_name, s.sensor_id
ORDER BY COUNT(*) DESC;

-- 3. Show hourly distribution of future data
SELECT 
    DATE_TRUNC('hour', timestamp) as hour,
    COUNT(*) as records,
    SUM(total_in) as total_in,
    SUM(total_out) as total_out
FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour
LIMIT 20;

-- 4. DELETE FUTURE DATA (uncomment to execute)
-- WARNING: This will permanently delete all records with timestamps in the future
/*
DELETE FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP;
*/

-- 5. After deletion, verify no future data remains
/*
SELECT COUNT(*) as remaining_future_records
FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP;
*/