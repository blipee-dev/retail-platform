-- Add Missing Tables for Analytics System
-- This migration adds only the tables that don't exist yet

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
    
    -- Capture rate fields
    passing_traffic INTEGER DEFAULT 0,
    passing_in INTEGER DEFAULT 0,
    passing_out INTEGER DEFAULT 0,
    dominant_direction VARCHAR(10),
    capture_rate DECIMAL(5,2),
    
    -- Metadata
    data_quality FLOAT DEFAULT 1.0,
    processing_flags JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per timestamp per sensor
    UNIQUE(sensor_id, timestamp)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_people_counting_data_timestamp ON people_counting_data(sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_people_counting_data_store ON people_counting_data(store_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_people_counting_capture_rate ON people_counting_data(sensor_id, timestamp, capture_rate);
CREATE INDEX IF NOT EXISTS idx_people_counting_passing_traffic ON people_counting_data(sensor_id, timestamp, passing_traffic);

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

CREATE INDEX IF NOT EXISTS idx_regional_counts_timestamp ON regional_counts(sensor_id, region_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_regional_counts_store ON regional_counts(store_id, timestamp DESC);

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
    resolved_by UUID REFERENCES user_profiles(id),
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_analytics_alerts_active ON analytics_alerts(sensor_id, resolved, severity, triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_store ON analytics_alerts(store_id, resolved, triggered_at DESC);

-- =====================================================
-- UPDATE HOURLY ANALYTICS
-- =====================================================

-- Add capture rate columns to hourly_analytics if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hourly_analytics' AND column_name='avg_capture_rate') THEN
        ALTER TABLE hourly_analytics ADD COLUMN avg_capture_rate DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hourly_analytics' AND column_name='total_passing_traffic') THEN
        ALTER TABLE hourly_analytics ADD COLUMN total_passing_traffic INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='hourly_analytics' AND column_name='dominant_traffic_direction') THEN
        ALTER TABLE hourly_analytics ADD COLUMN dominant_traffic_direction VARCHAR(10);
    END IF;
END $$;

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
        NEW.line1_in + NEW.line2_in + NEW.line3_in,
        NEW.line1_out + NEW.line2_out + NEW.line3_out
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
    
    -- Calculate capture rate
    UPDATE people_counting_data
    SET 
        passing_traffic = NEW.line4_in + NEW.line4_out,
        passing_in = NEW.line4_in,
        passing_out = NEW.line4_out,
        capture_rate = CASE 
            WHEN (NEW.line4_in + NEW.line4_out) > 0 
            THEN ((NEW.line1_in + NEW.line2_in + NEW.line3_in)::DECIMAL / (NEW.line4_in + NEW.line4_out)) * 100
            ELSE 0 
        END,
        dominant_direction = CASE 
            WHEN NEW.line4_in > NEW.line4_out THEN 'in'
            WHEN NEW.line4_out > NEW.line4_in THEN 'out'
            ELSE 'balanced'
        END
    WHERE sensor_id = NEW.sensor_id 
    AND timestamp = NEW.timestamp;
    
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

COMMENT ON TABLE people_counting_data IS 'Processed people counting data with business logic and capture rate calculations';
COMMENT ON TABLE regional_counts IS 'Processed regional count data for zone analytics';
COMMENT ON TABLE analytics_alerts IS 'System-generated alerts based on analytics thresholds';

COMMENT ON COLUMN people_counting_data.total_in IS 'Total entries calculated from lines 1-3 (store entrances)';
COMMENT ON COLUMN people_counting_data.total_out IS 'Total exits calculated from lines 1-3 (store exits)';
COMMENT ON COLUMN people_counting_data.passing_traffic IS 'Total passing traffic from Line 4 (in + out)';
COMMENT ON COLUMN people_counting_data.capture_rate IS 'Percentage of passing traffic that entered store';