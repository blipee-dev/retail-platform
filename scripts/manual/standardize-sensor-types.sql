-- Standardize all sensors to milesight_sensor type
-- All sensors have the same capabilities: people counting, regional counting, and heatmap

-- First, let's see current sensor types
SELECT 'Current sensor types:' as info;
SELECT DISTINCT sensor_type, COUNT(*) as count
FROM sensor_metadata
GROUP BY sensor_type;

-- Update all sensors to milesight_sensor type
UPDATE sensor_metadata
SET 
  sensor_type = 'milesight_sensor',
  updated_at = NOW()
WHERE sensor_type IN ('omnia', 'milesight_people_counter');

-- Verify the update
SELECT 'After standardization:' as info;
SELECT DISTINCT sensor_type, COUNT(*) as count
FROM sensor_metadata
GROUP BY sensor_type;

-- Show all sensors with their updated type
SELECT 
  sensor_name,
  sensor_type,
  is_active,
  store_id
FROM sensor_metadata
ORDER BY sensor_name;

-- Add a comment about sensor capabilities
COMMENT ON COLUMN sensor_metadata.sensor_type IS 'All sensors are Milesight sensors with people counting, regional counting, and heatmap capabilities';