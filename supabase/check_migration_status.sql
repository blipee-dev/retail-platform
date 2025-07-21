-- =====================================================
-- Migration Status Check Script
-- Run this in Supabase SQL Editor to check your status
-- =====================================================

-- 1. Check what tables currently exist
SELECT '=== EXISTING TABLES ===' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check if sensor tables exist (to know if cleanup is needed)
SELECT '=== SENSOR TABLES STATUS ===' as section;
SELECT 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'sensor_metadata') as sensor_metadata_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'people_counting_raw') as people_counting_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'sensors') as old_sensors_table_exists;

-- 3. Check if auth tables exist
SELECT '=== AUTH TABLES STATUS ===' as section;
SELECT 
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') as organizations_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') as user_profiles_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') as stores_exists;

-- 4. Check if enums exist
SELECT '=== ENUM TYPES ===' as section;
SELECT typname 
FROM pg_type 
WHERE typtype = 'e' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 5. Check helper functions
SELECT '=== HELPER FUNCTIONS ===' as section;
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 6. Overall health check
SELECT '=== OVERALL HEALTH CHECK ===' as section;
WITH health_check AS (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_tables,
        EXISTS(SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') as has_enum
)
SELECT 
    CASE 
        WHEN tables >= 15 AND functions >= 5 AND rls_tables >= 10 AND has_enum
        THEN '✅ Database fully configured!'
        WHEN tables > 0 AND tables < 15 
        THEN '⚠️  Partial setup - some migrations may have run'
        WHEN tables = 0 
        THEN '🆕 Fresh database - ready for migrations'
        ELSE '❌ Unknown state - check individual counts'
    END as status,
    tables as total_tables,
    functions as total_functions,
    rls_tables as tables_with_rls,
    has_enum as user_role_enum_exists
FROM health_check;