-- Simple query to list columns in hourly_analytics table
-- Run this in Supabase SQL Editor

SELECT 
    column_name as "Column Name",
    data_type as "Data Type",
    is_nullable as "Nullable?"
FROM information_schema.columns
WHERE table_name = 'hourly_analytics'
ORDER BY ordinal_position;