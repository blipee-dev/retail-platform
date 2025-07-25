-- Check which columns the daily aggregation script expects vs what exists
-- Run this in Supabase SQL Editor

-- List of columns the script is trying to insert
WITH expected_columns AS (
    SELECT unnest(ARRAY[
        'store_id', 'date', 'start_time', 'end_time',
        'store_entries', 'store_exits',
        'passerby_count', 'passerby_in', 'passerby_out',
        'capture_rate',
        'entry_line1_pct', 'entry_line2_pct', 'entry_line3_pct',
        'exit_line1_pct', 'exit_line2_pct', 'exit_line3_pct',
        'peak_entry_hour', 'peak_exit_hour', 'peak_passerby_hour',
        'business_hours_entries', 'after_hours_entries',
        'business_hours_capture_rate',
        'avg_store_dwell_time', 'total_zone_occupancy',
        'zone1_share_pct', 'zone2_share_pct', 'zone3_share_pct', 'zone4_share_pct',
        'zone1_peak_occupancy', 'zone2_peak_occupancy', 'zone3_peak_occupancy', 'zone4_peak_occupancy',
        'zone1_peak_hour',
        'occupancy_accuracy_score', 'conversion_rate',
        'data_quality', 'weather_condition', 'is_holiday',
        'created_at', 'updated_at'
    ]) as column_name
),
actual_columns AS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'daily_analytics'
)
SELECT 
    e.column_name,
    CASE 
        WHEN a.column_name IS NOT NULL THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status,
    CASE 
        WHEN e.column_name IN ('created_at', 'updated_at') THEN 'Usually auto-managed'
        WHEN e.column_name IN ('weather_condition', 'is_holiday', 'conversion_rate') THEN 'Optional/future feature'
        WHEN e.column_name LIKE '%zone%' THEN 'Regional analytics'
        WHEN e.column_name LIKE '%passerby%' THEN 'Passerby analytics'
        ELSE ''
    END as notes
FROM expected_columns e
LEFT JOIN actual_columns a ON e.column_name = a.column_name
ORDER BY 
    CASE WHEN a.column_name IS NULL THEN 0 ELSE 1 END,
    e.column_name;

-- Also show actual columns that exist but aren't being used
SELECT 
    '========== COLUMNS IN TABLE BUT NOT USED ==========' as section;

SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'daily_analytics'
AND column_name NOT IN (
    SELECT unnest(ARRAY[
        'id', 'store_id', 'date', 'start_time', 'end_time',
        'store_entries', 'store_exits',
        'passerby_count', 'passerby_in', 'passerby_out',
        'capture_rate',
        'entry_line1_pct', 'entry_line2_pct', 'entry_line3_pct',
        'exit_line1_pct', 'exit_line2_pct', 'exit_line3_pct',
        'peak_entry_hour', 'peak_exit_hour', 'peak_passerby_hour',
        'business_hours_entries', 'after_hours_entries',
        'business_hours_capture_rate',
        'avg_store_dwell_time', 'total_zone_occupancy',
        'zone1_share_pct', 'zone2_share_pct', 'zone3_share_pct', 'zone4_share_pct',
        'zone1_peak_occupancy', 'zone2_peak_occupancy', 'zone3_peak_occupancy', 'zone4_peak_occupancy',
        'zone1_peak_hour',
        'occupancy_accuracy_score', 'conversion_rate',
        'data_quality', 'weather_condition', 'is_holiday',
        'created_at', 'updated_at', 'organization_id'
    ])
)
ORDER BY column_name;