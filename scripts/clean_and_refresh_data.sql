-- Clean and Refresh Data Script
-- This will remove all existing data and prepare for fresh collection

-- =====================================================
-- 1. DELETE ALL EXISTING DATA
-- =====================================================

-- Delete from dependent tables first
DELETE FROM daily_analytics;
DELETE FROM hourly_analytics;
DELETE FROM people_counting_data;
DELETE FROM people_counting_raw;
DELETE FROM regional_counting_raw;
DELETE FROM analytics_alerts;

-- Reset any sequences if needed
-- (PostgreSQL auto-manages sequences for UUID primary keys)

-- =====================================================
-- 2. VERIFY SENSORS ARE CONFIGURED
-- =====================================================

-- Check that we have 4 active sensors
SELECT 
    s.sensor_name,
    s.sensor_ip || ':' || s.sensor_port as address,
    st.name as store_name,
    o.name as organization_name
FROM sensor_metadata s
JOIN stores st ON s.store_id = st.id
JOIN organizations o ON s.organization_id = o.id
WHERE s.is_active = true
ORDER BY o.name, st.name;

-- =====================================================
-- 3. SHOW EMPTY STATE
-- =====================================================

SELECT 
    'people_counting_raw' as table_name,
    COUNT(*) as records
FROM people_counting_raw
UNION ALL
SELECT 
    'people_counting_data' as table_name,
    COUNT(*) as records
FROM people_counting_data
UNION ALL
SELECT 
    'hourly_analytics' as table_name,
    COUNT(*) as records
FROM hourly_analytics
UNION ALL
SELECT 
    'daily_analytics' as table_name,
    COUNT(*) as records
FROM daily_analytics
ORDER BY table_name;

-- =====================================================
-- 4. INSTRUCTIONS
-- =====================================================

SELECT 
    'Database cleaned! Next steps:' as message
UNION ALL
SELECT 
    '1. Trigger GitHub Actions manually: https://github.com/blipee-dev/retail-platform/actions'
UNION ALL
SELECT 
    '2. Wait for scheduled runs (every 30 minutes)'
UNION ALL
SELECT 
    '3. Monitor data collection in people_counting_raw table';