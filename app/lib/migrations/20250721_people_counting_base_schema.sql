-- Base People Counting Schema
-- This migration creates the core tables for people counting data

-- =====================================================
-- PEOPLE COUNTING RAW DATA
-- =====================================================

-- Raw people counting data from sensors
CREATE TABLE IF NOT EXISTS people_counting_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Line crossing data (up to 4 lines)
    line1_in INTEGER DEFAULT 0,
    line1_out INTEGER DEFAULT 0,
    line2_in INTEGER DEFAULT 0,
    line2_out INTEGER DEFAULT 0,
    line3_in INTEGER DEFAULT 0,
    line3_out INTEGER DEFAULT 0,
    line4_in INTEGER DEFAULT 0,
    line4_out INTEGER DEFAULT 0,
    
    -- Calculated totals
    total_in INTEGER GENERATED ALWAYS AS (line1_in + line2_in + line3_in) STORED,
    total_out INTEGER GENERATED ALWAYS AS (line1_out + line2_out + line3_out) STORED,
    
    -- Metadata
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_people_counting_raw_timestamp ON people_counting_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_people_counting_raw_store ON people_counting_raw(store_id, timestamp DESC);
CREATE INDEX idx_people_counting_raw_org ON people_counting_raw(organization_id, timestamp DESC);

-- =====================================================
-- PEOPLE COUNTING PROCESSED DATA
-- =====================================================

-- Processed people counting data with business logic applied
CREATE TABLE IF NOT EXISTS people_counting_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Line crossing data
    line1_in INTEGER DEFAULT 0,
    line1_out INTEGER DEFAULT 0,
    line2_in INTEGER DEFAULT 0,
    line2_out INTEGER DEFAULT 0,
    line3_in INTEGER DEFAULT 0,
    line3_out INTEGER DEFAULT 0,
    line4_in INTEGER DEFAULT 0,
    line4_out INTEGER DEFAULT 0,
    
    -- Store traffic (Lines 1-3)
    total_in INTEGER DEFAULT 0,
    total_out INTEGER DEFAULT 0,
    
    -- Metadata
    data_quality FLOAT DEFAULT 1.0,
    processing_flags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per timestamp per sensor
    UNIQUE(sensor_id, timestamp)
);

-- Create indexes
CREATE INDEX idx_people_counting_data_timestamp ON people_counting_data(sensor_id, timestamp DESC);
CREATE INDEX idx_people_counting_data_store ON people_counting_data(store_id, timestamp DESC);

-- =====================================================
-- HOURLY ANALYTICS
-- =====================================================

-- Hourly aggregated analytics
CREATE TABLE IF NOT EXISTS hourly_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Traffic metrics
    total_entries INTEGER DEFAULT 0,
    total_exits INTEGER DEFAULT 0,
    peak_occupancy INTEGER DEFAULT 0,
    net_flow INTEGER DEFAULT 0,
    
    -- Line distribution
    line_distribution JSONB DEFAULT '{}',
    
    -- Data quality
    data_completeness FLOAT DEFAULT 1.0,
    sample_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(sensor_id, hour_start)
);

CREATE INDEX idx_hourly_analytics_time ON hourly_analytics(sensor_id, hour_start DESC);
CREATE INDEX idx_hourly_analytics_store ON hourly_analytics(store_id, hour_start DESC);

-- =====================================================
-- REGIONAL COUNTING RAW DATA
-- =====================================================

-- Raw regional counting data
CREATE TABLE IF NOT EXISTS regional_counting_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Region counts (up to 4 regions)
    region1_count INTEGER DEFAULT 0,
    region2_count INTEGER DEFAULT 0,
    region3_count INTEGER DEFAULT 0,
    region4_count INTEGER DEFAULT 0,
    
    -- Total count
    total_count INTEGER GENERATED ALWAYS AS (region1_count + region2_count + region3_count + region4_count) STORED,
    
    -- Metadata
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_regional_counting_raw_timestamp ON regional_counting_raw(sensor_id, timestamp DESC);

-- =====================================================
-- REGIONAL COUNTS (PROCESSED)
-- =====================================================

-- Processed regional count data
CREATE TABLE IF NOT EXISTS regional_counts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    region_id VARCHAR(50) NOT NULL, -- Can be 'region1', 'region2', etc. or custom ID
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    count INTEGER DEFAULT 0,
    person_ids JSONB DEFAULT '[]', -- Array of anonymous person IDs if available
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_regional_counts_timestamp ON regional_counts(sensor_id, region_id, timestamp DESC);
CREATE INDEX idx_regional_counts_store ON regional_counts(store_id, timestamp DESC);

-- =====================================================
-- HEATMAP DATA
-- =====================================================

-- Heatmap temporal data
CREATE TABLE IF NOT EXISTS heatmap_temporal_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Heatmap data as grid or coordinates
    heatmap_data JSONB NOT NULL, -- {grid: [[values]], resolution: {x: 100, y: 100}}
    data_format VARCHAR(20) DEFAULT 'grid', -- 'grid' or 'coordinates'
    
    -- Aggregation info
    aggregation_period INTEGER DEFAULT 300, -- seconds (5 minutes default)
    max_intensity FLOAT,
    avg_intensity FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_heatmap_temporal_timestamp ON heatmap_temporal_raw(sensor_id, timestamp DESC);

