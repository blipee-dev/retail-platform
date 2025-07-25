-- Comprehensive schema check for analytics tables
-- Run this in Supabase SQL Editor to see exact table structure

-- 1. List all analytics-related tables
SELECT 
    '========== ALL ANALYTICS TABLES ==========' as section;

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name LIKE '%analytics%' 
    OR table_name LIKE '%counting%'
    OR table_name LIKE '%sensor%'
    OR table_name LIKE '%store%'
)
ORDER BY table_name;

-- 2. Detailed column information for hourly_analytics
SELECT 
    '========== HOURLY_ANALYTICS COLUMNS ==========' as section;

SELECT 
    ordinal_position as pos,
    column_name,
    data_type,
    CASE 
        WHEN character_maximum_length IS NOT NULL 
        THEN data_type || '(' || character_maximum_length || ')'
        ELSE data_type
    END as full_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'hourly_analytics'
ORDER BY ordinal_position;

-- 3. Check which columns the aggregation script expects vs what exists
SELECT 
    '========== COLUMN COMPARISON ==========' as section;

WITH expected_columns AS (
    SELECT unnest(ARRAY[
        'store_id',
        'organization_id',
        'date',
        'hour',
        'store_entries',
        'store_exits',
        'passerby_count',
        'passerby_in',
        'passerby_out',
        'capture_rate',
        'entry_line1_pct',
        'entry_line2_pct',
        'entry_line3_pct',
        'exit_line1_pct',
        'exit_line2_pct',
        'exit_line3_pct',
        'sample_count',
        'avg_occupancy',
        'peak_occupancy',
        'line1_in',
        'line1_out',
        'line2_in',
        'line2_out',
        'line3_in',
        'line3_out',
        'line4_in',
        'line4_out',
        'total_zone_occupancy',
        'zone1_share_pct',
        'zone2_share_pct',
        'zone3_share_pct',
        'zone4_share_pct',
        'zone1_peak_occupancy',
        'zone2_peak_occupancy',
        'zone3_peak_occupancy',
        'zone4_peak_occupancy',
        'zone1_dwell_contribution',
        'zone2_dwell_contribution',
        'zone3_dwell_contribution',
        'zone4_dwell_contribution',
        'avg_store_dwell_time',
        'occupancy_accuracy_score'
    ]) as column_name
),
actual_columns AS (
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'hourly_analytics'
)
SELECT 
    e.column_name,
    CASE 
        WHEN a.column_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    CASE 
        WHEN e.column_name IN ('avg_occupancy', 'peak_occupancy', 'occupancy_accuracy_score') 
        THEN 'Known to cause errors'
        ELSE ''
    END as notes
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
ORDER BY 
    CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
    e.column_name;

-- 4. Show actual columns that exist but script doesn't use
SELECT 
    '========== UNUSED COLUMNS IN TABLE ==========' as section;

WITH expected_columns AS (
    SELECT unnest(ARRAY[
        'store_id',
        'organization_id',
        'date',
        'hour',
        'store_entries',
        'store_exits',
        'passerby_count',
        'passerby_in',
        'passerby_out',
        'capture_rate',
        'entry_line1_pct',
        'entry_line2_pct',
        'entry_line3_pct',
        'exit_line1_pct',
        'exit_line2_pct',
        'exit_line3_pct',
        'sample_count',
        'avg_occupancy',
        'peak_occupancy',
        'line1_in',
        'line1_out',
        'line2_in',
        'line2_out',
        'line3_in',
        'line3_out',
        'line4_in',
        'line4_out'
    ]) as column_name
)
SELECT 
    c.column_name,
    c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public' 
AND c.table_name = 'hourly_analytics'
AND c.column_name NOT IN (SELECT column_name FROM expected_columns)
ORDER BY c.ordinal_position;

-- 5. Recent data sample
SELECT 
    '========== RECENT DATA SAMPLE ==========' as section;

SELECT * FROM hourly_analytics 
ORDER BY date DESC, hour DESC 
LIMIT 2;