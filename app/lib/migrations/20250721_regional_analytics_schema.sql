-- Regional Analytics Schema Migration
-- This migration creates the complete schema for regional analytics
-- Supporting both regional counting and entrance/exit tracking

-- =====================================================
-- REGION CONFIGURATION
-- =====================================================

-- Store-specific region configurations
CREATE TABLE IF NOT EXISTS region_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    region_number INTEGER NOT NULL CHECK (region_number BETWEEN 1 AND 4),
    region_type VARCHAR(50) NOT NULL,
    region_name VARCHAR(255) NOT NULL,
    business_purpose TEXT,
    capacity INTEGER,
    physical_location JSONB DEFAULT '{}',
    alert_thresholds JSONB DEFAULT '{}',
    custom_properties JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_id, region_number)
);

-- Region type templates for quick configuration
CREATE TABLE IF NOT EXISTS region_type_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    store_type VARCHAR(50),
    region_category VARCHAR(50) CHECK (region_category IN ('entrance', 'shopping', 'service', 'transition', 'custom')),
    default_metrics JSONB DEFAULT '[]',
    default_thresholds JSONB DEFAULT '{}',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default region templates
INSERT INTO region_type_templates (template_name, store_type, region_category, default_metrics, default_thresholds) VALUES
('retail_entrance', 'retail', 'entrance', '["entries", "exits", "bounce_rate", "capture_rate"]', '{"maxOccupancy": 50, "minDwellTime": 10}'),
('retail_shopping', 'retail', 'shopping', '["dwell_time", "revisits", "engagement_score"]', '{"minDwellTime": 60, "maxDwellTime": 1800}'),
('retail_checkout', 'retail', 'service', '["queue_length", "wait_time", "service_rate"]', '{"maxQueueLength": 10, "maxWaitTime": 600}'),
('retail_premium', 'retail', 'shopping', '["consideration_time", "staff_interactions", "conversion_rate"]', '{"minStaffPresence": 0.8}');

-- =====================================================
-- ENTRANCE/EXIT TRACKING
-- =====================================================

-- Individual entrance/exit events
CREATE TABLE IF NOT EXISTS region_entrance_exit_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('entrance', 'exit')),
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    person_id VARCHAR(50), -- Anonymous ID for journey tracking
    confidence FLOAT DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    event_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient querying
CREATE INDEX idx_entrance_exit_timestamp ON region_entrance_exit_events(sensor_id, event_timestamp DESC);
CREATE INDEX idx_entrance_exit_region ON region_entrance_exit_events(region_id, event_timestamp DESC);
CREATE INDEX idx_entrance_exit_person ON region_entrance_exit_events(person_id, event_timestamp);

-- =====================================================
-- REGIONAL OCCUPANCY TRACKING
-- =====================================================

-- Real-time occupancy snapshots
CREATE TABLE IF NOT EXISTS regional_occupancy_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    snapshot_time TIMESTAMP WITH TIME ZONE NOT NULL,
    occupancy_count INTEGER NOT NULL DEFAULT 0,
    occupancy_rate DECIMAL(5,4) DEFAULT 0, -- Percentage of capacity
    density_level VARCHAR(20) CHECK (density_level IN ('empty', 'low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, snapshot_time)
);

-- =====================================================
-- DWELL TIME ANALYTICS
-- =====================================================

-- Calculated dwell times per visit
CREATE TABLE IF NOT EXISTS region_dwell_times (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    person_id VARCHAR(50),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
    dwell_seconds INTEGER NOT NULL,
    dwell_category VARCHAR(20) CHECK (dwell_category IN ('bounce', 'browse', 'engaged', 'extended')),
    visit_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dwell_times_region ON region_dwell_times(region_id, entry_time DESC);
CREATE INDEX idx_dwell_times_duration ON region_dwell_times(region_id, dwell_seconds);

-- =====================================================
-- CUSTOMER JOURNEYS
-- =====================================================

-- Complete customer journeys through the store
CREATE TABLE IF NOT EXISTS customer_journeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    journey_id VARCHAR(100) NOT NULL UNIQUE,
    person_id VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    total_duration_seconds INTEGER,
    path JSONB NOT NULL DEFAULT '[]', -- Array of {region_id, entry_time, exit_time, dwell_time}
    regions_visited INTEGER DEFAULT 0,
    journey_type VARCHAR(50), -- 'direct', 'browsing', 'comparison', 'abandoned'
    conversion BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10,2),
    journey_score FLOAT, -- Quality/efficiency score
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_journeys_store ON customer_journeys(store_id, start_time DESC);
CREATE INDEX idx_journeys_conversion ON customer_journeys(store_id, conversion, start_time DESC);

-- =====================================================
-- QUEUE ANALYTICS
-- =====================================================

-- Queue formation and metrics
CREATE TABLE IF NOT EXISTS queue_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    measurement_time TIMESTAMP WITH TIME ZONE NOT NULL,
    queue_length INTEGER DEFAULT 0,
    avg_wait_seconds INTEGER,
    max_wait_seconds INTEGER,
    service_rate FLOAT, -- People served per minute
    abandonment_count INTEGER DEFAULT 0,
    queue_formation_rate FLOAT, -- People joining per minute
    staff_count INTEGER,
    efficiency_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, measurement_time)
);

