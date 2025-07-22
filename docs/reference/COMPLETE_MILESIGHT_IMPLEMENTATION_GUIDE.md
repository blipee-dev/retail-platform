# 📚 Complete Milesight Implementation Guide with Database Schema

## 📊 FINAL SUMMARY: Milesight Sensor Actual Capabilities

Based on all our testing and analysis, here's what we can **ACTUALLY** extract from the Milesight sensor at OML01-Omnia GuimarãesShopping:

### ✅ **CONFIRMED WORKING ENDPOINTS**

#### 1. **People Counting Data**
```python
# WORKS with specific parameters
url = "http://93.108.96.96:21001/dataloader.cgi?dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3&time_start=2025-07-18-00:00:00&time_end=2025-07-19-00:00:00"

# Returns CSV with:
- Line1_In, Line1_Out
- Line2_In, Line2_Out  
- Line3_In, Line3_Out
- Line4_In, Line4_Out
- Total counts
```

#### 2. **Regional Counting Data**
```python
# WORKS
url = "http://93.108.96.96:21001/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&time_start=2025-07-18-00:00:00&time_end=2025-07-19-00:00:00"

# Returns CSV with:
- region1_count through region4_count
- total_regional_count
- Hourly aggregated data
```

#### 3. **Temporal Heatmap Data**
```python
# WORKS
url = "http://93.108.96.96:21001/dataloader.cgi?dw=heatmapcsv&time_start=2025-07-18-00:00:00&time_end=2025-07-19-00:00:00"

# Returns CSV with:
- Heat values over time
- Hourly heat intensity
```

#### 4. **VCA Alarm Status**
```python
# WORKS
url = "http://93.108.96.96:21001/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"

# Returns:
- Alarm status flags
- Current counter values
```

### ❌ **NOT WORKING (for this specific camera)**

Despite being documented in the API:
- ❌ Snapshots (all endpoints return 401/404)
- ❌ Video streaming (401 unauthorized)
- ❌ System info endpoints (401)
- ❌ VCA configuration endpoints (401)
- ❌ Event monitoring (401)
- ❌ Spatial heatmap (502 bad gateway)

## 🗄️ **DATABASE SCHEMA FOR SUPABASE**

### 1. **Raw Data Tables**

#### `sensor_metadata`
```sql
CREATE TABLE sensor_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_name VARCHAR(255) NOT NULL,
    sensor_ip VARCHAR(45) NOT NULL,
    sensor_port INTEGER NOT NULL,
    store_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_ip, sensor_port)
);

-- Index for faster lookups
CREATE INDEX idx_sensor_active ON sensor_metadata(is_active);
```

#### `people_counting_raw`
```sql
CREATE TABLE people_counting_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    line1_in INTEGER DEFAULT 0,
    line1_out INTEGER DEFAULT 0,
    line2_in INTEGER DEFAULT 0,
    line2_out INTEGER DEFAULT 0,
    line3_in INTEGER DEFAULT 0,
    line3_out INTEGER DEFAULT 0,
    line4_in INTEGER DEFAULT 0,
    line4_out INTEGER DEFAULT 0,
    total_in INTEGER GENERATED ALWAYS AS (line1_in + line2_in + line3_in + line4_in) STORED,
    total_out INTEGER GENERATED ALWAYS AS (line1_out + line2_out + line3_out + line4_out) STORED,
    net_flow INTEGER GENERATED ALWAYS AS ((line1_in + line2_in + line3_in + line4_in) - (line1_out + line2_out + line3_out + line4_out)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_people_counting_timestamp ON people_counting_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_people_counting_date ON people_counting_raw(sensor_id, DATE(timestamp));
```

#### `regional_counting_raw`
```sql
CREATE TABLE regional_counting_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    region1_count INTEGER DEFAULT 0,
    region2_count INTEGER DEFAULT 0,
    region3_count INTEGER DEFAULT 0,
    region4_count INTEGER DEFAULT 0,
    total_regional_count INTEGER GENERATED ALWAYS AS 
        (region1_count + region2_count + region3_count + region4_count) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_regional_timestamp ON regional_counting_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_regional_date ON regional_counting_raw(sensor_id, DATE(timestamp));
```

#### `heatmap_temporal_raw`
```sql
CREATE TABLE heatmap_temporal_raw (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    heat_value FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_heatmap_timestamp ON heatmap_temporal_raw(sensor_id, timestamp DESC);
```

#### `vca_alarm_status`
```sql
CREATE TABLE vca_alarm_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index
CREATE INDEX idx_alarm_timestamp ON vca_alarm_status(sensor_id, timestamp DESC);
```

### 2. **Calculated Analytics Tables**

#### `hourly_analytics`
```sql
CREATE TABLE hourly_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_id, hour_start)
);

-- Indexes
CREATE INDEX idx_hourly_analytics_date ON hourly_analytics(sensor_id, DATE(hour_start));
CREATE INDEX idx_hourly_analytics_hour ON hourly_analytics(sensor_id, EXTRACT(HOUR FROM hour_start));
```

#### `daily_analytics`
```sql
CREATE TABLE daily_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Traffic Summary
    total_visitors INTEGER,
    total_entries INTEGER,
    total_exits INTEGER,
    peak_hour TIME,
    peak_hour_traffic INTEGER,
    off_peak_hour TIME,
    off_peak_traffic INTEGER,
    -- Patterns
    hourly_distribution JSONB, -- Array of 24 hourly values
    busiest_regions JSONB, -- Ranked regions by traffic
    line_usage_distribution JSONB,
    -- Conversions
    overall_conversion_rate FLOAT,
    avg_dwell_time_minutes FLOAT,
    bounce_rate FLOAT, -- Entered but didn't visit key zones
    -- Queue Metrics
    avg_queue_length FLOAT,
    max_queue_length INTEGER,
    queue_peak_time TIME,
    estimated_avg_wait_minutes FLOAT,
    -- Comparisons
    dow_avg_comparison FLOAT, -- vs same day of week average
    wow_change_percent FLOAT, -- Week-over-week
    mom_change_percent FLOAT, -- Month-over-month
    yoy_change_percent FLOAT, -- Year-over-year
    -- Scores
    overall_performance_score FLOAT, -- 0-100
    data_quality_score FLOAT, -- 0-100 based on data completeness
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_id, date)
);

-- Indexes
CREATE INDEX idx_daily_analytics_month ON daily_analytics(sensor_id, DATE_TRUNC('month', date));
CREATE INDEX idx_daily_analytics_dow ON daily_analytics(sensor_id, EXTRACT(DOW FROM date));
```

#### `pathway_analytics`
```sql
CREATE TABLE pathway_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    from_region INTEGER CHECK (from_region BETWEEN 1 AND 4),
    to_region INTEGER CHECK (to_region BETWEEN 1 AND 4),
    transition_count INTEGER,
    avg_transition_time_seconds FLOAT,
    peak_transition_hour TIME,
    pathway_efficiency_score FLOAT, -- 0-100
    is_primary_path BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_id, date, from_region, to_region),
    CHECK (from_region != to_region)
);

-- Indexes
CREATE INDEX idx_pathway_popular ON pathway_analytics(sensor_id, transition_count DESC);
CREATE INDEX idx_pathway_regions ON pathway_analytics(from_region, to_region);
```

