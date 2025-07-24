-- Check sensor_metadata table
SELECT 
  sensor_id,
  sensor_name,
  sensor_type,
  status,
  is_active,
  store_id,
  last_data_received,
  consecutive_failures
FROM sensor_metadata
ORDER BY sensor_name;

-- Check if sensors have proper store relationships
SELECT 
  sm.sensor_name,
  sm.status,
  sm.store_id,
  s.name as store_name,
  s.organization_id,
  o.name as org_name
FROM sensor_metadata sm
LEFT JOIN stores s ON sm.store_id = s.id
LEFT JOIN organizations o ON s.organization_id = o.id
ORDER BY sm.sensor_name;

-- Check what the workflow query would return
SELECT 
  sm.*,
  s.name as store_name,
  o.name as org_name
FROM sensor_metadata sm
INNER JOIN stores s ON sm.store_id = s.id
INNER JOIN organizations o ON s.organization_id = o.id
WHERE sm.status IN ('online', 'warning')
ORDER BY sm.sensor_name;