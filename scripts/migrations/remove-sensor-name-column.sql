-- Migration to remove sensor_name column from hourly_analytics table
-- Run this in Supabase SQL Editor

-- 1. First check if the column exists
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics' 
AND column_name = 'sensor_name';

-- If the above query returns a row, the column exists and can be dropped

-- 3. Drop the sensor_name column
-- IMPORTANT: This is irreversible! Make sure you have a backup
ALTER TABLE hourly_analytics 
DROP COLUMN IF EXISTS sensor_name;

-- 4. Verify the column was removed
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics' 
AND column_name = 'sensor_name';