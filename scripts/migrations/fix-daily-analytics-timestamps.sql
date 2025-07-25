-- Migration to fix null start_time and end_time values in daily_analytics
-- Run this in Supabase SQL Editor

-- 1. Check how many records have null timestamps
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE start_time IS NULL) as null_start_time,
    COUNT(*) FILTER (WHERE end_time IS NULL) as null_end_time
FROM daily_analytics;

-- 2. Update null start_time and end_time based on date column
-- For daily records, start_time is beginning of day, end_time is end of day
UPDATE daily_analytics
SET 
    start_time = date::timestamp,
    end_time = (date::date + interval '23 hours 59 minutes 59 seconds')::timestamp
WHERE start_time IS NULL OR end_time IS NULL;

-- 3. Verify the update
SELECT 
    date,
    start_time,
    end_time,
    store_id
FROM daily_analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC
LIMIT 10;

-- 4. Check if any nulls remain
SELECT 
    COUNT(*) FILTER (WHERE start_time IS NULL) as remaining_null_start,
    COUNT(*) FILTER (WHERE end_time IS NULL) as remaining_null_end
FROM daily_analytics;