-- List all columns in analytics tables to verify correct column names
-- Run this in Supabase SQL Editor

-- 1. List all columns in hourly_analytics
SELECT 
    '========== HOURLY_ANALYTICS COLUMNS ==========' as section;

SELECT 
    ordinal_position as pos,
    column_name,
    data_type,
    is_nullable,
    column_default IS NOT NULL as has_default
FROM information_schema.columns
WHERE table_name = 'hourly_analytics'
ORDER BY ordinal_position;

-- 2. List all columns in daily_analytics
SELECT 
    '========== DAILY_ANALYTICS COLUMNS ==========' as section;

SELECT 
    ordinal_position as pos,
    column_name,
    data_type,
    is_nullable,
    column_default IS NOT NULL as has_default
FROM information_schema.columns
WHERE table_name = 'daily_analytics'
ORDER BY ordinal_position;

-- 3. Check for any columns that might be in one table but not the other
SELECT 
    '========== COLUMN COMPARISON ==========' as section;

WITH hourly_cols AS (
    SELECT column_name FROM information_schema.columns WHERE table_name = 'hourly_analytics'
),
daily_cols AS (
    SELECT column_name FROM information_schema.columns WHERE table_name = 'daily_analytics'
),
common_cols AS (
    SELECT h.column_name 
    FROM hourly_cols h 
    INNER JOIN daily_cols d ON h.column_name = d.column_name
),
hourly_only AS (
    SELECT column_name FROM hourly_cols 
    WHERE column_name NOT IN (SELECT column_name FROM daily_cols)
),
daily_only AS (
    SELECT column_name FROM daily_cols 
    WHERE column_name NOT IN (SELECT column_name FROM hourly_cols)
)
SELECT 
    'Common' as category,
    COUNT(*) as count,
    STRING_AGG(column_name, ', ' ORDER BY column_name) as columns
FROM common_cols
UNION ALL
SELECT 
    'Hourly Only' as category,
    COUNT(*) as count,
    STRING_AGG(column_name, ', ' ORDER BY column_name) as columns
FROM hourly_only
UNION ALL
SELECT 
    'Daily Only' as category,
    COUNT(*) as count,
    STRING_AGG(column_name, ', ' ORDER BY column_name) as columns
FROM daily_only;

-- 4. Check which columns our aggregation scripts are trying to use
SELECT 
    '========== COLUMNS USED IN SCRIPTS ==========' as section;

-- List of columns we're trying to insert in hourly aggregation
WITH script_columns AS (
    SELECT unnest(ARRAY[
        'store_id', 'organization_id', 'date', 'hour', 
        'start_time', 'end_time',
        'store_entries', 'store_exits', 
        'passerby_count', 'passerby_in', 'passerby_out',
        'capture_rate', 
        'entry_line1_pct', 'entry_line2_pct', 'entry_line3_pct',
        'exit_line1_pct', 'exit_line2_pct', 'exit_line3_pct',
        'sample_count', 'total_entries', 'total_exits',
        'line1_in', 'line1_out', 'line2_in', 'line2_out',
        'line3_in', 'line3_out', 'line4_in', 'line4_out',
        'total_zone_occupancy', 
        'zone1_share_pct', 'zone2_share_pct', 'zone3_share_pct', 'zone4_share_pct',
        'zone1_peak_occupancy', 'zone2_peak_occupancy', 'zone3_peak_occupancy', 'zone4_peak_occupancy',
        'zone1_dwell_contribution', 'zone2_dwell_contribution', 'zone3_dwell_contribution', 'zone4_dwell_contribution',
        'avg_store_dwell_time'
    ]) as column_name
),
actual_columns AS (
    SELECT column_name FROM information_schema.columns WHERE table_name = 'hourly_analytics'
)
SELECT 
    s.column_name,
    CASE WHEN a.column_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM script_columns s
LEFT JOIN actual_columns a ON s.column_name = a.column_name
ORDER BY 
    CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
    s.column_name;