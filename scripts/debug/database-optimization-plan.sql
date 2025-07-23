-- DATABASE OPTIMIZATION PLAN FOR RETAIL PLATFORM
-- Generated: 2025-07-23
-- This script provides a comprehensive optimization strategy

-- ============================================================
-- PHASE 1: IMMEDIATE FIXES (Critical Issues)
-- ============================================================

-- 1.1 Fix sensor_id NULL issue
-- First, update existing sensors with proper IDs
UPDATE sensor_metadata 
SET sensor_id = CASE 
    WHEN store_id = 'd719cc6b-1715-4721-8897-6f6cd0c025b0' THEN 'OML01-SENSOR-001'
    WHEN store_id = 'dfee65ba-cfde-45f7-8123-473ad3dee210' THEN 'OML02-SENSOR-001'
    WHEN store_id = '768ea7d2-5649-4ce5-8c9b-165d05525e92' THEN 'OML03-SENSOR-001'
    WHEN store_id = 'e3c26903-7da5-4b09-9d43-abf93cd09f74' THEN 'JJ01-SENSOR-001'
END
WHERE sensor_id IS NULL;

-- Add NOT NULL constraint
ALTER TABLE sensor_metadata 
ALTER COLUMN sensor_id SET NOT NULL;

-- Create unique index
CREATE UNIQUE INDEX idx_sensor_metadata_sensor_id 
ON sensor_metadata(sensor_id);

-- 1.2 Fix data aggregation mismatch
-- Create a function to recalculate daily analytics
CREATE OR REPLACE FUNCTION recalculate_daily_analytics(target_date DATE)
RETURNS void AS $$
BEGIN
    DELETE FROM daily_analytics WHERE date = target_date;
    
    INSERT INTO daily_analytics (
        organization_id, store_id, sensor_id, date,
        total_in, total_out, net_traffic,
        peak_hour, peak_hour_traffic,
        hourly_in, hourly_out,
        avg_hourly_in, avg_hourly_out,
        business_hours_in, business_hours_out
    )
    SELECT 
        organization_id,
        store_id,
        sensor_id,
        date,
        SUM(total_in) as total_in,
        SUM(total_out) as total_out,
        SUM(total_in) - SUM(total_out) as net_traffic,
        (SELECT hour FROM hourly_analytics h2 
         WHERE h2.store_id = h1.store_id AND h2.date = h1.date 
         ORDER BY (total_in + total_out) DESC LIMIT 1) as peak_hour,
        (SELECT (total_in + total_out) FROM hourly_analytics h2 
         WHERE h2.store_id = h1.store_id AND h2.date = h1.date 
         ORDER BY (total_in + total_out) DESC LIMIT 1) as peak_hour_traffic,
        array_agg(COALESCE(total_in, 0) ORDER BY hour) as hourly_in,
        array_agg(COALESCE(total_out, 0) ORDER BY hour) as hourly_out,
        AVG(total_in)::int as avg_hourly_in,
        AVG(total_out)::int as avg_hourly_out,
        SUM(CASE WHEN hour BETWEEN 10 AND 20 THEN total_in ELSE 0 END) as business_hours_in,
        SUM(CASE WHEN hour BETWEEN 10 AND 20 THEN total_out ELSE 0 END) as business_hours_out
    FROM hourly_analytics h1
    WHERE date = target_date
    GROUP BY organization_id, store_id, sensor_id, date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PHASE 2: TABLE CONSOLIDATION
-- ============================================================

-- 2.1 Merge people_counting tables using a view
CREATE OR REPLACE VIEW people_counting_unified AS
SELECT 
    r.id,
    r.sensor_id,
    r.organization_id,
    r.store_id,
    r.timestamp,
    r.line1_in, r.line1_out,
    r.line2_in, r.line2_out,
    r.line3_in, r.line3_out,
    r.line4_in, r.line4_out,
    r.total_in,
    r.total_out,
    r.total_in - r.total_out as net_flow,
    -- Add processed data columns
    COALESCE(p.passing_traffic, r.line4_in + r.line4_out) as passing_traffic,
    COALESCE(p.passing_in, r.line4_in) as passing_in,
    COALESCE(p.passing_out, r.line4_out) as passing_out,
    COALESCE(p.capture_rate, 
        CASE 
            WHEN (r.line4_in + r.line4_out) > 0 
            THEN (r.total_in::float / (r.line4_in + r.line4_out) * 100)
            ELSE 0 
        END
    ) as capture_rate,
    COALESCE(p.dominant_direction,
        CASE 
            WHEN r.total_in > r.total_out THEN 'in'
            WHEN r.total_out > r.total_in THEN 'out'
            ELSE 'balanced'
        END
    ) as dominant_direction,
    COALESCE(p.data_quality, 100) as data_quality,
    COALESCE(p.processing_flags, '{}'::jsonb) as processing_flags,
    r.created_at,
    COALESCE(p.updated_at, r.created_at) as updated_at
