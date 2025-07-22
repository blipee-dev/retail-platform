-- Run new migrations to fix database schema
-- Execute this script in Supabase SQL Editor

-- 1. Create daily_analytics table
\echo 'Creating daily_analytics table...'
\i /app/lib/migrations/20250722_create_daily_analytics.sql

-- 2. Create hourly aggregation functions
\echo 'Creating hourly aggregation functions...'
\i /app/lib/migrations/20250722_create_hourly_aggregation.sql

-- 3. Create daily aggregation functions
\echo 'Creating daily aggregation functions...'
\i /app/lib/migrations/20250722_create_daily_aggregation.sql

-- 4. Cleanup duplicate tables
\echo 'Cleaning up duplicate tables...'
\i /app/lib/migrations/20250722_cleanup_duplicate_tables.sql

-- 5. Run initial aggregation to populate tables
\echo 'Running initial aggregation...'
SELECT run_all_aggregations();

-- 6. Show summary
\echo 'Migration complete. Checking results...'
SELECT 
    'people_counting_raw' as table_name,
    COUNT(*) as record_count
FROM people_counting_raw
UNION ALL
SELECT 
    'people_counting_data' as table_name,
    COUNT(*) as record_count
FROM people_counting_data
UNION ALL
SELECT 
    'hourly_analytics' as table_name,
    COUNT(*) as record_count
FROM hourly_analytics
UNION ALL
SELECT 
    'daily_analytics' as table_name,
    COUNT(*) as record_count
FROM daily_analytics
ORDER BY table_name;