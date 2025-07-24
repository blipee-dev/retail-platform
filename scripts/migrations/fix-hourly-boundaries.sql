-- Fix hourly boundaries and remove future data

-- 1. First, let's see what we're dealing with
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN timestamp > NOW() THEN 1 END) as future_records,
    COUNT(CASE WHEN EXTRACT(MINUTE FROM timestamp) != 0 OR EXTRACT(SECOND FROM timestamp) != 0 THEN 1 END) as non_hour_start,
    COUNT(CASE WHEN EXTRACT(MINUTE FROM end_time) != 59 OR EXTRACT(SECOND FROM end_time) != 59 THEN 1 END) as non_hour_end
FROM people_counting_raw;

-- 2. Show sample of problematic records
SELECT 
    id,
    sensor_id,
    timestamp,
    end_time,
    created_at,
    CASE 
        WHEN timestamp > NOW() THEN 'FUTURE'
        WHEN EXTRACT(MINUTE FROM timestamp) != 0 OR EXTRACT(SECOND FROM timestamp) != 0 THEN 'BAD_START'
        WHEN EXTRACT(MINUTE FROM end_time) != 59 OR EXTRACT(SECOND FROM end_time) != 59 THEN 'BAD_END'
        ELSE 'OK'
    END as issue
FROM people_counting_raw
WHERE timestamp > NOW() 
   OR EXTRACT(MINUTE FROM timestamp) != 0 
   OR EXTRACT(SECOND FROM timestamp) != 0
   OR EXTRACT(MINUTE FROM end_time) != 59 
   OR EXTRACT(SECOND FROM end_time) != 59
ORDER BY created_at DESC
LIMIT 20;

-- 3. Fix hourly boundaries for existing records
-- This will normalize all timestamps to proper hourly boundaries
UPDATE people_counting_raw
SET 
    timestamp = date_trunc('hour', timestamp),
    end_time = date_trunc('hour', end_time) + interval '59 minutes 59 seconds'
WHERE EXTRACT(MINUTE FROM timestamp) != 0 
   OR EXTRACT(SECOND FROM timestamp) != 0
   OR EXTRACT(MINUTE FROM end_time) != 59 
   OR EXTRACT(SECOND FROM end_time) != 59;

-- 4. Delete future records
DELETE FROM people_counting_raw
WHERE timestamp > NOW();

-- 5. Verify the fixes
SELECT 
    COUNT(*) as total_after_fix,
    COUNT(CASE WHEN timestamp > NOW() THEN 1 END) as future_records_after,
    COUNT(CASE WHEN EXTRACT(MINUTE FROM timestamp) != 0 OR EXTRACT(SECOND FROM timestamp) != 0 THEN 1 END) as non_hour_start_after,
    COUNT(CASE WHEN EXTRACT(MINUTE FROM end_time) != 59 OR EXTRACT(SECOND FROM end_time) != 59 THEN 1 END) as non_hour_end_after
FROM people_counting_raw;

-- 6. Show a few records after the fix to confirm
SELECT 
    id,
    timestamp,
    end_time,
    total_in,
    total_out,
    created_at
FROM people_counting_raw
ORDER BY created_at DESC
LIMIT 10;