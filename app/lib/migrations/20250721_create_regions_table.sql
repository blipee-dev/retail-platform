-- Create Regions Table
-- This migration creates the regions table for spatial analytics

-- =====================================================
-- REGIONS TABLE
-- =====================================================

-- Store regions for analytics
CREATE TABLE IF NOT EXISTS regions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Region identification
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'entrance', 'browsing', 'queue', 'high-value', 'transition', 'custom'
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_regions_store ON regions(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_regions_type ON regions(type);
CREATE INDEX IF NOT EXISTS idx_regions_org ON regions(organization_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_regions_updated_at ON regions;
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE regions IS 'Defined regions within stores for spatial analytics';
COMMENT ON COLUMN regions.type IS 'Business purpose of the region for analytics categorization';
COMMENT ON COLUMN regions.polygon IS 'Array of coordinate points defining the region boundary';
COMMENT ON COLUMN regions.capacity IS 'Maximum safe occupancy for this region';
COMMENT ON COLUMN regions.max_queue_length IS 'Alert threshold for queue length in service regions';
COMMENT ON COLUMN regions.business_rules IS 'JSON object with custom business rules for this region';