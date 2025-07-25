-- Direct SQL queries to check for recent inserts in hourly_analytics
-- Run these in Supabase SQL Editor

-- 1. Check total record count
SELECT 
    '========== TOTAL RECORDS ==========' as section;

SELECT COUNT(*) as total_records FROM hourly_analytics;

-- 2. Check records from the last 7 days
SELECT 
    '========== LAST 7 DAYS ==========' as section;

SELECT 
    date,
    COUNT(*) as records_per_day,
    COUNT(DISTINCT store_id) as unique_stores,
    SUM(store_entries) as total_entries,
    SUM(store_exits) as total_exits
FROM hourly_analytics
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- 3. Check most recent records by created_at
SELECT 
    '========== MOST RECENT BY CREATED_AT ==========' as section;

SELECT 
    created_at,
    date,
    hour,
    store_id,
    store_entries,
    store_exits,
    sample_count
FROM hourly_analytics
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check for specific store IDs from the logs
SELECT 
    '========== SPECIFIC STORES FROM LOGS ==========' as section;

-- Check for stores starting with specific IDs
SELECT 
    store_id,
    date,
    hour,
    store_entries,
    store_exits,
    created_at
FROM hourly_analytics
WHERE store_id::text LIKE 'd719cc6b%'
   OR store_id::text LIKE 'dfee65ba%'
ORDER BY created_at DESC
LIMIT 20;

-- 5. Check if RLS is enabled
SELECT 
    '========== RLS STATUS ==========' as section;

SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'hourly_analytics';

-- 6. Check for any records created in the last hour
SELECT 
    '========== RECORDS CREATED IN LAST HOUR ==========' as section;

SELECT 
    created_at,
    date,
    hour,
    store_id,
    store_entries,
    store_exits
FROM hourly_analytics
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 7. Check unique combinations to see data distribution
SELECT 
    '========== DATA DISTRIBUTION ==========' as section;

SELECT 
    date,
    hour,
    COUNT(*) as record_count,
    COUNT(DISTINCT store_id) as stores_with_data
FROM hourly_analytics
WHERE date >= CURRENT_DATE - INTERVAL '3 days'
GROUP BY date, hour
ORDER BY date DESC, hour DESC
LIMIT 72; -- Last 3 days of hours

-- 8. Check for any generated column issues
SELECT 
    '========== GENERATED COLUMNS ==========' as section;

SELECT 
    column_name,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'hourly_analytics'
AND is_generated = 'ALWAYS';

-- 9. Sample of actual data with all key fields
SELECT 
    '========== SAMPLE DATA ==========' as section;

SELECT 
    id,
    store_id,
    organization_id,
    date,
    hour,
    store_entries,
    store_exits,
    net_flow,
    created_at,
    updated_at
FROM hourly_analytics
ORDER BY created_at DESC
LIMIT 5;

-- 10. Check if there are any constraints that might be blocking inserts
SELECT 
    '========== TABLE CONSTRAINTS ==========' as section;

SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'hourly_analytics';