-- Check table structures and aggregate July data accordingly
-- This script adapts to whatever columns actually exist

-- First, let's see what columns we actually have
SELECT 
  'hourly_analytics columns:' as info;
  
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
  'daily_analytics columns:' as info;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'daily_analytics' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check what raw data we have
SELECT 
  'Raw data summary:' as info;

SELECT 
  'people_counting_raw' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT store_id) as stores,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM people_counting_raw
WHERE timestamp >= '2025-07-01'
UNION ALL
SELECT 
  'regional_counting_raw' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT store_id) as stores,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01';

-- Since we only have regional data, let's do a simple aggregation
-- that works with existing table structure

-- Get a sample sensor_id for each store (if needed)
WITH store_sensors AS (
  SELECT DISTINCT ON (store_id) 
    store_id,
    sensor_id,
    organization_id
  FROM regional_counting_raw
  WHERE timestamp >= '2025-07-01'
  ORDER BY store_id, timestamp DESC
)
SELECT 
  'Stores with sensor mapping:' as info,
  COUNT(*) as count
FROM store_sensors;

-- Simple hourly aggregation for regional data only
-- Adapt this based on what columns actually exist
DO $$
DECLARE
  has_sensor_id BOOLEAN;
  has_hour_start BOOLEAN;
  insert_query TEXT;
BEGIN
  -- Check if sensor_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hourly_analytics' 
    AND column_name = 'sensor_id'
  ) INTO has_sensor_id;
  
  -- Check if hour_start column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hourly_analytics' 
    AND column_name = 'hour_start'
  ) INTO has_hour_start;
  
  RAISE NOTICE 'Table has sensor_id: %, has hour_start: %', has_sensor_id, has_hour_start;
  
  -- Build dynamic insert based on actual columns
  insert_query := 'INSERT INTO hourly_analytics (
    store_id,
    organization_id,';
    
  IF has_sensor_id THEN
    insert_query := insert_query || 'sensor_id,';
  END IF;
  
  IF has_hour_start THEN
    insert_query := insert_query || 'hour_start,';
  ELSE
    insert_query := insert_query || 'date, hour,';
  END IF;
  
  insert_query := insert_query || '
    total_zone_occupancy,
    created_at,
    updated_at
  )
  SELECT 
    r.store_id,
    r.organization_id,';
    
  IF has_sensor_id THEN
    insert_query := insert_query || 'MIN(r.sensor_id) as sensor_id,';
  END IF;
  
  IF has_hour_start THEN
    insert_query := insert_query || 'date_trunc(''hour'', r.timestamp) as hour_start,';
  ELSE
    insert_query := insert_query || 'DATE(r.timestamp) as date,
    EXTRACT(hour FROM r.timestamp) as hour,';
  END IF;
  
  insert_query := insert_query || '
    SUM(r.region1_count + r.region2_count + r.region3_count + r.region4_count) as total_zone_occupancy,
    NOW() as created_at,
    NOW() as updated_at
  FROM regional_counting_raw r
  WHERE r.timestamp >= ''2025-07-01'' 
    AND r.timestamp < ''2025-07-25''
  GROUP BY 
    r.store_id,
    r.organization_id,';
    
  IF has_hour_start THEN
    insert_query := insert_query || 'date_trunc(''hour'', r.timestamp)';
  ELSE  
    insert_query := insert_query || 'DATE(r.timestamp),
    EXTRACT(hour FROM r.timestamp)';
  END IF;
  
  -- Clear existing July data first
  IF has_hour_start THEN
    DELETE FROM hourly_analytics WHERE hour_start >= '2025-07-01' AND hour_start < '2025-07-25';
  ELSE
    DELETE FROM hourly_analytics WHERE date >= '2025-07-01' AND date < '2025-07-25';
  END IF;
  
  -- Execute the dynamic insert
  EXECUTE insert_query;
  
  RAISE NOTICE 'Hourly aggregation complete';
END $$;

-- Check results
SELECT 
  'Hourly analytics created:' as info,
  COUNT(*) as records,
  COUNT(DISTINCT store_id) as stores
FROM hourly_analytics
WHERE (date >= '2025-07-01' AND date < '2025-07-25')
   OR (hour_start >= '2025-07-01' AND hour_start < '2025-07-25');