#### `alerts_generated`
```sql
CREATE TABLE alerts_generated (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'capacity', 'queue', 'anomaly', 'system', 'conversion'
    severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    metrics JSONB, -- Related metrics that triggered the alert
    threshold_value FLOAT,
    actual_value FLOAT,
    -- Alert handling
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    -- Alert actions
    actions_taken JSONB, -- Array of {action, timestamp, result}
    escalated BOOLEAN DEFAULT false,
    escalated_to VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_alerts_unresolved ON alerts_generated(sensor_id, resolved, severity);
CREATE INDEX idx_alerts_timestamp ON alerts_generated(sensor_id, timestamp DESC);
CREATE INDEX idx_alerts_type ON alerts_generated(alert_type, severity);
```

#### `predictions`
```sql
CREATE TABLE predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    prediction_time TIMESTAMP WITH TIME ZONE NOT NULL,
    prediction_type VARCHAR(50) NOT NULL, -- 'traffic', 'queue', 'conversion', 'occupancy'
    target_time TIMESTAMP WITH TIME ZONE NOT NULL,
    time_horizon_minutes INTEGER, -- How far ahead the prediction is
    predicted_value FLOAT NOT NULL,
    confidence_interval_lower FLOAT,
    confidence_interval_upper FLOAT,
    confidence_score FLOAT, -- 0-1
    model_name VARCHAR(100),
    model_version VARCHAR(50),
    features_used JSONB, -- Features that influenced the prediction
    actual_value FLOAT, -- Filled in when actual data becomes available
    accuracy_score FLOAT, -- Calculated after actual value is known
    error_percentage FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_predictions_target ON predictions(sensor_id, target_time, prediction_type);
CREATE INDEX idx_predictions_accuracy ON predictions(sensor_id, accuracy_score DESC) WHERE actual_value IS NOT NULL;
```

### 3. **Business Intelligence Tables**

#### `kpi_metrics`
```sql
CREATE TABLE kpi_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value FLOAT NOT NULL,
    metric_unit VARCHAR(50),
    category VARCHAR(50), -- 'traffic', 'conversion', 'efficiency', 'queue', 'revenue'
    subcategory VARCHAR(50),
    benchmark_value FLOAT, -- Industry or historical benchmark
    benchmark_source VARCHAR(100),
    performance_score FLOAT, -- 0-100 score
    trend VARCHAR(20), -- 'improving', 'stable', 'declining'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_id, date, metric_name)
);

-- Indexes
CREATE INDEX idx_kpi_category ON kpi_metrics(sensor_id, category, date DESC);
CREATE INDEX idx_kpi_performance ON kpi_metrics(sensor_id, performance_score DESC);
```

#### `anomalies_detected`
```sql
CREATE TABLE anomalies_detected (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    anomaly_type VARCHAR(50), -- 'traffic_spike', 'unusual_pattern', 'sensor_issue', 'data_gap'
    severity FLOAT, -- 0-1 score
    confidence FLOAT, -- 0-1 confidence in detection
    affected_metric VARCHAR(100),
    affected_component VARCHAR(50), -- 'line1', 'region2', etc.
    expected_value FLOAT,
    actual_value FLOAT,
    deviation_percent FLOAT,
    deviation_stddev FLOAT, -- How many standard deviations
    context JSONB, -- Additional context data
    potential_causes JSONB, -- Array of possible causes
    recommended_actions JSONB,
    auto_resolved BOOLEAN DEFAULT false,
    manual_review_required BOOLEAN DEFAULT false,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_anomalies_timestamp ON anomalies_detected(sensor_id, detected_at DESC);
CREATE INDEX idx_anomalies_severity ON anomalies_detected(sensor_id, severity DESC);
CREATE INDEX idx_anomalies_review ON anomalies_detected(manual_review_required, auto_resolved);
```

### 4. **Supabase Functions for Real-time Calculations**