-- =====================================================
-- VCA ALARM STATUS
-- =====================================================

-- Video Content Analysis alarm status
CREATE TABLE IF NOT EXISTS vca_alarm_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Alarm details
    alarm_type VARCHAR(50) NOT NULL, -- 'motion', 'intrusion', 'loitering', etc.
    alarm_status BOOLEAN DEFAULT false,
    alarm_region VARCHAR(50),
    confidence FLOAT DEFAULT 1.0,
    
    -- Additional data
    alarm_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vca_alarm_timestamp ON vca_alarm_status(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_vca_alarm_active ON vca_alarm_status(sensor_id, timestamp DESC);

-- =====================================================
-- ANALYTICS ALERTS
-- =====================================================

-- System-generated alerts based on analytics
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL, -- 'capacity', 'queue', 'capture', 'anomaly', etc.
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    message TEXT NOT NULL,
    
    -- Alert context
    metrics JSONB DEFAULT '{}',
    threshold_value FLOAT,
    actual_value FLOAT,
    
    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_alerts_active ON analytics_alerts(sensor_id, resolved, severity, triggered_at DESC);
CREATE INDEX idx_analytics_alerts_store ON analytics_alerts(store_id, resolved, triggered_at DESC);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate current store occupancy
CREATE OR REPLACE FUNCTION calculate_current_occupancy(p_store_id UUID)
RETURNS TABLE(
    total_occupancy INTEGER,
    last_update TIMESTAMP WITH TIME ZONE,
    data_quality FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_data AS (
        SELECT 
            timestamp,
            SUM(total_in) OVER (ORDER BY timestamp) - 
            SUM(total_out) OVER (ORDER BY timestamp) as occupancy,
            data_quality
        FROM people_counting_data
        WHERE store_id = p_store_id
        AND timestamp >= CURRENT_DATE
        ORDER BY timestamp DESC
        LIMIT 1
    )
    SELECT 
        COALESCE(occupancy, 0)::INTEGER as total_occupancy,
        timestamp as last_update,
        COALESCE(data_quality, 0)::FLOAT as data_quality
    FROM recent_data;
END;
$$ LANGUAGE plpgsql;

-- Function to process raw data into cleaned data
CREATE OR REPLACE FUNCTION process_people_counting_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update processed data
    INSERT INTO people_counting_data (
        sensor_id, organization_id, store_id, timestamp,
        line1_in, line1_out, line2_in, line2_out,
        line3_in, line3_out, line4_in, line4_out,
        total_in, total_out
    ) VALUES (
        NEW.sensor_id, NEW.organization_id, NEW.store_id, NEW.timestamp,
        NEW.line1_in, NEW.line1_out, NEW.line2_in, NEW.line2_out,
        NEW.line3_in, NEW.line3_out, NEW.line4_in, NEW.line4_out,
        NEW.total_in, NEW.total_out
    )
    ON CONFLICT (sensor_id, timestamp) DO UPDATE SET
        line1_in = EXCLUDED.line1_in,
        line1_out = EXCLUDED.line1_out,
        line2_in = EXCLUDED.line2_in,
        line2_out = EXCLUDED.line2_out,
        line3_in = EXCLUDED.line3_in,
        line3_out = EXCLUDED.line3_out,
        line4_in = EXCLUDED.line4_in,
        line4_out = EXCLUDED.line4_out,
        total_in = EXCLUDED.total_in,
        total_out = EXCLUDED.total_out,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to process raw data
CREATE TRIGGER trigger_process_people_counting
AFTER INSERT ON people_counting_raw
FOR EACH ROW
EXECUTE FUNCTION process_people_counting_data();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE people_counting_raw IS 'Raw sensor data for people counting before processing';
COMMENT ON TABLE people_counting_data IS 'Processed people counting data with business logic applied';
COMMENT ON TABLE hourly_analytics IS 'Hourly aggregated analytics for performance and reporting';
COMMENT ON TABLE regional_counting_raw IS 'Raw regional occupancy counts from sensors';
COMMENT ON TABLE regional_counts IS 'Processed regional count data';
COMMENT ON TABLE heatmap_temporal_raw IS 'Temporal heatmap data showing traffic density';
COMMENT ON TABLE vca_alarm_status IS 'Video Content Analysis alarm events';
COMMENT ON TABLE analytics_alerts IS 'System-generated alerts based on analytics thresholds';

COMMENT ON COLUMN people_counting_data.total_in IS 'Total entries calculated from lines 1-3 (store entrances)';
COMMENT ON COLUMN people_counting_data.total_out IS 'Total exits calculated from lines 1-3 (store exits)';
COMMENT ON COLUMN people_counting_data.line4_in IS 'Line 4 IN count (typically used for passing traffic)';
COMMENT ON COLUMN people_counting_data.line4_out IS 'Line 4 OUT count (typically used for passing traffic)';