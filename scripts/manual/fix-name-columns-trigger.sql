-- Fix the update_name_columns trigger function
-- The analytics tables don't have sensor_id, so we need to handle that

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
  
  -- Get sensor name (only for raw tables that have sensor_id column)
  IF TG_TABLE_NAME IN ('people_counting_raw', 'regional_counting_raw') THEN
    -- Check if the table actually has a sensor_id column
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND 
       EXISTS (
         SELECT 1 FROM information_schema.columns 
         WHERE table_name = TG_TABLE_NAME 
         AND column_name = 'sensor_id'
         AND table_schema = TG_TABLE_SCHEMA
       ) THEN
      -- Safely check for sensor_id using dynamic SQL
      DECLARE
        sensor_id_val UUID;
      BEGIN
        EXECUTE format('SELECT ($1).sensor_id', TG_TABLE_NAME) USING NEW INTO sensor_id_val;
        
        IF sensor_id_val IS NOT NULL THEN
          SELECT sensor_name INTO NEW.sensor_name
          FROM sensor_metadata
          WHERE id = sensor_id_val;
        END IF;
      EXCEPTION
        WHEN undefined_column THEN
          -- Column doesn't exist, skip
          NULL;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Now run the regional aggregation fix
-- (Continue with the rest of your regional aggregation updates...)