-- Check sensor configuration in database
SELECT 
  sensor_id,
  sensor_name,
  sensor_type,
  sensor_ip,
  sensor_port,
  status,
  last_data_received,
  consecutive_failures,
  config->>'api_endpoint' as api_endpoint,
  LENGTH(config->>'auth_token') as auth_token_length
FROM sensor_metadata
WHERE status IN ('online', 'warning')
ORDER BY sensor_name;