-- Sensor Metadata Schema
-- This migration creates the sensor_metadata table that other tables reference

-- =====================================================
-- SENSOR METADATA
-- =====================================================

-- Sensor configuration and metadata
CREATE TABLE IF NOT EXISTS sensor_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    -- Sensor identification
    sensor_id VARCHAR(100) NOT NULL UNIQUE, -- External sensor ID (e.g., 'jj-01-arrabida')
    sensor_name VARCHAR(255) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL, -- 'milesight', 'omnia', etc.
    sensor_model VARCHAR(100),
    
    -- Configuration
    api_endpoint VARCHAR(500),
    api_credentials JSONB DEFAULT '{}', -- Encrypted credentials
    configuration JSONB DEFAULT '{}', -- Sensor-specific configuration
    
    -- Line configuration (for people counting sensors)
    line_config JSONB DEFAULT '{}', -- {line1: "entrance", line2: "department", etc.}
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    location JSONB DEFAULT '{}', -- {floor: 1, zone: "main", coordinates: {...}}
    installed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_sensor_metadata_org ON sensor_metadata(organization_id);
CREATE INDEX idx_sensor_metadata_store ON sensor_metadata(store_id);
CREATE INDEX idx_sensor_metadata_type ON sensor_metadata(sensor_type);
CREATE INDEX idx_sensor_metadata_active ON sensor_metadata(is_active, last_seen_at DESC);

-- =====================================================
-- REGIONS TABLE (referenced by regional analytics)
-- =====================================================

-- Store regions for analytics
CREATE TABLE IF NOT EXISTS regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Region identification
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'entrance', 'browsing', 'queue', 'high-value', etc.
    region_code VARCHAR(50), -- Internal code like 'R1', 'R2', etc.
    
    -- Physical properties
    polygon JSONB, -- Coordinate points defining the region
    area_sqm FLOAT, -- Area in square meters
    capacity INTEGER, -- Maximum safe capacity
    
    -- Alert thresholds
    max_occupancy_threshold INTEGER,
    max_queue_length INTEGER,
    max_wait_time_seconds INTEGER,
    unattended_threshold_seconds INTEGER,
    
    -- Business rules
    business_rules JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(store_id, name)
);

CREATE INDEX idx_regions_store ON regions(store_id, is_active);
CREATE INDEX idx_regions_type ON regions(type);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE sensor_metadata IS 'Configuration and metadata for all sensors in the system';
COMMENT ON TABLE regions IS 'Defined regions within stores for spatial analytics';

COMMENT ON COLUMN sensor_metadata.sensor_id IS 'Unique external identifier used by the sensor API';
COMMENT ON COLUMN sensor_metadata.line_config IS 'JSON mapping of line numbers to their business purpose';
COMMENT ON COLUMN regions.type IS 'Business purpose of the region for analytics categorization';
COMMENT ON COLUMN regions.polygon IS 'Array of coordinate points defining the region boundary';