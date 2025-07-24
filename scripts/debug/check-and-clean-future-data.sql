-- Check and clean future data in people_counting_raw

-- 1. Check for future timestamps
SELECT 
    COUNT(*) as future_records,
    MIN(timestamp) as earliest_future,
    MAX(timestamp) as latest_future,
    NOW() as current_time
FROM people_counting_raw
WHERE timestamp > NOW();

-- 2. Show sample of future records
SELECT 
    id,
    sensor_id,
    timestamp,
    end_time,
    created_at,
    total_in,
    total_out
FROM people_counting_raw
WHERE timestamp > NOW()
ORDER BY timestamp DESC
LIMIT 10;

-- 3. Check timestamp patterns - are they hourly aligned?
SELECT 
    EXTRACT(MINUTE FROM timestamp) as minute,
    EXTRACT(SECOND FROM timestamp) as second,
    COUNT(*) as record_count
FROM people_counting_raw
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY minute, second
ORDER BY record_count DESC
LIMIT 20;

-- 4. Check end_time patterns
SELECT 
    EXTRACT(MINUTE FROM end_time) as minute,
    EXTRACT(SECOND FROM end_time) as second,
    COUNT(*) as record_count
FROM people_counting_raw
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY minute, second
ORDER BY record_count DESC
LIMIT 20;

-- 5. Delete future records (CAREFUL - this will delete data!)
-- Uncomment to execute:
/*
DELETE FROM people_counting_raw
WHERE timestamp > NOW();
*/

-- 6. Show records with non-hourly boundaries
SELECT 
    id,
    sensor_id,
    timestamp,
    end_time,
    EXTRACT(MINUTE FROM timestamp) as start_minute,
    EXTRACT(SECOND FROM timestamp) as start_second,
    EXTRACT(MINUTE FROM end_time) as end_minute,
    EXTRACT(SECOND FROM end_time) as end_second
FROM people_counting_raw
WHERE (
    EXTRACT(MINUTE FROM timestamp) != 0 OR 
    EXTRACT(SECOND FROM timestamp) != 0 OR
    EXTRACT(MINUTE FROM end_time) != 59 OR
    EXTRACT(SECOND FROM end_time) != 59
)
ORDER BY created_at DESC
LIMIT 20;