-- Fix schema warnings for sensor data collection workflow
-- Run this in Supabase SQL editor

-- 1. Add checked_at column to sensor_health_log if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'sensor_health_log' 
        AND column_name = 'checked_at'
    ) THEN
        ALTER TABLE sensor_health_log 
        ADD COLUMN checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        
        COMMENT ON COLUMN sensor_health_log.checked_at IS 'Timestamp when the sensor was checked';
    END IF;
END $$;

-- 2. Add sensor_id column to alerts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'alerts' 
        AND column_name = 'sensor_id'
    ) THEN
        ALTER TABLE alerts 
        ADD COLUMN sensor_id UUID REFERENCES sensor_metadata(id);
        
        COMMENT ON COLUMN alerts.sensor_id IS 'Reference to the sensor that triggered this alert';
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_alerts_sensor_id ON alerts(sensor_id);
    END IF;
END $$;

-- 3. If sensor_health_log doesn't exist at all, create it
CREATE TABLE IF NOT EXISTS sensor_health_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id),
    status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'warning')),
    response_time INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_sensor_health_log_sensor_id ON sensor_health_log(sensor_id);
CREATE INDEX IF NOT EXISTS idx_sensor_health_log_checked_at ON sensor_health_log(checked_at);

-- Enable RLS
ALTER TABLE sensor_health_log ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON sensor_health_log TO service_role;
GRANT SELECT ON sensor_health_log TO anon, authenticated;