-- =====================================================
-- REGIONAL ANALYTICS AGGREGATES
-- =====================================================

-- Flexible analytics storage for different time buckets
CREATE TABLE IF NOT EXISTS regional_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    time_bucket TIMESTAMP WITH TIME ZONE NOT NULL,
    bucket_size VARCHAR(20) NOT NULL CHECK (bucket_size IN ('1min', '5min', '15min', '1hour', '1day')),
    
    -- Traffic metrics
    total_entries INTEGER DEFAULT 0,
    total_exits INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    
    -- Occupancy metrics
    avg_occupancy FLOAT,
    peak_occupancy INTEGER,
    min_occupancy INTEGER,
    occupancy_variance FLOAT,
    
    -- Dwell metrics
    avg_dwell_seconds FLOAT,
    median_dwell_seconds FLOAT,
    total_dwell_time_seconds BIGINT,
    bounce_count INTEGER DEFAULT 0, -- Visits < 30 seconds
    
    -- Conversion metrics
    visits_count INTEGER DEFAULT 0,
    conversions_count INTEGER DEFAULT 0,
    conversion_rate FLOAT,
    
    -- Queue metrics (if applicable)
    avg_queue_length FLOAT,
    max_queue_length INTEGER,
    total_queue_time_seconds BIGINT,
    queue_abandonments INTEGER DEFAULT 0,
    
    -- Advanced metrics
    engagement_score FLOAT,
    efficiency_score FLOAT,
    metrics JSONB DEFAULT '{}', -- Flexible additional metrics
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(region_id, time_bucket, bucket_size)
);

CREATE INDEX idx_regional_analytics_time ON regional_analytics(region_id, bucket_size, time_bucket DESC);

-- =====================================================
-- FLOW ANALYTICS
-- =====================================================

-- Track flow between regions
CREATE TABLE IF NOT EXISTS regional_flow_matrix (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    from_region_id UUID REFERENCES region_configurations(id) ON DELETE CASCADE,
    to_region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL,
    
    -- Flow metrics
    transition_count INTEGER DEFAULT 0,
    unique_persons INTEGER DEFAULT 0,
    avg_transition_seconds FLOAT,
    min_transition_seconds INTEGER,
    max_transition_seconds INTEGER,
    
    -- Flow characteristics
    flow_type VARCHAR(50), -- 'direct', 'return', 'skip'
    conversion_impact FLOAT, -- Correlation with conversion
    is_primary_path BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_region_id, to_region_id, measurement_date)
);

-- =====================================================
-- ALERTS AND INSIGHTS
-- =====================================================

