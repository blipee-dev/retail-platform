-- Migration to remove sensor_name column from hourly_analytics table
-- Run this in Supabase SQL Editor

-- 1. First check if the column exists and see sample data
SELECT 
    COUNT(*) as total_records,
    COUNT(sensor_name) as records_with_sensor_name,
    COUNT(DISTINCT sensor_name) as unique_sensor_names
FROM hourly_analytics;

-- 2. Show sample of sensor_name values (if any)
SELECT DISTINCT sensor_name 
FROM hourly_analytics 
WHERE sensor_name IS NOT NULL 
LIMIT 10;

-- 3. Drop the sensor_name column
-- IMPORTANT: This is irreversible! Make sure you have a backup
ALTER TABLE hourly_analytics 
DROP COLUMN IF EXISTS sensor_name;

-- 4. Verify the column was removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics' 
AND column_name = 'sensor_name';