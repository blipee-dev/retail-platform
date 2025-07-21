-- Sensor data tables aligned with Milesight implementation guide

-- Sensor metadata (based on COMPLETE_MILESIGHT_IMPLEMENTATION_GUIDE.md)
CREATE TABLE sensor_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    sensor_name VARCHAR(255) NOT NULL,
    sensor_ip VARCHAR(45) NOT NULL,
    sensor_port INTEGER NOT NULL,
    sensor_type VARCHAR(50) DEFAULT 'milesight_people_counter',
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    config JSONB DEFAULT '{}', -- Connection credentials, API endpoints
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sensor_ip, sensor_port),
    UNIQUE(organization_id, sensor_name)
);

-- People counting raw data (line-by-line counting)
CREATE TABLE people_counting_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Line counting data (4 lines supported by Milesight)
    line1_in INTEGER DEFAULT 0,
    line1_out INTEGER DEFAULT 0,
    line2_in INTEGER DEFAULT 0,
    line2_out INTEGER DEFAULT 0,
    line3_in INTEGER DEFAULT 0,
    line3_out INTEGER DEFAULT 0,
    line4_in INTEGER DEFAULT 0,
    line4_out INTEGER DEFAULT 0,
    
    -- Calculated totals
    total_in INTEGER GENERATED ALWAYS AS (line1_in + line2_in + line3_in + line4_in) STORED,
    total_out INTEGER GENERATED ALWAYS AS (line1_out + line2_out + line3_out + line4_out) STORED,
    net_flow INTEGER GENERATED ALWAYS AS ((line1_in + line2_in + line3_in + line4_in) - (line1_out + line2_out + line3_out + line4_out)) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regional counting raw data (zone-based counting)
CREATE TABLE regional_counting_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Region counts (4 regions supported)
    region1_count INTEGER DEFAULT 0,
    region2_count INTEGER DEFAULT 0,
    region3_count INTEGER DEFAULT 0,
    region4_count INTEGER DEFAULT 0,
    total_regional_count INTEGER GENERATED ALWAYS AS 
        (region1_count + region2_count + region3_count + region4_count) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporal heatmap data
CREATE TABLE heatmap_temporal_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    heat_value FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- VCA alarm status
CREATE TABLE vca_alarm_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    counter_alarm_status INTEGER,
    region1_in_alarm INTEGER,
    region1_out_alarm INTEGER,
    region2_in_alarm INTEGER,
    region2_out_alarm INTEGER,
    region3_in_alarm INTEGER,
    region3_out_alarm INTEGER,
    region4_in_alarm INTEGER,
    region4_out_alarm INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hourly analytics (pre-calculated for dashboard performance)
CREATE TABLE hourly_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Traffic Metrics
    total_entries INTEGER,
    total_exits INTEGER,
    net_flow INTEGER,
    peak_occupancy INTEGER,
    avg_occupancy FLOAT,
    
    -- Line Performance
    busiest_line INTEGER,
    line_distribution JSONB, -- {"line1": 0.25, "line2": 0.15, "line3": 0.10, "line4": 0.50}
    
    -- Regional Metrics
    region_avg_occupancy JSONB, -- {"region1": 45.5, "region2": 120.3, ...}
    region_max_occupancy JSONB,
    region_utilization JSONB, -- Percentage of time occupied
    
    -- Conversion Metrics
    entry_to_checkout_rate FLOAT,
    zone_conversion_rates JSONB, -- {"region1": 0.65, "region2": 0.45, ...}
    
    -- Heat Metrics
    avg_heat_value FLOAT,
    max_heat_value FLOAT,
    heat_variance FLOAT,
    
    -- Performance Indicators
    traffic_efficiency_score FLOAT, -- 0-100
    queue_performance_score FLOAT, -- 0-100
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(sensor_id, hour_start)
);

