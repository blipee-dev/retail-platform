-- List ALL columns in daily_analytics table
-- Run this in Supabase SQL Editor

SELECT 
    ordinal_position as pos,
    column_name,
    data_type,
    is_nullable,
    column_default IS NOT NULL as has_default,
    CASE 
        WHEN column_name LIKE '%_id' THEN 'Foreign Key'
        WHEN column_name LIKE '%_name' THEN 'Lookup/Computed'
        WHEN column_name LIKE '%_at' THEN 'Timestamp'
        WHEN column_name = 'net_flow' THEN 'Generated (entries - exits)'
        WHEN column_name LIKE 'zone%' THEN 'Regional Analytics'
        WHEN column_name LIKE 'line%' THEN 'Line Analytics'
        WHEN column_name LIKE '%capture%' THEN 'Capture Rate Metrics'
        WHEN column_name LIKE '%passerby%' THEN 'Passerby Metrics'
        WHEN column_name LIKE '%dwell%' THEN 'Dwell Time Metrics'
        WHEN column_name LIKE '%business_hours%' THEN 'Business Hours Metrics'
        ELSE 'Core Metric'
    END as category
FROM information_schema.columns
WHERE table_name = 'daily_analytics'
ORDER BY ordinal_position;

-- Count by category
SELECT 
    '========== COLUMNS BY CATEGORY ==========' as section;

SELECT 
    CASE 
        WHEN column_name LIKE '%_id' THEN 'Foreign Key'
        WHEN column_name LIKE '%_name' THEN 'Lookup/Computed'
        WHEN column_name LIKE '%_at' THEN 'Timestamp'
        WHEN column_name = 'net_flow' THEN 'Generated'
        WHEN column_name LIKE 'zone%' THEN 'Regional Analytics'
        WHEN column_name LIKE 'line%' THEN 'Line Analytics'
        WHEN column_name LIKE '%capture%' THEN 'Capture Rate Metrics'
        WHEN column_name LIKE '%passerby%' THEN 'Passerby Metrics'
        WHEN column_name LIKE '%dwell%' THEN 'Dwell Time Metrics'
        WHEN column_name LIKE '%business_hours%' THEN 'Business Hours Metrics'
        ELSE 'Core Metric'
    END as category,
    COUNT(*) as column_count,
    STRING_AGG(column_name, ', ' ORDER BY column_name) as columns
FROM information_schema.columns
WHERE table_name = 'daily_analytics'
GROUP BY 1
ORDER BY 2 DESC;