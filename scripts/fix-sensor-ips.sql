-- Fix sensor IPs in the database
-- Run this in Supabase SQL Editor

-- IMPORTANT: Update these values based on your actual sensor configurations
-- These are example values - replace with your actual sensor IPs and ports

-- First, let's see what we currently have
SELECT sensor_id, sensor_name, host 
FROM sensor_metadata 
WHERE is_active = true
ORDER BY sensor_name;

-- Check which sensors have private IPs that need updating
SELECT sensor_id, sensor_name, host 
FROM sensor_metadata 
WHERE host LIKE '10.%' OR host LIKE '192.168.%' OR host LIKE '172.16.%'
   OR host IN ('10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4');

-- Update the IPs manually through Supabase dashboard or use environment-specific configuration
-- Example update (customize based on your sensors):
/*
UPDATE sensor_metadata 
SET host = 'YOUR_ACTUAL_SENSOR_IP:PORT'
WHERE sensor_id = 'YOUR_SENSOR_ID';
*/

-- After updates, verify the changes
SELECT sensor_id, sensor_name, host 
FROM sensor_metadata 
WHERE is_active = true
ORDER BY sensor_name;