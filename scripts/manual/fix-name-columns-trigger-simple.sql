-- Fix the update_name_columns trigger function
-- This version properly handles tables with and without sensor_id

CREATE OR REPLACE FUNCTION update_name_columns()
RETURNS TRIGGER AS $$
DECLARE
  v_sensor_id UUID;
  v_sensor_name VARCHAR(255);
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
  
  -- Handle sensor_name only for tables that actually have sensor_id
  BEGIN
    -- Try to get sensor_id from the NEW record
    -- This will fail if the column doesn't exist, which is fine
    IF TG_TABLE_NAME IN ('people_counting_raw', 'regional_counting_raw') THEN
      -- Use dynamic SQL to safely check for sensor_id
      EXECUTE format('SELECT $1.sensor_id', NEW) INTO v_sensor_id;
      
      IF v_sensor_id IS NOT NULL THEN
        SELECT sensor_name INTO v_sensor_name
        FROM sensor_metadata
        WHERE id = v_sensor_id;
        
        -- Set sensor_name if we found it
        NEW.sensor_name := v_sensor_name;
      END IF;
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      -- sensor_id column doesn't exist in this table, that's OK
      NULL;
    WHEN OTHERS THEN
      -- Any other error, just skip sensor name
      NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix worked by checking current triggers
SELECT 
  'Current triggers on analytics tables:' as info;

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('hourly_analytics', 'daily_analytics', 'people_counting_raw', 'regional_counting_raw')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;