FROM people_counting_raw r
LEFT JOIN people_counting_data p 
    ON r.sensor_id = p.sensor_id 
    AND r.timestamp = p.timestamp;

-- 2.2 Create single alerts table
CREATE TABLE IF NOT EXISTS unified_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    store_id UUID NOT NULL REFERENCES stores(id),
    alert_type VARCHAR(50) NOT NULL, -- 'analytics', 'regional', 'system'
    alert_category VARCHAR(50) NOT NULL, -- 'traffic', 'occupancy', 'queue', etc
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100),
    threshold_value NUMERIC,
    actual_value NUMERIC,
    region_id UUID,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate existing alerts (if any)
INSERT INTO unified_alerts (
    organization_id, store_id, alert_type, alert_category,
    severity, title, description
)
SELECT organization_id, store_id, 'analytics', 'general',
       severity, title, description
FROM analytics_alerts;

-- ============================================================
-- PHASE 3: PERFORMANCE INDEXES
-- ============================================================

-- 3.1 Composite indexes for time-based queries
CREATE INDEX idx_people_counting_raw_sensor_time 
ON people_counting_raw(sensor_id, timestamp DESC);

CREATE INDEX idx_people_counting_raw_store_time 
ON people_counting_raw(store_id, timestamp DESC);

CREATE INDEX idx_hourly_analytics_store_date_hour 
ON hourly_analytics(store_id, date DESC, hour);

CREATE INDEX idx_daily_analytics_store_date 
ON daily_analytics(store_id, date DESC);

-- 3.2 Partial indexes for active records
CREATE INDEX idx_stores_active 
ON stores(organization_id) 
WHERE is_active = true;

CREATE INDEX idx_sensor_metadata_active 
ON sensor_metadata(store_id) 
WHERE is_active = true;

-- ============================================================
-- PHASE 4: GENERATED COLUMNS & CONSTRAINTS
-- ============================================================

-- 4.1 Add generated columns for calculations
ALTER TABLE people_counting_raw 
DROP COLUMN IF EXISTS total_in,
DROP COLUMN IF EXISTS total_out,
DROP COLUMN IF EXISTS net_flow;

ALTER TABLE people_counting_raw
ADD COLUMN total_in INT GENERATED ALWAYS AS 
    (COALESCE(line1_in, 0) + COALESCE(line2_in, 0) + COALESCE(line3_in, 0)) STORED,
ADD COLUMN total_out INT GENERATED ALWAYS AS 
    (COALESCE(line1_out, 0) + COALESCE(line2_out, 0) + COALESCE(line3_out, 0)) STORED,
ADD COLUMN net_flow INT GENERATED ALWAYS AS 
    ((COALESCE(line1_in, 0) + COALESCE(line2_in, 0) + COALESCE(line3_in, 0)) - 
     (COALESCE(line1_out, 0) + COALESCE(line2_out, 0) + COALESCE(line3_out, 0))) STORED;

-- 4.2 Add check constraints
ALTER TABLE people_counting_raw
ADD CONSTRAINT chk_line_values CHECK (
    line1_in >= 0 AND line1_out >= 0 AND
    line2_in >= 0 AND line2_out >= 0 AND
    line3_in >= 0 AND line3_out >= 0 AND
    line4_in >= 0 AND line4_out >= 0
);

ALTER TABLE hourly_analytics
ADD CONSTRAINT chk_hour_range CHECK (hour >= 0 AND hour < 24);

-- ============================================================
-- PHASE 5: CLEANUP UNUSED TABLES
-- ============================================================

-- 5.1 Drop unused tables (after backing up)
-- First create backup
CREATE SCHEMA IF NOT EXISTS archive;

