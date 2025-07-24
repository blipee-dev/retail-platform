-- Check all sensor details
SELECT 
  id,
  sensor_name,
  sensor_type,
  data_type,
  api_url,
  is_active,
  store_id
FROM sensor_metadata
ORDER BY sensor_name;

-- Check if we have regional data from any sensor
SELECT 
  'Regional Data Summary' as info,
  COUNT(DISTINCT sensor_id) as unique_sensors,
  COUNT(DISTINCT store_id) as unique_stores,
  MIN(timestamp) as earliest_data,
  MAX(timestamp) as latest_data,
  COUNT(*) as total_records
FROM regional_counting_raw;

-- Check which sensors have regional data
SELECT 
  s.sensor_name,
  s.sensor_type,
  COUNT(r.*) as record_count,
  MIN(r.timestamp) as first_record,
  MAX(r.timestamp) as last_record
FROM sensor_metadata s
LEFT JOIN regional_counting_raw r ON s.id = r.sensor_id
GROUP BY s.id, s.sensor_name, s.sensor_type
ORDER BY s.sensor_name;