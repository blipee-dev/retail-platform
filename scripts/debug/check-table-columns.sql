-- Check all columns in hourly_analytics table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'hourly_analytics'
ORDER BY ordinal_position;

-- Check all columns in daily_analytics table
SELECT 
    '------- DAILY_ANALYTICS TABLE -------' as separator;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'daily_analytics'
ORDER BY ordinal_position;

-- Check all columns in people_counting_raw table
SELECT 
    '------- PEOPLE_COUNTING_RAW TABLE -------' as separator;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'people_counting_raw'
ORDER BY ordinal_position;

-- Check all columns in regional_counting_raw table
SELECT 
    '------- REGIONAL_COUNTING_RAW TABLE -------' as separator;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'regional_counting_raw'
ORDER BY ordinal_position;

-- Show primary keys and constraints for hourly_analytics
SELECT 
    '------- HOURLY_ANALYTICS CONSTRAINTS -------' as separator;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'hourly_analytics'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- Check indexes on hourly_analytics
SELECT 
    '------- HOURLY_ANALYTICS INDEXES -------' as separator;

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'hourly_analytics';

-- Sample data from hourly_analytics to see actual structure
SELECT 
    '------- SAMPLE DATA FROM HOURLY_ANALYTICS -------' as separator;

SELECT * FROM hourly_analytics 
ORDER BY date DESC, hour DESC 
LIMIT 3;

-- Count records in each table
SELECT 
    '------- TABLE RECORD COUNTS -------' as separator;

SELECT 
    'hourly_analytics' as table_name,
    COUNT(*) as record_count
FROM hourly_analytics
UNION ALL
SELECT 
    'daily_analytics' as table_name,
    COUNT(*) as record_count
FROM daily_analytics
UNION ALL
SELECT 
    'people_counting_raw' as table_name,
    COUNT(*) as record_count
FROM people_counting_raw
WHERE timestamp > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'regional_counting_raw' as table_name,
    COUNT(*) as record_count
FROM regional_counting_raw
WHERE timestamp > NOW() - INTERVAL '24 hours';