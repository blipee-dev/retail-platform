-- Script to delete daily analytics data for 2025-07-24
-- Run this in Supabase SQL Editor

-- 1. First, check what data exists for this date
SELECT 
    '========== DATA TO BE DELETED ==========' as section;

SELECT 
    store_id,
    store_name,
    date,
    total_entries,
    total_exits,
    peak_hour,
    created_at
FROM daily_analytics
WHERE date = '2025-07-24'
ORDER BY store_name;

-- 2. Count records that will be deleted
SELECT 
    '========== RECORD COUNT ==========' as section;

SELECT 
    COUNT(*) as records_to_delete,
    COUNT(DISTINCT store_id) as stores_affected
FROM daily_analytics
WHERE date = '2025-07-24';

-- 3. Delete the records for 2025-07-24
-- UNCOMMENT THE LINES BELOW TO ACTUALLY DELETE
-- DELETE FROM daily_analytics
-- WHERE date = '2025-07-24';

-- 4. Verify deletion (run after uncommenting and executing delete)
-- SELECT 
--     COUNT(*) as remaining_records
-- FROM daily_analytics
-- WHERE date = '2025-07-24';