-- Daily summary (business insights)
CREATE TABLE daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Core Metrics
    total_entries INTEGER,
    total_exits INTEGER,
    unique_visitors INTEGER,
    peak_hour TIME,
    peak_occupancy INTEGER,
    
    -- Business Hours Analysis
    opening_visitors INTEGER,
    closing_visitors INTEGER,
    business_hours_traffic INTEGER,
    outside_hours_traffic INTEGER,
    
    -- Zone Performance
    zone_performance JSONB, -- {"entrance": {"visitors": 1000, "dwell_time": 120}, ...}
    traffic_flow_patterns JSONB, -- Common paths through store
    bottleneck_zones JSONB,
    
    -- Conversion Metrics
    store_conversion_rate FLOAT,
    zone_to_zone_conversion JSONB,
    
    -- Comparisons
    vs_yesterday_change FLOAT,
    vs_last_week_change FLOAT,
    vs_last_month_change FLOAT,
    
    -- Alerts Summary
    total_alerts INTEGER,
    critical_alerts INTEGER,
    resolved_alerts INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(store_id, date)
);

-- Alerts and thresholds
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE, -- Null = org-wide rule
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'occupancy', 'no_data', 'threshold', etc.
    conditions JSONB NOT NULL, -- {metric: 'occupancy', operator: '>', value: 100}
    actions JSONB NOT NULL, -- {email: ['manager@store.com'], dashboard: true}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE SET NULL,
    
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    severity VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB, -- Snapshot of data that triggered alert
    
    -- Actions taken
    actions_taken JSONB, -- {email_sent: true, acknowledged_by: 'user_id'}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance (aligned with query patterns)
CREATE INDEX idx_sensor_active ON sensor_metadata(is_active);
CREATE INDEX idx_sensor_org ON sensor_metadata(organization_id);
CREATE INDEX idx_sensor_store ON sensor_metadata(store_id);

-- People counting indexes
CREATE INDEX idx_people_counting_timestamp ON people_counting_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_people_counting_date ON people_counting_raw(sensor_id, DATE(timestamp));
CREATE INDEX idx_people_counting_store ON people_counting_raw(store_id, timestamp DESC);

-- Regional counting indexes
CREATE INDEX idx_regional_timestamp ON regional_counting_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_regional_date ON regional_counting_raw(sensor_id, DATE(timestamp));
CREATE INDEX idx_regional_store ON regional_counting_raw(store_id, timestamp DESC);

-- Heatmap indexes
CREATE INDEX idx_heatmap_timestamp ON heatmap_temporal_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_heatmap_store ON heatmap_temporal_raw(store_id, timestamp DESC);

-- Alarm indexes
CREATE INDEX idx_alarm_timestamp ON vca_alarm_status(sensor_id, timestamp DESC);
CREATE INDEX idx_alarm_store ON vca_alarm_status(store_id, timestamp DESC);

-- Analytics indexes
CREATE INDEX idx_hourly_sensor_hour ON hourly_analytics(sensor_id, hour_start DESC);
CREATE INDEX idx_hourly_store_hour ON hourly_analytics(store_id, hour_start DESC);
CREATE INDEX idx_hourly_org_date ON hourly_analytics(organization_id, DATE(hour_start) DESC);

CREATE INDEX idx_daily_store_date ON daily_summary(store_id, date DESC);
CREATE INDEX idx_daily_org_date ON daily_summary(organization_id, date DESC);

CREATE INDEX idx_alerts_org_triggered ON alerts(organization_id, triggered_at DESC);
CREATE INDEX idx_alerts_store_triggered ON alerts(store_id, triggered_at DESC);

-- Enable RLS on all tables
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_temporal_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE vca_alarm_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see sensors in their organization" ON sensor_metadata
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users see people counting data from their organization" ON people_counting_raw
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users see regional counting data from their organization" ON regional_counting_raw
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users see heatmap data from their organization" ON heatmap_temporal_raw
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users see alarm data from their organization" ON vca_alarm_status
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users see hourly analytics from their organization" ON hourly_analytics
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

CREATE POLICY "Users see daily summaries from their organization" ON daily_summary
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

-- Update triggers
CREATE TRIGGER update_sensor_metadata_updated_at 
    BEFORE UPDATE ON sensor_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_hourly_analytics_updated_at 
    BEFORE UPDATE ON hourly_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_summary_updated_at 
    BEFORE UPDATE ON daily_summary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON alert_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();