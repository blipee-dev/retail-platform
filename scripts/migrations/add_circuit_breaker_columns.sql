-- Add missing columns for circuit breaker functionality

-- Add columns to sensor_metadata table
ALTER TABLE sensor_metadata 
ADD COLUMN IF NOT EXISTS circuit_state VARCHAR(20) DEFAULT 'CLOSED',
ADD COLUMN IF NOT EXISTS last_successful_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_failed_check TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS recovery_attempts INTEGER DEFAULT 0;

-- Add columns to latest_sensor_data table
ALTER TABLE latest_sensor_data
ADD COLUMN IF NOT EXISTS last_check_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS records_collected INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_sensor_metadata_circuit_state ON sensor_metadata(circuit_state) WHERE is_active = true;

-- Update existing records with default values
UPDATE sensor_metadata 
SET circuit_state = CASE 
  WHEN consecutive_failures >= 5 THEN 'OPEN'
  ELSE 'CLOSED'
END
WHERE circuit_state IS NULL;

UPDATE latest_sensor_data
SET last_check_timestamp = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE last_check_timestamp IS NULL;