-- Check if sensor_health_log table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sensor_health_log'
ORDER BY ordinal_position;

-- If it doesn't exist, here's a create statement
-- CREATE TABLE IF NOT EXISTS sensor_health_log (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     sensor_id TEXT NOT NULL,
--     status TEXT NOT NULL,
--     response_time_ms INTEGER,
--     checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     error_message TEXT,
--     FOREIGN KEY (sensor_id) REFERENCES sensor_metadata(sensor_id)
-- );