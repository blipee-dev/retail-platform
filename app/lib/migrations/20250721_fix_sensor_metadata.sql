-- Fix Sensor Metadata Table
-- This migration adds missing columns to the existing sensor_metadata table

-- Add store_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='store_id') THEN
        ALTER TABLE sensor_metadata ADD COLUMN store_id UUID;
        
        -- If stores table exists, add the foreign key
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name='stores') THEN
            ALTER TABLE sensor_metadata 
            ADD CONSTRAINT sensor_metadata_store_id_fkey 
            FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Add organization_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='organization_id') THEN
        ALTER TABLE sensor_metadata ADD COLUMN organization_id UUID;
        
        -- If organizations table exists, add the foreign key
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_name='organizations') THEN
            ALTER TABLE sensor_metadata 
            ADD CONSTRAINT sensor_metadata_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Add other potentially missing columns
DO $$ 
BEGIN
    -- sensor_id column (external ID)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='sensor_id') THEN
        ALTER TABLE sensor_metadata ADD COLUMN sensor_id VARCHAR(100) UNIQUE;
    END IF;
    
    -- sensor_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='sensor_name') THEN
        ALTER TABLE sensor_metadata ADD COLUMN sensor_name VARCHAR(255);
    END IF;
    
    -- sensor_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='sensor_type') THEN
        ALTER TABLE sensor_metadata ADD COLUMN sensor_type VARCHAR(50);
    END IF;
    
    -- line_config column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='line_config') THEN
        ALTER TABLE sensor_metadata ADD COLUMN line_config JSONB DEFAULT '{}';
    END IF;
    
    -- is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='is_active') THEN
        ALTER TABLE sensor_metadata ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- last_seen_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='last_seen_at') THEN
        ALTER TABLE sensor_metadata ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='created_at') THEN
        ALTER TABLE sensor_metadata ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='sensor_metadata' AND column_name='updated_at') THEN
        ALTER TABLE sensor_metadata ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Update existing records to have organization_id and store_id from J&J store
UPDATE sensor_metadata 
SET store_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    organization_id = 'b2b39c7f-8c6e-4b8a-9c4a-5e8f7a9b2d4c'
WHERE store_id IS NULL 
  AND sensor_id IN ('jj-01-arrabida', 'jj_01_arrábida', 'jj_01_arrabida');

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_sensor_metadata_org ON sensor_metadata(organization_id);
CREATE INDEX IF NOT EXISTS idx_sensor_metadata_store ON sensor_metadata(store_id);
CREATE INDEX IF NOT EXISTS idx_sensor_metadata_type ON sensor_metadata(sensor_type);
CREATE INDEX IF NOT EXISTS idx_sensor_metadata_active ON sensor_metadata(is_active, last_seen_at DESC);