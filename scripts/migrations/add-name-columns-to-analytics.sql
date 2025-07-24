-- Add name columns to analytics tables for better readability
-- This adds store_name, sensor_name, and organization_name alongside the IDs

-- ================================================
-- Add name columns to hourly_analytics
-- ================================================
ALTER TABLE hourly_analytics
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sensor_name VARCHAR(255);

-- Update existing rows with names from related tables
UPDATE hourly_analytics ha
SET 
  organization_name = o.name,
  store_name = s.name
FROM 
  organizations o,
  stores s
WHERE 
  ha.organization_id = o.id
  AND ha.store_id = s.id
  AND (ha.organization_name IS NULL OR ha.store_name IS NULL);

-- ================================================
-- Add name columns to daily_analytics
-- ================================================
ALTER TABLE daily_analytics
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sensor_name VARCHAR(255);

-- Update existing rows with names
UPDATE daily_analytics da
SET 
  organization_name = o.name,
  store_name = s.name
FROM 
  organizations o,
  stores s
WHERE 
  da.organization_id = o.id
  AND da.store_id = s.id
  AND (da.organization_name IS NULL OR da.store_name IS NULL);

-- ================================================
-- Also add to raw tables for consistency
-- ================================================

-- Add to people_counting_raw
ALTER TABLE people_counting_raw
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sensor_name VARCHAR(255);

-- Update people_counting_raw
UPDATE people_counting_raw pcr
SET 
  organization_name = o.name,
  store_name = s.name,
  sensor_name = sm.sensor_name
FROM 
  organizations o,
  stores s,
  sensor_metadata sm
WHERE 
  pcr.organization_id = o.id
  AND pcr.store_id = s.id
  AND pcr.sensor_id = sm.id
  AND (pcr.organization_name IS NULL OR pcr.store_name IS NULL OR pcr.sensor_name IS NULL);

-- Add to regional_counting_raw
ALTER TABLE regional_counting_raw
ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS store_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sensor_name VARCHAR(255);

-- Update regional_counting_raw
UPDATE regional_counting_raw rcr
SET 
  organization_name = o.name,
  store_name = s.name,
  sensor_name = sm.sensor_name
FROM 
  organizations o,
  stores s,
  sensor_metadata sm
WHERE 
  rcr.organization_id = o.id
  AND rcr.store_id = s.id
  AND rcr.sensor_id = sm.id
  AND (rcr.organization_name IS NULL OR rcr.store_name IS NULL OR rcr.sensor_name IS NULL);

-- ================================================
-- Create triggers to automatically populate names
-- ================================================

-- Function to update names based on IDs
CREATE OR REPLACE FUNCTION update_name_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Get organization name
  IF NEW.organization_id IS NOT NULL THEN
    SELECT name INTO NEW.organization_name
    FROM organizations
    WHERE id = NEW.organization_id;
  END IF;
  
  -- Get store name
  IF NEW.store_id IS NOT NULL THEN
    SELECT name INTO NEW.store_name
    FROM stores
    WHERE id = NEW.store_id;
  END IF;
  
  -- Get sensor name (only for raw tables)
  IF TG_TABLE_NAME IN ('people_counting_raw', 'regional_counting_raw') 
     AND NEW.sensor_id IS NOT NULL THEN
    SELECT sensor_name INTO NEW.sensor_name
    FROM sensor_metadata
    WHERE id = NEW.sensor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS update_hourly_analytics_names ON hourly_analytics;
CREATE TRIGGER update_hourly_analytics_names
BEFORE INSERT OR UPDATE ON hourly_analytics
FOR EACH ROW
EXECUTE FUNCTION update_name_columns();

DROP TRIGGER IF EXISTS update_daily_analytics_names ON daily_analytics;
CREATE TRIGGER update_daily_analytics_names
BEFORE INSERT OR UPDATE ON daily_analytics
FOR EACH ROW
EXECUTE FUNCTION update_name_columns();

DROP TRIGGER IF EXISTS update_people_counting_raw_names ON people_counting_raw;
CREATE TRIGGER update_people_counting_raw_names
BEFORE INSERT OR UPDATE ON people_counting_raw
FOR EACH ROW
EXECUTE FUNCTION update_name_columns();

DROP TRIGGER IF EXISTS update_regional_counting_raw_names ON regional_counting_raw;
CREATE TRIGGER update_regional_counting_raw_names
BEFORE INSERT OR UPDATE ON regional_counting_raw
FOR EACH ROW
EXECUTE FUNCTION update_name_columns();

-- ================================================
-- Create indexes on name columns for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_org_name ON hourly_analytics(organization_name);
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_store_name ON hourly_analytics(store_name);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_org_name ON daily_analytics(organization_name);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_store_name ON daily_analytics(store_name);

CREATE INDEX IF NOT EXISTS idx_people_counting_org_name ON people_counting_raw(organization_name);
CREATE INDEX IF NOT EXISTS idx_people_counting_store_name ON people_counting_raw(store_name);
CREATE INDEX IF NOT EXISTS idx_people_counting_sensor_name ON people_counting_raw(sensor_name);

CREATE INDEX IF NOT EXISTS idx_regional_counting_org_name ON regional_counting_raw(organization_name);
CREATE INDEX IF NOT EXISTS idx_regional_counting_store_name ON regional_counting_raw(store_name);
CREATE INDEX IF NOT EXISTS idx_regional_counting_sensor_name ON regional_counting_raw(sensor_name);

-- ================================================
-- Add comments
-- ================================================
COMMENT ON COLUMN hourly_analytics.organization_name IS 'Human-readable organization name (auto-populated from organization_id)';
COMMENT ON COLUMN hourly_analytics.store_name IS 'Human-readable store name (auto-populated from store_id)';

COMMENT ON COLUMN daily_analytics.organization_name IS 'Human-readable organization name (auto-populated from organization_id)';
COMMENT ON COLUMN daily_analytics.store_name IS 'Human-readable store name (auto-populated from store_id)';

-- ================================================
-- Verify the update
-- ================================================
SELECT 
  'Updated records summary:' as info;

SELECT 
  'hourly_analytics' as table_name,
  COUNT(*) as total_rows,
  COUNT(organization_name) as rows_with_org_name,
  COUNT(store_name) as rows_with_store_name
FROM hourly_analytics
UNION ALL
SELECT 
  'daily_analytics' as table_name,
  COUNT(*) as total_rows,
  COUNT(organization_name) as rows_with_org_name,
  COUNT(store_name) as rows_with_store_name
FROM daily_analytics
UNION ALL
SELECT 
  'regional_counting_raw' as table_name,
  COUNT(*) as total_rows,
  COUNT(organization_name) as rows_with_org_name,
  COUNT(store_name) as rows_with_store_name
FROM regional_counting_raw
WHERE timestamp >= '2025-07-01';

-- Sample data with names
SELECT 
  'Sample data with names:' as info;

SELECT 
  organization_name,
  store_name,
  date,
  hour,
  store_entries,
  passerby_count,
  total_zone_occupancy
FROM hourly_analytics
WHERE date >= '2025-07-01'
ORDER BY date DESC, hour DESC
LIMIT 5;