```sql
-- Function to calculate real-time occupancy
CREATE OR REPLACE FUNCTION calculate_current_occupancy(p_sensor_id UUID)
RETURNS TABLE(
    current_occupancy INTEGER,
    last_update TIMESTAMP WITH TIME ZONE,
    confidence VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_data AS (
        SELECT 
            timestamp,
            SUM(total_in) OVER (ORDER BY timestamp) - 
            SUM(total_out) OVER (ORDER BY timestamp) as occupancy
        FROM people_counting_raw
        WHERE sensor_id = p_sensor_id
        AND timestamp >= CURRENT_DATE
        ORDER BY timestamp DESC
        LIMIT 1
    )
    SELECT 
        COALESCE(occupancy, 0)::INTEGER,
        COALESCE(timestamp, CURRENT_TIMESTAMP),
        CASE 
            WHEN timestamp > CURRENT_TIMESTAMP - INTERVAL '5 minutes' THEN 'high'
            WHEN timestamp > CURRENT_TIMESTAMP - INTERVAL '15 minutes' THEN 'medium'
            ELSE 'low'
        END
    FROM recent_data;
END;
$$ LANGUAGE plpgsql;

-- Function to estimate queue length from regional data
CREATE OR REPLACE FUNCTION estimate_queue_metrics(p_sensor_id UUID, p_queue_region INTEGER DEFAULT 3)
RETURNS TABLE(
    queue_length INTEGER,
    estimated_wait_minutes FLOAT,
    queue_velocity FLOAT,
    recommendation TEXT
) AS $$
DECLARE
    v_current_count INTEGER;
    v_avg_service_rate FLOAT;
    v_historical_velocity FLOAT;
BEGIN
    -- Get current queue count
    SELECT region3_count INTO v_current_count
    FROM regional_counting_raw
    WHERE sensor_id = p_sensor_id
    ORDER BY timestamp DESC
    LIMIT 1;
    
    -- Calculate average service rate from historical data
    WITH velocity_calc AS (
        SELECT 
            AVG(ABS(region3_count - LAG(region3_count) OVER (ORDER BY timestamp))) as avg_change
        FROM regional_counting_raw
        WHERE sensor_id = p_sensor_id
        AND timestamp >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
    )
    SELECT avg_change INTO v_historical_velocity FROM velocity_calc;
    
    -- Estimate wait time (assuming 1 person per minute baseline)
    v_avg_service_rate := GREATEST(v_historical_velocity, 1);
    
    RETURN QUERY
    SELECT 
        COALESCE(v_current_count, 0),
        CASE 
            WHEN v_avg_service_rate > 0 THEN v_current_count / v_avg_service_rate
            ELSE v_current_count::FLOAT
        END,
        COALESCE(v_historical_velocity, 0),
        CASE 
            WHEN v_current_count > 20 THEN 'Open additional checkout lanes'
            WHEN v_current_count > 10 THEN 'Monitor queue closely'
            ELSE 'Queue at acceptable levels'
        END;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate automatic alerts
CREATE OR REPLACE FUNCTION check_thresholds_and_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_occupancy RECORD;
    v_queue RECORD;
    v_capacity_limit INTEGER := 500; -- Configure per store
    v_queue_threshold INTEGER := 15;
BEGIN
    -- Check occupancy
    SELECT * INTO v_occupancy FROM calculate_current_occupancy(NEW.sensor_id);
    
    IF v_occupancy.current_occupancy > v_capacity_limit * 0.9 THEN
        INSERT INTO alerts_generated (
            sensor_id, alert_type, severity, timestamp, title, message, 
            metrics, threshold_value, actual_value
        ) VALUES (
            NEW.sensor_id,
            'capacity',
            CASE 
                WHEN v_occupancy.current_occupancy >= v_capacity_limit THEN 'critical'
                ELSE 'warning'
            END,
            NOW(),
            'Capacity Alert',
            format('Current occupancy: %s (%.0f%% of capacity)', 
                   v_occupancy.current_occupancy, 
                   (v_occupancy.current_occupancy::FLOAT / v_capacity_limit * 100)),
            jsonb_build_object(
                'occupancy', v_occupancy.current_occupancy, 
                'limit', v_capacity_limit,
                'last_update', v_occupancy.last_update
            ),
            v_capacity_limit * 0.9,
            v_occupancy.current_occupancy
        );
    END IF;
    
    -- Check queue length if this is regional data
    IF TG_TABLE_NAME = 'regional_counting_raw' THEN
        SELECT * INTO v_queue FROM estimate_queue_metrics(NEW.sensor_id);
        
        IF v_queue.queue_length > v_queue_threshold THEN
            INSERT INTO alerts_generated (
                sensor_id, alert_type, severity, timestamp, title, message,
                metrics, threshold_value, actual_value
            ) VALUES (
                NEW.sensor_id,
                'queue',
                CASE 
                    WHEN v_queue.queue_length > v_queue_threshold * 2 THEN 'critical'
                    ELSE 'warning'
                END,
                NOW(),
                'Queue Alert',
                format('Queue length: %s people (est. %s min wait)',
                       v_queue.queue_length,
                       round(v_queue.estimated_wait_minutes)),
                jsonb_build_object(
                    'queue_length', v_queue.queue_length,
                    'wait_time', v_queue.estimated_wait_minutes,
                    'velocity', v_queue.queue_velocity
                ),
                v_queue_threshold,
                v_queue.queue_length
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_people_counting_alerts
AFTER INSERT ON people_counting_raw
FOR EACH ROW
EXECUTE FUNCTION check_thresholds_and_alert();

CREATE TRIGGER trigger_regional_alerts
AFTER INSERT ON regional_counting_raw
FOR EACH ROW
EXECUTE FUNCTION check_thresholds_and_alert();

-- Function to detect anomalies
CREATE OR REPLACE FUNCTION detect_anomalies()
RETURNS void AS $$
DECLARE
    v_sensor RECORD;
    v_current_hour_traffic INTEGER;
    v_historical_avg FLOAT;
    v_historical_stddev FLOAT;
    v_deviation FLOAT;
BEGIN
    -- Check each active sensor
    FOR v_sensor IN SELECT id FROM sensor_metadata WHERE is_active = true
    LOOP
        -- Get current hour traffic
        SELECT total_entries INTO v_current_hour_traffic
        FROM hourly_analytics
        WHERE sensor_id = v_sensor.id
        AND hour_start = DATE_TRUNC('hour', CURRENT_TIMESTAMP)
        LIMIT 1;
        
        -- Get historical average for this hour
        SELECT 
            AVG(total_entries) as avg_traffic,
            STDDEV(total_entries) as stddev_traffic
        INTO v_historical_avg, v_historical_stddev
        FROM hourly_analytics
        WHERE sensor_id = v_sensor.id
        AND EXTRACT(HOUR FROM hour_start) = EXTRACT(HOUR FROM CURRENT_TIMESTAMP)
        AND EXTRACT(DOW FROM hour_start) = EXTRACT(DOW FROM CURRENT_TIMESTAMP)
        AND hour_start < DATE_TRUNC('hour', CURRENT_TIMESTAMP);
        
        IF v_historical_avg IS NOT NULL AND v_historical_stddev > 0 THEN
            v_deviation := ABS(v_current_hour_traffic - v_historical_avg) / v_historical_stddev;
            
            -- If deviation is more than 3 standard deviations
            IF v_deviation > 3 THEN
                INSERT INTO anomalies_detected (
                    sensor_id, detected_at, anomaly_type, severity,
                    confidence, affected_metric, expected_value,
                    actual_value, deviation_stddev, context
                ) VALUES (
                    v_sensor.id,
                    CURRENT_TIMESTAMP,
                    'traffic_spike',
                    LEAST(v_deviation / 5, 1), -- Severity increases with deviation
                    LEAST(v_deviation / 3, 1), -- Confidence based on deviation
                    'hourly_traffic',
                    v_historical_avg,
                    v_current_hour_traffic,
                    v_deviation,
                    jsonb_build_object(
                        'hour', EXTRACT(HOUR FROM CURRENT_TIMESTAMP),
                        'day_of_week', EXTRACT(DOW FROM CURRENT_TIMESTAMP),
                        'historical_samples', 
                        (SELECT COUNT(*) FROM hourly_analytics 
                         WHERE sensor_id = v_sensor.id 
                         AND EXTRACT(HOUR FROM hour_start) = EXTRACT(HOUR FROM CURRENT_TIMESTAMP))
                    )
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 5. **Materialized Views for Performance**

```sql
-- Real-time dashboard view
CREATE MATERIALIZED VIEW mv_realtime_dashboard AS
SELECT 
    s.id as sensor_id,
    s.sensor_name,
    s.store_name,
    -- Current metrics
    (SELECT * FROM calculate_current_occupancy(s.id)) as occupancy,
    (SELECT * FROM estimate_queue_metrics(s.id)) as queue,
    -- Regional distribution
    (
        SELECT jsonb_build_object(
            'region1', r.region1_count,
            'region2', r.region2_count,
            'region3', r.region3_count,
            'region4', r.region4_count,
            'timestamp', r.timestamp
        )
        FROM regional_counting_raw r
        WHERE r.sensor_id = s.id
        ORDER BY r.timestamp DESC
        LIMIT 1
    ) as regional_distribution,
    -- Recent alerts
    (
        SELECT COUNT(*)
        FROM alerts_generated a
        WHERE a.sensor_id = s.id
        AND a.resolved = false
        AND a.timestamp >= NOW() - INTERVAL '1 hour'
    ) as active_alerts_count,
    -- Today's summary
    (
        SELECT jsonb_build_object(
            'total_visitors', d.total_visitors,
            'peak_hour', d.peak_hour,
            'conversion_rate', d.overall_conversion_rate
        )
        FROM daily_analytics d
        WHERE d.sensor_id = s.id
        AND d.date = CURRENT_DATE
    ) as today_summary,
    -- Last refresh
    NOW() as last_refresh