-- Regional alerts
CREATE TABLE IF NOT EXISTS regional_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region_id UUID NOT NULL REFERENCES region_configurations(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'overcrowding', 'queue', 'abandonment', 'understaffed'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    alert_title VARCHAR(255) NOT NULL,
    alert_message TEXT,
    metrics JSONB DEFAULT '{}', -- Metrics that triggered the alert
    threshold_value FLOAT,
    actual_value FLOAT,
    
    -- Alert handling
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES user_profiles(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    -- Automated actions
    automated_actions JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_regional_alerts_active ON regional_alerts(region_id, resolved, severity);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate current occupancy
CREATE OR REPLACE FUNCTION calculate_regional_occupancy(p_region_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_occupancy INTEGER;
BEGIN
    WITH recent_events AS (
        SELECT 
            COUNT(*) FILTER (WHERE event_type = 'entrance') as entries,
            COUNT(*) FILTER (WHERE event_type = 'exit') as exits
        FROM region_entrance_exit_events
        WHERE region_id = p_region_id
        AND event_timestamp >= CURRENT_DATE
    )
    SELECT entries - exits INTO v_occupancy FROM recent_events;
    
    RETURN COALESCE(v_occupancy, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update journey on region exit
CREATE OR REPLACE FUNCTION update_customer_journey()
RETURNS TRIGGER AS $$
DECLARE
    v_journey_id VARCHAR(100);
    v_journey_path JSONB;
BEGIN
    IF NEW.event_type = 'exit' AND NEW.person_id IS NOT NULL THEN
        -- Find active journey for this person
        SELECT journey_id, path INTO v_journey_id, v_journey_path
        FROM customer_journeys
        WHERE person_id = NEW.person_id
        AND end_time IS NULL
        ORDER BY start_time DESC
        LIMIT 1;
        
        IF v_journey_id IS NOT NULL THEN
            -- Update journey path
            v_journey_path := v_journey_path || jsonb_build_object(
                'region_id', NEW.region_id,
                'exit_time', NEW.event_timestamp
            );
            
            UPDATE customer_journeys
            SET path = v_journey_path,
                regions_visited = jsonb_array_length(v_journey_path),
                updated_at = CURRENT_TIMESTAMP
            WHERE journey_id = v_journey_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journey
AFTER INSERT ON region_entrance_exit_events
FOR EACH ROW
EXECUTE FUNCTION update_customer_journey();

-- Function to check alert conditions
CREATE OR REPLACE FUNCTION check_regional_alerts()
RETURNS TRIGGER AS $$
DECLARE
    v_config RECORD;
    v_occupancy INTEGER;
    v_capacity INTEGER;
BEGIN
    -- Get region configuration
    SELECT * INTO v_config FROM region_configurations WHERE id = NEW.region_id;
    
    IF v_config.capacity IS NOT NULL AND v_config.capacity > 0 THEN
        v_occupancy := calculate_regional_occupancy(NEW.region_id);
        
        -- Check overcrowding
        IF v_occupancy > v_config.capacity * 0.9 THEN
            INSERT INTO regional_alerts (
                region_id, alert_type, severity, triggered_at,
                alert_title, alert_message, threshold_value, actual_value
            ) VALUES (
                NEW.region_id,
                'overcrowding',
                CASE WHEN v_occupancy >= v_config.capacity THEN 'critical' ELSE 'warning' END,
                NEW.event_timestamp,
                'Region Overcrowding Alert',
                format('%s is at %s%% capacity', v_config.region_name, 
                       round((v_occupancy::numeric / v_config.capacity) * 100)),
                v_config.capacity * 0.9,
                v_occupancy
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_alerts
AFTER INSERT ON region_entrance_exit_events
FOR EACH ROW
EXECUTE FUNCTION check_regional_alerts();

-- =====================================================
-- VIEWS FOR EASY QUERYING
-- =====================================================

-- Current regional status view
CREATE OR REPLACE VIEW v_regional_status AS
SELECT 
    rc.id as region_id,
    rc.region_name,
    rc.region_type,
    rc.capacity,
    calculate_regional_occupancy(rc.id) as current_occupancy,
    CASE 
        WHEN rc.capacity > 0 THEN 
            round((calculate_regional_occupancy(rc.id)::numeric / rc.capacity) * 100, 1)
        ELSE NULL 
    END as occupancy_percentage,
    s.name as store_name,
    sm.sensor_name
FROM region_configurations rc
JOIN stores s ON rc.store_id = s.id
JOIN sensor_metadata sm ON rc.sensor_id = sm.id
WHERE rc.is_active = true;

-- Active journeys view
CREATE OR REPLACE VIEW v_active_journeys AS
SELECT 
    j.journey_id,
    j.person_id,
    j.start_time,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - j.start_time)) as duration_seconds,
    j.regions_visited,
    jsonb_array_length(j.path) as path_length,
    s.name as store_name
FROM customer_journeys j
JOIN stores s ON j.store_id = s.id
WHERE j.end_time IS NULL
AND j.start_time > CURRENT_TIMESTAMP - INTERVAL '4 hours';

-- Regional performance view
CREATE OR REPLACE VIEW v_regional_performance AS
SELECT 
    rc.region_name,
    rc.region_type,
    DATE(ra.time_bucket) as date,
    SUM(ra.total_entries) as daily_entries,
    SUM(ra.total_exits) as daily_exits,
    AVG(ra.avg_dwell_seconds)::integer as avg_dwell_seconds,
    AVG(ra.conversion_rate) as avg_conversion_rate,
    SUM(ra.conversions_count) as total_conversions
FROM regional_analytics ra
JOIN region_configurations rc ON ra.region_id = rc.id
WHERE ra.bucket_size = '1hour'
AND ra.time_bucket >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY rc.region_name, rc.region_type, DATE(ra.time_bucket)
ORDER BY date DESC, daily_entries DESC;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_occupancy_snapshots_recent ON regional_occupancy_snapshots(region_id, snapshot_time DESC);
CREATE INDEX idx_queue_analytics_recent ON queue_analytics(region_id, measurement_time DESC);
CREATE INDEX idx_regional_flow_date ON regional_flow_matrix(measurement_date DESC);
CREATE INDEX idx_alerts_unresolved ON regional_alerts(resolved, severity, triggered_at DESC);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE region_configurations IS 'Defines regions within each store for analytics tracking';
COMMENT ON TABLE region_entrance_exit_events IS 'Individual entrance/exit events for region-based tracking';
COMMENT ON TABLE regional_analytics IS 'Aggregated analytics data for regions at various time buckets';
COMMENT ON TABLE customer_journeys IS 'Complete customer paths through store regions';
COMMENT ON TABLE queue_analytics IS 'Queue-specific metrics for service regions';
COMMENT ON TABLE regional_flow_matrix IS 'Movement patterns between regions';

COMMENT ON COLUMN region_configurations.region_type IS 'Type of region: entrance, shopping, service, transition, or custom';
COMMENT ON COLUMN region_entrance_exit_events.person_id IS 'Anonymous identifier for journey tracking';
COMMENT ON COLUMN regional_analytics.bucket_size IS 'Time aggregation level: 1min, 5min, 15min, 1hour, or 1day';
COMMENT ON COLUMN customer_journeys.journey_type IS 'Classification of the customer journey pattern';
COMMENT ON COLUMN queue_analytics.service_rate IS 'Number of people served per minute in this region';