-- Update Omnia sensors to correct sensor type
-- OML sensors are Omnia sensors that support regional counting

UPDATE sensor_metadata
SET sensor_type = 'omnia'
WHERE sensor_id IN ('OML01-SENSOR-001', 'OML02-SENSOR-001', 'OML03-SENSOR-001');

-- Verify the update
SELECT sensor_id, sensor_name, sensor_type, is_active 
FROM sensor_metadata 
ORDER BY sensor_name;