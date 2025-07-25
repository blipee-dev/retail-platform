-- Comprehensive RLS Policy Audit for all roles

-- 1. Show all existing RLS policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    substring(qual, 1, 100) as policy_condition_preview
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Check which tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'organizations', 'stores', 'user_profiles', 'sensor_metadata',
    'people_counting_raw', 'regional_counting_raw', 
    'hourly_analytics', 'daily_analytics', 'alerts', 
    'region_configurations', 'latest_sensor_data'
)
ORDER BY tablename;

-- 3. Detailed check for each role's access

-- For tenant_admin (should access their organization only)
SELECT 'tenant_admin access check' as check_type, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%tenant_admin%' OR policyname LIKE '%tenant_admin%');

-- For store_manager (should access their stores only)
SELECT 'store_manager access check' as check_type, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%store_manager%' OR policyname LIKE '%store_manager%');

-- For viewer role
SELECT 'viewer access check' as check_type, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%viewer%' OR policyname LIKE '%viewer%');

-- 4. Check if critical tables are missing policies
WITH important_tables AS (
    SELECT unnest(ARRAY[
        'organizations', 'stores', 'user_profiles', 
        'sensor_metadata', 'people_counting_raw', 
        'hourly_analytics', 'daily_analytics'
    ]) as tablename
),
tables_with_policies AS (
    SELECT DISTINCT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
)
SELECT 
    it.tablename,
    CASE 
        WHEN twp.tablename IS NULL THEN '❌ NO POLICIES'
        ELSE '✅ Has policies'
    END as policy_status
FROM important_tables it
LEFT JOIN tables_with_policies twp ON it.tablename = twp.tablename
ORDER BY 
    CASE WHEN twp.tablename IS NULL THEN 0 ELSE 1 END,
    it.tablename;

-- 5. Generate missing RLS policies template
SELECT '-- Add this policy for ' || tablename || ' table' as missing_policy_template
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false
AND tablename IN (
    'organizations', 'stores', 'user_profiles', 'sensor_metadata',
    'people_counting_raw', 'hourly_analytics', 'daily_analytics'
);