-- Check specific columns in hourly_analytics table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'hourly_analytics'
AND column_name IN ('start_time', 'end_time', 'sensor_name', 'date', 'hour')
ORDER BY ordinal_position;

-- Check a sample of data to see current values
SELECT 
    id,
    date,
    hour,
    start_time,
    end_time,
    sensor_name,
    store_id,
    created_at
FROM hourly_analytics
ORDER BY created_at DESC
LIMIT 5;