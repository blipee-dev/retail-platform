-- Script to delete ALL data from daily_analytics table
-- ⚠️ WARNING: This will delete ALL records - use with caution!
-- Run this in Supabase SQL Editor

-- 1. First, check current data summary
SELECT 
    '========== CURRENT DATA SUMMARY ==========' as section;

SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT date) as unique_dates,
    COUNT(DISTINCT store_id) as unique_stores,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    SUM(total_entries) as total_entries_sum,
    SUM(total_exits) as total_exits_sum
FROM daily_analytics;

-- 2. Show records by date
SELECT 
    '========== RECORDS BY DATE ==========' as section;

SELECT 
    date,
    COUNT(*) as records,
    COUNT(DISTINCT store_id) as stores,
    SUM(total_entries) as daily_entries,
    SUM(total_exits) as daily_exits
FROM daily_analytics
GROUP BY date
ORDER BY date DESC
LIMIT 20;

-- 3. Show sample records that will be deleted
SELECT 
    '========== SAMPLE RECORDS TO BE DELETED ==========' as section;

SELECT 
    date,
    store_name,
    total_entries,
    total_exits,
    peak_hour,
    created_at
FROM daily_analytics
ORDER BY created_at DESC
LIMIT 10;

-- 4. TRUNCATE the table (faster than DELETE for removing all records)
-- ⚠️ UNCOMMENT THE LINE BELOW TO ACTUALLY DELETE ALL DATA
-- TRUNCATE TABLE daily_analytics;

-- Alternative: DELETE all records (keeps auto-increment counter)
-- ⚠️ UNCOMMENT THE LINE BELOW TO ACTUALLY DELETE ALL DATA
-- DELETE FROM daily_analytics;

-- 5. Verify deletion (run after truncating/deleting)
-- SELECT 
--     COUNT(*) as remaining_records
-- FROM daily_analytics;

-- 6. Reset auto-increment if needed (PostgreSQL)
-- ALTER SEQUENCE daily_analytics_id_seq RESTART WITH 1;