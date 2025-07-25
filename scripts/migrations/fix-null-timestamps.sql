-- Migration to fix null start_time and end_time values in hourly_analytics
-- Run this in Supabase SQL Editor

-- 1. Check how many records have null timestamps
SELECT 
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE start_time IS NULL) as null_start_time,
    COUNT(*) FILTER (WHERE end_time IS NULL) as null_end_time
FROM hourly_analytics;

-- 2. Update null start_time and end_time based on date and hour columns
-- This assumes UTC timezone for the constructed timestamps
UPDATE hourly_analytics
SET 
    start_time = (date::date + (hour || ' hours')::interval)::timestamp,
    end_time = (date::date + (hour || ' hours')::interval + interval '59 minutes 59 seconds')::timestamp
WHERE start_time IS NULL OR end_time IS NULL;

-- 3. Verify the update
SELECT 
    date,
    hour,
    start_time,
    end_time,
    store_id
FROM hourly_analytics
WHERE date >= CURRENT_DATE - INTERVAL '3 days'
ORDER BY date DESC, hour DESC
LIMIT 10;

-- 4. Check if any nulls remain
SELECT 
    COUNT(*) FILTER (WHERE start_time IS NULL) as remaining_null_start,
    COUNT(*) FILTER (WHERE end_time IS NULL) as remaining_null_end
FROM hourly_analytics;