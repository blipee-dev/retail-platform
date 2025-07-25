-- Check the actual structure of hourly_analytics table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'hourly_analytics'
ORDER BY ordinal_position;

-- Show sample data if any exists
SELECT * FROM hourly_analytics LIMIT 5;