-- Move unused tables to archive schema
ALTER TABLE IF EXISTS vca_alarm_status SET SCHEMA archive;
ALTER TABLE IF EXISTS heatmap_temporal_raw SET SCHEMA archive;
ALTER TABLE IF EXISTS customer_journeys SET SCHEMA archive;
ALTER TABLE IF EXISTS queue_analytics SET SCHEMA archive;
ALTER TABLE IF EXISTS regional_flow_matrix SET SCHEMA archive;

-- After verification, these can be dropped:
-- DROP TABLE IF EXISTS archive.vca_alarm_status;
-- DROP TABLE IF EXISTS archive.heatmap_temporal_raw;
-- DROP TABLE IF EXISTS archive.customer_journeys;
-- DROP TABLE IF EXISTS archive.queue_analytics;
-- DROP TABLE IF EXISTS archive.regional_flow_matrix;

-- ============================================================
-- PHASE 6: MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================================

-- 6.1 Create materialized view for store performance
CREATE MATERIALIZED VIEW store_performance_summary AS
SELECT 
    s.id as store_id,
    s.name as store_name,
    s.organization_id,
    DATE_TRUNC('week', d.date) as week_start,
    COUNT(DISTINCT d.date) as days_with_data,
    SUM(d.total_in) as weekly_total_in,
    SUM(d.total_out) as weekly_total_out,
    AVG(d.total_in) as avg_daily_in,
    AVG(d.total_out) as avg_daily_out,
    MAX(d.peak_hour_traffic) as max_peak_traffic,
    MODE() WITHIN GROUP (ORDER BY d.peak_hour) as most_common_peak_hour
FROM stores s
JOIN daily_analytics d ON s.id = d.store_id
WHERE d.date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.id, s.name, s.organization_id, DATE_TRUNC('week', d.date);

-- Create index on materialized view
CREATE INDEX idx_store_performance_summary_store_week 
ON store_performance_summary(store_id, week_start DESC);

-- 6.2 Create refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY store_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PHASE 7: MONITORING & MAINTENANCE
-- ============================================================

-- 7.1 Create table for monitoring query performance
CREATE TABLE IF NOT EXISTS query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT NOT NULL,
    query_text TEXT,
    execution_time_ms INT,
    rows_returned INT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.2 Create maintenance schedule table
CREATE TABLE IF NOT EXISTS maintenance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 'vacuum', 'analyze', 'reindex', 'archive'
    target_table VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    rows_affected INT,
    status VARCHAR(20) DEFAULT 'running',
    error_message TEXT
);

-- ============================================================
-- PHASE 8: DATA ARCHIVAL STRATEGY
-- ============================================================

-- 8.1 Create archive tables
CREATE TABLE IF NOT EXISTS people_counting_archive (
    LIKE people_counting_raw INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create partitions for past months
CREATE TABLE people_counting_archive_2025_06 
PARTITION OF people_counting_archive
FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE people_counting_archive_2025_07 
PARTITION OF people_counting_archive
FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

-- 8.2 Create archival function
CREATE OR REPLACE FUNCTION archive_old_data(months_to_keep INT DEFAULT 6)
RETURNS void AS $$
DECLARE
    cutoff_date DATE;
    rows_moved INT;
BEGIN
    cutoff_date := CURRENT_DATE - (months_to_keep || ' months')::INTERVAL;
    
    -- Move old data to archive
    WITH moved AS (
        DELETE FROM people_counting_raw
        WHERE timestamp < cutoff_date
        RETURNING *
    )
    INSERT INTO people_counting_archive
    SELECT * FROM moved;
    
    GET DIAGNOSTICS rows_moved = ROW_COUNT;
    
    -- Log the operation
    INSERT INTO maintenance_log (task_name, task_type, target_table, started_at, completed_at, rows_affected, status)
    VALUES ('Archive old sensor data', 'archive', 'people_counting_raw', NOW(), NOW(), rows_moved, 'completed');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SUMMARY: Run these phases in order
-- Phase 1: Immediate fixes (run now)
-- Phase 2: Table consolidation (test first)
-- Phase 3: Performance indexes (run during low traffic)
-- Phase 4: Generated columns (requires data migration)
-- Phase 5: Cleanup (after backup)
-- Phase 6: Materialized views (improves query performance)
-- Phase 7: Monitoring (ongoing)
-- Phase 8: Archival (monthly maintenance)
-- ============================================================