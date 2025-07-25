-- Check daily_analytics table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'daily_analytics'
ORDER BY ordinal_position;

-- Check sample data
SELECT 
    id,
    date,
    start_time,
    end_time,
    store_id,
    total_entries,
    total_exits,
    created_at
FROM daily_analytics
ORDER BY created_at DESC
LIMIT 5;