FROM sensor_metadata s
WHERE s.is_active = true;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_realtime_dashboard ON mv_realtime_dashboard(sensor_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_dashboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_realtime_dashboard;
END;
$$ LANGUAGE plpgsql;

-- Historical comparison view
CREATE MATERIALIZED VIEW mv_historical_comparison AS
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    )::DATE as date
),
sensor_daily AS (
    SELECT 
        s.id as sensor_id,
        s.sensor_name,
        ds.date,
        COALESCE(d.total_visitors, 0) as visitors,
        COALESCE(d.overall_conversion_rate, 0) as conversion_rate,
        COALESCE(d.avg_dwell_time_minutes, 0) as dwell_time
    FROM sensor_metadata s
    CROSS JOIN date_series ds
    LEFT JOIN daily_analytics d ON d.sensor_id = s.id AND d.date = ds.date
    WHERE s.is_active = true
)
SELECT 
    sensor_id,
    sensor_name,
    date,
    visitors,
    conversion_rate,
    dwell_time,
    -- Moving averages
    AVG(visitors) OVER (PARTITION BY sensor_id ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as visitors_7d_avg,
    AVG(conversion_rate) OVER (PARTITION BY sensor_id ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as conversion_7d_avg,
    -- Week over week
    LAG(visitors, 7) OVER (PARTITION BY sensor_id ORDER BY date) as visitors_prev_week,
    -- Trends
    CASE 
        WHEN visitors > LAG(visitors, 7) OVER (PARTITION BY sensor_id ORDER BY date) * 1.1 THEN 'up'
        WHEN visitors < LAG(visitors, 7) OVER (PARTITION BY sensor_id ORDER BY date) * 0.9 THEN 'down'
        ELSE 'stable'
    END as trend
FROM sensor_daily;

CREATE INDEX idx_mv_historical ON mv_historical_comparison(sensor_id, date DESC);
```

### 6. **Row Level Security (RLS) Policies**

```sql
-- Enable RLS
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts_generated ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization's sensors"
ON sensor_metadata FOR SELECT
USING (auth.uid() IN (
    SELECT user_id FROM user_sensor_access WHERE sensor_id = sensor_metadata.id
));

CREATE POLICY "Users can view their organization's data"
ON people_counting_raw FOR SELECT
USING (sensor_id IN (
    SELECT sensor_id FROM user_sensor_access WHERE user_id = auth.uid()
));

-- Similar policies for other tables...
```

## 🚀 **PHASE 3: ADVANCED INTEGRATION (DETAILED)**

### 1. **Stream to AI Services for Demographics (External)**

Since the Milesight camera doesn't provide demographics natively, we can enhance it by integrating external AI services:

#### Architecture:
```
Milesight Camera → Capture System → AI Service → Demographics Data → Database
```

#### Implementation Approach:

**Option A: Using RTSP Stream with OpenCV**
```python
import cv2
import asyncio
from datetime import datetime
import aiohttp

class DemographicsEnhancer:
    def __init__(self, rtsp_url, ai_service_config):
        self.rtsp_url = rtsp_url
        self.ai_service = ai_service_config
        self.capture_interval = 300  # Every 5 minutes
        
    async def capture_and_analyze(self):
        """Capture frame and send to AI service"""
        cap = cv2.VideoCapture(self.rtsp_url)
        
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                # Save frame temporarily
                timestamp = datetime.now()
                filename = f"frame_{timestamp.timestamp()}.jpg"
                cv2.imwrite(filename, frame)
                
                # Send to AI service
                demographics = await self.analyze_demographics(filename)
                
                # Store results
                await self.store_demographics(demographics, timestamp)
                
            cap.release()
    
    async def analyze_demographics(self, image_path):
        """Send image to AI service for analysis"""
        # Example using a generic AI API
        async with aiohttp.ClientSession() as session:
            with open(image_path, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('image', f, filename='frame.jpg')
                
                async with session.post(
                    self.ai_service['url'],
                    data=data,
                    headers={'Authorization': f"Bearer {self.ai_service['api_key']}"}
                ) as resp:
                    return await resp.json()
```

**Option B: Using ONVIF Protocol**
```python
from onvif import ONVIFCamera
import zeep

class ONVIFDemographicsCapture:
    def __init__(self, host, port, user, password):
        self.camera = ONVIFCamera(host, port, user, password)
        
    def get_snapshot_uri(self):
        """Get snapshot URI using ONVIF"""
        media_service = self.camera.create_media_service()
        profiles = media_service.GetProfiles()
        
        if profiles:
            # Get snapshot URI for first profile
            snapshot_uri = media_service.GetSnapshotUri({
                'ProfileToken': profiles[0].token
            })
            return snapshot_uri.Uri
    
    async def capture_demographics_snapshot(self):
        """Capture snapshot and analyze"""
        snapshot_uri = self.get_snapshot_uri()
        
        # Download snapshot
        async with aiohttp.ClientSession() as session:
            async with session.get(
                snapshot_uri,
                auth=aiohttp.BasicAuth(self.user, self.password)
            ) as resp:
                image_data = await resp.read()
                
        # Analyze with AI
        return await self.send_to_ai_service(image_data)
```

**Demographics Database Schema:**
```sql
CREATE TABLE demographics_analysis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    capture_method VARCHAR(50), -- 'rtsp', 'onvif', 'http'
    sample_image_url TEXT,
    -- Demographics data
    total_faces_detected INTEGER,
    male_count INTEGER,
    female_count INTEGER,
    age_0_15 INTEGER DEFAULT 0,
    age_16_25 INTEGER DEFAULT 0,
    age_26_35 INTEGER DEFAULT 0,
    age_36_50 INTEGER DEFAULT 0,
    age_51_65 INTEGER DEFAULT 0,
    age_65_plus INTEGER DEFAULT 0,
    -- Aggregated metrics
    avg_age FLOAT,
    gender_ratio FLOAT, -- male/female ratio
    dominant_age_group VARCHAR(20),
    -- Emotions (if available)
    emotion_data JSONB, -- {"happy": 0.6, "neutral": 0.3, ...}
    dominant_emotion VARCHAR(50),
    -- AI service metadata
    ai_service_used VARCHAR(50),
    ai_model_version VARCHAR(50),
    confidence_score FLOAT,
    processing_time_ms INTEGER,
    api_cost DECIMAL(10,4),
    -- Correlation with counting
    correlated_people_count INTEGER,
    correlation_confidence FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Aggregated demographics view
CREATE MATERIALIZED VIEW mv_demographics_summary AS
SELECT 
    sensor_id,
    DATE(timestamp) as date,
    -- Gender distribution
    SUM(male_count) as total_male,
    SUM(female_count) as total_female,
    CASE 
        WHEN SUM(female_count) > 0 
        THEN SUM(male_count)::FLOAT / SUM(female_count)
        ELSE NULL 
    END as gender_ratio,
    -- Age distribution
    SUM(age_0_15) as total_children,
    SUM(age_16_25 + age_26_35) as total_young_adults,
    SUM(age_36_50 + age_51_65) as total_adults,
    SUM(age_65_plus) as total_seniors,
    -- Averages
    AVG(avg_age) as avg_age_overall,
    -- Most common emotion
    MODE() WITHIN GROUP (ORDER BY dominant_emotion) as most_common_emotion,
    -- Sample coverage
    COUNT(*) as sample_count,
    SUM(total_faces_detected) as total_faces_analyzed
FROM demographics_analysis
GROUP BY sensor_id, DATE(timestamp);
```

### 2. **Implement Video-Based Queue Detection**

Transform regional counting into intelligent queue analytics using video analysis:

#### Approach 1: Pure Computer Vision
```python
import cv2
import numpy as np
from collections import deque
import torch

class VideoQueueDetector:
    def __init__(self, video_source, queue_region_coords):
        self.video_source = video_source
        self.queue_region = queue_region_coords  # (x1, y1, x2, y2)
        self.person_detector = self.load_yolo_model()
        self.queue_history = deque(maxlen=30)  # 30 frames history
        
    def load_yolo_model(self):
        """Load YOLO for person detection"""
        model = torch.hub.load('ultralytics/yolov5', 'yolov5s')
        model.classes = [0]  # Only detect persons
        return model
    
    def detect_queue_properties(self, frame):
        """Detect queue characteristics from frame"""
        # Crop to queue region
        x1, y1, x2, y2 = self.queue_region
        queue_frame = frame[y1:y2, x1:x2]
        
        # Detect people
        results = self.person_detector(queue_frame)
        detections = results.pandas().xyxy[0]
        
        # Analyze queue formation
        queue_metrics = {
            'person_count': len(detections),
            'queue_density': self.calculate_density(detections, queue_frame.shape),
            'queue_organization': self.analyze_organization(detections),
            'movement_detected': self.detect_movement(queue_frame),
            'estimated_wait_time': self.estimate_wait_time(len(detections))
        }
        
        return queue_metrics
    
    def calculate_density(self, detections, frame_shape):
        """Calculate how densely packed the queue is"""
        if len(detections) == 0:
            return 0
            
        total_area = frame_shape[0] * frame_shape[1]
        person_area = sum(
            (row.xmax - row.xmin) * (row.ymax - row.ymin) 
            for _, row in detections.iterrows()
        )
        
        return person_area / total_area
    
    def analyze_organization(self, detections):
        """Analyze how organized the queue is (line formation)"""
        if len(detections) < 3:
            return 1.0  # Too few people to determine
            
        # Get center points of all detections
        centers = []
        for _, detection in detections.iterrows():
            cx = (detection.xmin + detection.xmax) / 2
            cy = (detection.ymin + detection.ymax) / 2
            centers.append((cx, cy))
        
        # Fit a line and calculate variance
        centers = np.array(centers)
        if len(centers) > 2:
            # Fit line using least squares
            vx, vy, x0, y0 = cv2.fitLine(centers, cv2.DIST_L2, 0, 0.01, 0.01)
            
            # Calculate distances from line
            distances = []
            for point in centers:
                dist = abs((point[1] - y0) * vx - (point[0] - x0) * vy)
                distances.append(dist)
            
            # Lower variance = more organized
            organization_score = 1 / (1 + np.std(distances) / 100)
            return organization_score
        
        return 0.5
    
    def detect_movement(self, current_frame):
        """Detect if queue is moving"""
        if len(self.queue_history) > 0:
            # Compare with previous frame
            prev_frame = self.queue_history[-1]
            
            # Calculate frame difference
            diff = cv2.absdiff(current_frame, prev_frame)
            movement_score = np.mean(diff) / 255.0
            
            self.queue_history.append(current_frame.copy())
            return movement_score > 0.02  # Threshold for movement
        
        self.queue_history.append(current_frame.copy())
        return False
    
    def estimate_wait_time(self, queue_length):
        """Estimate wait time based on queue length and movement"""
        # Base estimation: 1.5 minutes per person
        base_wait = queue_length * 1.5
        
        # Adjust based on movement history
        if len(self.queue_history) > 10:
            movement_rate = sum(1 for _ in range(10) if self.detect_movement(self.queue_history[-1])) / 10
            if movement_rate > 0.5:
                base_wait *= 0.8  # Queue moving well
            elif movement_rate < 0.2:
                base_wait *= 1.5  # Queue stalled
        
        return base_wait
```

#### Approach 2: Hybrid ML + Regional Data
```python
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import joblib

class HybridQueueAnalyzer:
    def __init__(self, sensor_id):
        self.sensor_id = sensor_id
        self.model = self.load_or_train_model()
        self.scaler = StandardScaler()
        
    def load_or_train_model(self):
        """Load existing model or train new one"""
        try:
            return joblib.load(f'queue_model_{self.sensor_id}.pkl')
        except:
            return self.train_queue_model()
    
    def train_queue_model(self):
        """Train ML model on historical data"""
        # Get historical data
        query = """
        SELECT 
            r.timestamp,
            r.region3_count as queue_region_count,
            r.region2_count as approach_region_count,
            EXTRACT(HOUR FROM r.timestamp) as hour,
            EXTRACT(DOW FROM r.timestamp) as day_of_week,
            p.total_in - p.total_out as net_flow,
            LAG(r.region3_count, 1) OVER (ORDER BY r.timestamp) as prev_queue_count,
            -- Add actual queue length here if available from ground truth
            COALESCE(q.actual_queue_length, r.region3_count * 0.7) as actual_queue_length
        FROM regional_counting_raw r
        JOIN people_counting_raw p ON p.sensor_id = r.sensor_id 
            AND p.timestamp = r.timestamp
        LEFT JOIN queue_ground_truth q ON q.sensor_id = r.sensor_id 
            AND q.timestamp = r.timestamp
        WHERE r.sensor_id = %s
        AND r.timestamp > CURRENT_DATE - INTERVAL '30 days'
        """
        
        df = pd.read_sql(query, connection, params=[self.sensor_id])
        
        # Feature engineering
        features = [
            'queue_region_count', 'approach_region_count', 
            'hour', 'day_of_week', 'net_flow', 'prev_queue_count'
        ]
        
        X = df[features]
        y = df['actual_queue_length']
        
        # Train model
        self.scaler.fit(X)
        X_scaled = self.scaler.transform(X)
        
        model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            random_state=42
        )
        model.fit(X_scaled, y)
        
        # Save model
        joblib.dump(model, f'queue_model_{self.sensor_id}.pkl')
        joblib.dump(self.scaler, f'queue_scaler_{self.sensor_id}.pkl')
        
        return model
    
    def predict_queue_metrics(self, current_data):
        """Predict queue metrics from current sensor data"""
        features = self.extract_features(current_data)
        features_scaled = self.scaler.transform([features])
        
        predicted_length = self.model.predict(features_scaled)[0]
        
        # Calculate additional metrics
        wait_time = self.calculate_wait_time(predicted_length, current_data)
        abandonment_risk = self.calculate_abandonment_risk(predicted_length, wait_time)
        optimal_lanes = self.calculate_optimal_lanes(predicted_length)
        
        return {
            'predicted_queue_length': int(predicted_length),
            'confidence_interval': self.get_prediction_interval(features_scaled),
            'estimated_wait_time': wait_time,
            'abandonment_risk': abandonment_risk,
            'recommended_open_lanes': optimal_lanes,
            'queue_velocity': self.calculate_velocity(current_data),
            'congestion_level': self.categorize_congestion(predicted_length)
        }
    
    def calculate_wait_time(self, queue_length, current_data):
        """Advanced wait time calculation"""
        # Base service rate from historical data
        base_rate = 0.8  # customers per minute
        
        # Adjust for time of day
        hour = current_data['timestamp'].hour
        if hour in [12, 13, 18, 19]:  # Peak hours
            base_rate *= 0.7
        elif hour in [10, 11, 14, 15, 16, 17]:  # Normal hours
            base_rate *= 0.9
        else:  # Off-peak
            base_rate *= 1.2
        
        # Adjust for staff (if integrated with staff scheduling)
        # staff_multiplier = self.get_staff_multiplier(current_data['timestamp'])
        # base_rate *= staff_multiplier
        
        return queue_length / base_rate
    
    def calculate_abandonment_risk(self, queue_length, wait_time):
        """Calculate risk of customers leaving the queue"""
        # Based on research: abandonment increases significantly after 10 minutes
        if wait_time <= 5:
            base_risk = 0.05
        elif wait_time <= 10:
            base_risk = 0.15
        elif wait_time <= 15:
            base_risk = 0.35
        else:
            base_risk = 0.60
        
        # Adjust for queue length perception
        if queue_length > 20:
            base_risk *= 1.3
        
        return min(base_risk, 0.95)
    
    def calculate_optimal_lanes(self, queue_length):
        """Calculate optimal number of checkout lanes"""
        # Target: max 5 minute wait time
        target_wait = 5
        service_rate_per_lane = 0.8
        
        required_lanes = max(1, int(np.ceil(queue_length / (target_wait * service_rate_per_lane))))
        
        return min(required_lanes, 10)  # Maximum physical lanes
```

**Queue Analytics Database Schema:**
```sql
CREATE TABLE queue_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    analysis_type VARCHAR(50), -- 'video', 'ml_prediction', 'hybrid'
    
    -- Queue measurements
    measured_queue_length INTEGER,
    predicted_queue_length FLOAT,
    confidence_lower FLOAT,
    confidence_upper FLOAT,
    prediction_confidence FLOAT,
    
    -- Queue characteristics
    queue_density FLOAT, -- 0-1 scale
    organization_score FLOAT, -- 0-1, how well-formed the line is
    movement_detected BOOLEAN,
    queue_velocity FLOAT, -- people per minute through queue
    
    -- Wait time estimates
    estimated_wait_time_minutes FLOAT,
    wait_time_confidence FLOAT,
    
    -- Risk metrics
    abandonment_risk_score FLOAT, -- 0-1 probability
    congestion_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Recommendations
    recommended_open_lanes INTEGER,
    recommended_staff INTEGER,
    suggested_actions JSONB, -- Array of action items
    
    -- Video analysis metadata (if used)
    frame_analyzed BOOLEAN DEFAULT false,
    people_detected INTEGER,
    detection_confidence FLOAT,
    
    -- Performance tracking
    actual_wait_time FLOAT, -- Filled in later for model training
    prediction_accuracy FLOAT, -- Calculated when actual is known
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Queue performance summary
CREATE TABLE queue_performance_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id UUID REFERENCES sensor_metadata(id),
    date DATE NOT NULL,
    
    -- Daily statistics
    avg_queue_length FLOAT,
    max_queue_length INTEGER,
    total_queue_time_minutes FLOAT,
    
    -- Wait time stats
    avg_wait_time FLOAT,
    max_wait_time FLOAT,
    wait_time_90th_percentile FLOAT,
    
    -- Service metrics
    avg_service_rate FLOAT, -- customers per minute
    total_customers_served INTEGER,
    abandonment_count INTEGER,
    abandonment_rate FLOAT,
    
    -- Efficiency scores
    queue_efficiency_score FLOAT, -- 0-100
    staff_efficiency_score FLOAT,
    
    -- Recommendations implemented
    recommendations_generated INTEGER,
    recommendations_followed INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(sensor_id, date)
);
```

### 3. **Create Multi-Camera Coordination Layer**

Coordinate multiple Milesight cameras for complete store coverage:

#### Architecture:
```python
class MultiCameraCoordinator:
    def __init__(self, camera_configs):
        """
        camera_configs = {
            'entrance': {'ip': '192.168.1.101', 'port': 80, 'role': 'entrance'},
            'dept_a': {'ip': '192.168.1.102', 'port': 80, 'role': 'department'},
            'checkout': {'ip': '192.168.1.103', 'port': 80, 'role': 'checkout'}
        }
        """
        self.cameras = {}
        self.initialize_cameras(camera_configs)
        self.journey_tracker = JourneyTracker()
        
    def initialize_cameras(self, configs):
        """Initialize all camera connections"""
        for camera_id, config in configs.items():
            self.cameras[camera_id] = {
                'connector': MilesightConnector(config['ip'], config['port']),
                'role': config['role'],
                'last_data': None,
                'zone_mapping': self.get_zone_mapping(camera_id)
            }
    
    def get_zone_mapping(self, camera_id):
        """Define what each camera region represents"""
        mappings = {
            'entrance': {
                1: 'outside',
                2: 'lobby',
                3: 'info_desk',
                4: 'entrance_retail'
            },
            'dept_a': {
                1: 'electronics_entry',
                2: 'electronics_main',
                3: 'electronics_premium',
                4: 'electronics_checkout'
            },
            'checkout': {
                1: 'queue_start',
                2: 'queue_middle',
                3: 'checkout_active',
                4: 'exit'
            }
        }
        return mappings.get(camera_id, {})
    
    async def collect_synchronized_data(self):
        """Collect data from all cameras in sync"""
        timestamp = datetime.now()
        tasks = []
        
        for camera_id, camera_info in self.cameras.items():
            task = self.collect_camera_data(camera_id, timestamp)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # Combine results
        unified_data = {
            'timestamp': timestamp,
            'cameras': dict(zip(self.cameras.keys(), results)),
            'store_totals': self.calculate_store_totals(results)
        }
        
        return unified_data
    
    async def collect_camera_data(self, camera_id, timestamp):
        """Collect data from single camera"""
        camera = self.cameras[camera_id]['connector']
        
        # Get data for last hour
        start_time = timestamp - timedelta(hours=1)
        data = await camera.async_collect_data(start_time, timestamp)
        
        return {
            'camera_id': camera_id,
            'role': self.cameras[camera_id]['role'],
            'people_counting': data.get('people_counting', []),
            'regional_counting': data.get('regional_counting', []),
            'current_occupancy': self.calculate_camera_occupancy(data)
        }
    
    def calculate_store_totals(self, camera_data_list):
        """Calculate store-wide metrics avoiding double counting"""
        total_entries = 0
        total_exits = 0
        zone_occupancy = {}
        
        for data in camera_data_list:
            camera_id = data['camera_id']
            role = data['role']
            
            # Only count entries/exits at entrance cameras
            if role == 'entrance' and data['people_counting']:
                latest = data['people_counting'][-1]
                total_entries += latest.get('total_in', 0)
                total_exits += latest.get('total_out', 0)
            
            # Aggregate zone occupancy
            if data['regional_counting']:
                latest_regional = data['regional_counting'][-1]
                zone_mapping = self.cameras[camera_id]['zone_mapping']
                
                for region_num in range(1, 5):
                    zone_name = zone_mapping.get(region_num, f"{camera_id}_r{region_num}")
                    count = latest_regional.get(f'region{region_num}_count', 0)
                    zone_occupancy[zone_name] = count
        
        return {
            'total_entries': total_entries,
            'total_exits': total_exits,
            'net_occupancy': total_entries - total_exits,
            'zone_occupancy': zone_occupancy,
            'active_zones': len([z for z, count in zone_occupancy.items() if count > 0])
        }
    
    def track_customer_journeys(self, time_window_minutes=5):
        """Track customer movement across cameras"""
        journeys = []
        
        # Get recent entry events
        entrance_data = self.cameras['entrance']['last_data']
        if not entrance_data:
            return journeys
        
        entries = self.extract_entry_events(entrance_data, time_window_minutes)
        
        for entry in entries:
            journey = {
                'id': self.generate_journey_id(entry['timestamp']),
                'entry_time': entry['timestamp'],
                'entry_count': entry['count'],
                'path': [{'camera': 'entrance', 'zone': 'lobby', 'time': entry['timestamp']}]
            }
            
            # Track through other cameras
            journey['path'].extend(self.trace_journey_path(entry['timestamp']))
            
            # Determine if completed (reached checkout/exit)
            journey['completed'] = any(p['zone'] == 'exit' for p in journey['path'])
            journey['total_duration'] = self.calculate_journey_duration(journey['path'])
            
            journeys.append(journey)
        
        return journeys
    
    def detect_cross_camera_patterns(self):
        """Detect patterns across multiple cameras"""
        patterns = {
            'popular_paths': self.analyze_popular_paths(),
            'bottlenecks': self.detect_bottlenecks(),
            'flow_efficiency': self.calculate_flow_efficiency(),
            'zone_transitions': self.analyze_zone_transitions()
        }
        
        return patterns
    
    def analyze_popular_paths(self, days=7):
        """Analyze most common paths through store"""
        query = """
        WITH journey_paths AS (
            SELECT 
                journey_path,
                COUNT(*) as frequency,
                AVG(total_duration_minutes) as avg_duration,
                AVG(CASE WHEN conversion THEN 1 ELSE 0 END) as conversion_rate
            FROM customer_journeys
            WHERE entry_time > CURRENT_DATE - INTERVAL '%s days'
            GROUP BY journey_path
        )
        SELECT 
            journey_path,
            frequency,
            avg_duration,
            conversion_rate,
            frequency::FLOAT / SUM(frequency) OVER () as percentage
        FROM journey_paths
        ORDER BY frequency DESC
        LIMIT 10
        """
        
        return pd.read_sql(query, connection, params=[days])
    
    def detect_bottlenecks(self):
        """Identify areas where flow is constrained"""
        bottlenecks = []
        
        for camera_id, camera_info in self.cameras.items():
            if camera_info['last_data'] and camera_info['last_data']['regional_counting']:
                regional = camera_info['last_data']['regional_counting'][-1]
                
                for region_num in range(1, 5):
                    count = regional.get(f'region{region_num}_count', 0)
                    zone_name = camera_info['zone_mapping'].get(region_num)
                    
                    # Check if zone is overcrowded
                    if count > self.get_zone_capacity(zone_name) * 0.8:
                        bottlenecks.append({
                            'camera': camera_id,
                            'zone': zone_name,
                            'occupancy': count,
                            'severity': 'high' if count > self.get_zone_capacity(zone_name) else 'medium'
                        })
        
        return bottlenecks
```

**Multi-Camera Database Schema:**
```sql
-- Camera network configuration
CREATE TABLE camera_network (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_name VARCHAR(255) NOT NULL,
    store_id UUID,
    total_cameras INTEGER,
    configuration JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Individual camera registration
CREATE TABLE camera_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES camera_network(id),
    camera_id UUID REFERENCES sensor_metadata(id),
    camera_role VARCHAR(50), -- 'entrance', 'department', 'checkout', 'exit'
    camera_position VARCHAR(50), -- 'main_entrance', 'north_wing', etc.
    coverage_zones JSONB, -- Detailed zone mapping
    overlapping_coverage JSONB, -- Other cameras with overlapping views
    coordinate_system JSONB, -- For spatial mapping
    is_primary BOOLEAN DEFAULT false, -- Primary for role
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unified store metrics
CREATE TABLE unified_store_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES camera_network(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Store-wide counts
    total_occupancy INTEGER,
    total_entries INTEGER,
    total_exits INTEGER,
    
    -- Zone distribution
    zone_occupancy JSONB, -- {"electronics": 45, "clothing": 23, ...}
    active_zones INTEGER,
    crowded_zones JSONB, -- Zones above threshold
    
    -- Flow metrics
    inter_camera_transitions INTEGER,
    avg_journey_time_minutes FLOAT,
    completion_rate FLOAT,
    
    -- System health
    active_cameras INTEGER,
    camera_sync_delay_ms INTEGER,
    data_quality_score FLOAT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer journey tracking
CREATE TABLE customer_journeys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journey_id VARCHAR(100) UNIQUE NOT NULL,
    network_id UUID REFERENCES camera_network(id),
    
    -- Journey timeline
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    total_duration_minutes FLOAT,
    
    -- Journey details
    entry_camera UUID REFERENCES sensor_metadata(id),
    exit_camera UUID REFERENCES sensor_metadata(id),
    cameras_visited INTEGER,
    zones_visited INTEGER,
    
    -- Path data
    journey_path JSONB, -- Array of {camera_id, zone, timestamp, duration}
    path_efficiency_score FLOAT, -- How direct the path was
    
    -- Business metrics
    conversion BOOLEAN DEFAULT false,
    purchase_amount DECIMAL(10,2), -- If integrated with POS
    items_purchased INTEGER,
    
    -- Journey classification
    journey_type VARCHAR(50), -- 'browse', 'targeted', 'comparison'
    customer_segment VARCHAR(50), -- If identifiable
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cross-camera flow analysis
CREATE TABLE camera_flow_matrix (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES camera_network(id),
    date DATE NOT NULL,
    from_camera UUID REFERENCES sensor_metadata(id),
    to_camera UUID REFERENCES sensor_metadata(id),
    
    -- Flow metrics
    transition_count INTEGER,
    avg_transition_time_seconds FLOAT,
    peak_flow_hour TIME,
    
    -- Flow characteristics
    flow_type VARCHAR(50), -- 'direct', 'browsing', 'returning'
    conversion_impact FLOAT, -- How this flow affects conversion
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(network_id, date, from_camera, to_camera)
);

-- Pattern detection results
CREATE TABLE multi_camera_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES camera_network(id),
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    pattern_type VARCHAR(50), -- 'popular_path', 'bottleneck', 'anomaly'
    
    -- Pattern details
    pattern_name VARCHAR(255),
    description TEXT,
    affected_cameras JSONB, -- Array of camera IDs
    affected_zones JSONB,
    
    -- Pattern metrics
    frequency INTEGER,
    impact_score FLOAT, -- 0-1, business impact
    confidence FLOAT, -- 0-1, detection confidence
    
    -- Insights
    insights JSONB,
    recommended_actions JSONB,
    
    -- Tracking
    first_detected TIMESTAMP WITH TIME ZONE,
    last_detected TIMESTAMP WITH TIME ZONE,
    occurrence_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time coordination status
CREATE TABLE camera_coordination_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    network_id UUID REFERENCES camera_network(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Coordination health
    sync_status VARCHAR(20), -- 'synchronized', 'degraded', 'failed'
    max_sync_delay_ms INTEGER,
    cameras_in_sync INTEGER,
    cameras_total INTEGER,
    
    -- Data quality
    data_completeness_score FLOAT, -- 0-1
    missing_data_cameras JSONB,
    
    -- Performance
    processing_time_ms INTEGER,
    coordination_efficiency FLOAT, -- 0-1
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 4. **Advanced Analytics Functions**

```sql
-- Function to calculate complete customer journey
CREATE OR REPLACE FUNCTION analyze_customer_journey(
    p_network_id UUID,
    p_entry_time TIMESTAMP WITH TIME ZONE,
    p_time_window INTERVAL DEFAULT INTERVAL '2 hours'
)
RETURNS TABLE(
    journey_id VARCHAR,
    path JSONB,
    duration_minutes FLOAT,
    zones_visited INTEGER,
    conversion BOOLEAN,
    journey_score FLOAT
) AS $$
DECLARE
    v_journey_id VARCHAR;
    v_path JSONB;
    v_current_camera UUID;
    v_current_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Generate journey ID
    v_journey_id := 'J_' || EXTRACT(EPOCH FROM p_entry_time)::TEXT;
    v_current_time := p_entry_time;
    v_path := '[]'::JSONB;
    
    -- Track movement through cameras
    FOR v_current_camera IN 
        SELECT DISTINCT camera_id 
        FROM camera_registry 
        WHERE network_id = p_network_id
        ORDER BY camera_role
    LOOP
        -- Check for activity in this camera within time window
        WITH camera_activity AS (
            SELECT 
                r.timestamp,
                r.region1_count + r.region2_count + r.region3_count + r.region4_count as total_activity,
                c.coverage_zones
            FROM regional_counting_raw r
            JOIN camera_registry c ON c.camera_id = r.sensor_id
            WHERE r.sensor_id = v_current_camera
            AND r.timestamp BETWEEN v_current_time AND v_current_time + INTERVAL '30 minutes'
            AND total_activity > 0
            ORDER BY r.timestamp
            LIMIT 1
        )
        SELECT 
            jsonb_build_object(
                'camera_id', v_current_camera,
                'timestamp', timestamp,
                'zones', coverage_zones,
                'activity', total_activity
            )
        INTO v_path
        FROM camera_activity;
        
        -- Update current time
        v_current_time := (v_path->>'timestamp')::TIMESTAMP WITH TIME ZONE;
    END LOOP;
    
    -- Return journey analysis
    RETURN QUERY
    SELECT 
        v_journey_id,
        v_path,
        EXTRACT(EPOCH FROM (v_current_time - p_entry_time)) / 60,
        jsonb_array_length(v_path),
        (v_path @> '[{"zones": {"checkout": true}}]'),
        CASE 
            WHEN jsonb_array_length(v_path) > 3 THEN 0.8
            ELSE 0.5
        END;
END;
$$ LANGUAGE plpgsql;

-- Function to detect multi-camera anomalies
CREATE OR REPLACE FUNCTION detect_multi_camera_anomalies(p_network_id UUID)
RETURNS TABLE(
    anomaly_type VARCHAR,
    severity FLOAT,
    affected_cameras JSONB,
    description TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    -- Check for camera synchronization issues
    RETURN QUERY
    WITH sync_check AS (
        SELECT 
            c.camera_id,
            MAX(p.timestamp) as last_data,
            CURRENT_TIMESTAMP - MAX(p.timestamp) as data_age
        FROM camera_registry c
        LEFT JOIN people_counting_raw p ON p.sensor_id = c.camera_id
            AND p.timestamp > CURRENT_TIMESTAMP - INTERVAL '10 minutes'
        WHERE c.network_id = p_network_id
        GROUP BY c.camera_id
    )
    SELECT 
        'sync_issue'::VARCHAR,
        CASE 
            WHEN COUNT(*) FILTER (WHERE data_age > INTERVAL '5 minutes') > 2 THEN 0.9
            WHEN COUNT(*) FILTER (WHERE data_age > INTERVAL '5 minutes') > 0 THEN 0.6
            ELSE 0.3
        END,
        jsonb_agg(camera_id) FILTER (WHERE data_age > INTERVAL '5 minutes'),
        'Multiple cameras not reporting data',
        'Check camera connections and data collection service';
    
    -- Check for unusual flow patterns
    RETURN QUERY
    WITH flow_analysis AS (
        SELECT 
            from_camera,
            to_camera,
            transition_count,
            AVG(transition_count) OVER (PARTITION BY from_camera, to_camera) as avg_transitions,
            STDDEV(transition_count) OVER (PARTITION BY from_camera, to_camera) as stddev_transitions
        FROM camera_flow_matrix
        WHERE network_id = p_network_id
        AND date = CURRENT_DATE
    )
    SELECT 
        'unusual_flow'::VARCHAR,
        LEAST(ABS(transition_count - avg_transitions) / NULLIF(stddev_transitions, 0) / 5, 1),
        jsonb_build_array(from_camera, to_camera),
        format('Unusual flow between cameras: %s transitions (normal: %s)',
               transition_count, ROUND(avg_transitions)),
        'Investigate potential routing changes or obstructions'
    FROM flow_analysis
    WHERE ABS(transition_count - avg_transitions) > 3 * stddev_transitions;
END;
$$ LANGUAGE plpgsql;
```

This comprehensive implementation guide provides:

1. **Complete database schema** for storing all raw and processed data
2. **Advanced analytics tables** for insights and predictions
3. **Real-time functions** for calculations and alerts
4. **Detailed Phase 3 integration** approaches with code examples
5. **Multi-camera coordination** architecture and implementation

The system can grow from basic counting to advanced AI-powered analytics while maintaining data integrity and performance.