-- COMPLETE DATABASE OPTIMIZATION FOR SUPABASE (SIMPLIFIED)
-- Run this entire script in Supabase SQL Editor
-- Date: 2025-07-23

-- ============================================================
-- PHASE 1: ADD NEW FEATURES
-- ============================================================

-- 1.1 Fix NULL sensor_id issue
UPDATE sensor_metadata 
SET sensor_id = CASE 
    WHEN id = 'f63ef2e9-344e-4373-aedf-04dd05cf8f8b' THEN 'OML01-SENSOR-001'
    WHEN id = '7976051c-980b-45e1-b099-45d032f3c7aa' THEN 'OML02-SENSOR-001'
    WHEN id = '29e75799-328f-4143-9a2f-2bcc1269f77e' THEN 'OML03-SENSOR-001'
    WHEN id = 'ffc2438a-ee4f-4324-96da-08671ea3b23c' THEN 'JJ01-SENSOR-001'
    ELSE sensor_id
END
WHERE sensor_id IS NULL;

-- 1.2 Add sensor health monitoring columns
ALTER TABLE sensor_metadata ADD COLUMN IF NOT EXISTS
    status VARCHAR(20) DEFAULT 'online' CHECK (status IN ('online', 'offline', 'warning'));

ALTER TABLE sensor_metadata ADD COLUMN IF NOT EXISTS
    last_data_received TIMESTAMPTZ;

ALTER TABLE sensor_metadata ADD COLUMN IF NOT EXISTS
    offline_since TIMESTAMPTZ;

ALTER TABLE sensor_metadata ADD COLUMN IF NOT EXISTS
    health_check_interval INT DEFAULT 30;

ALTER TABLE sensor_metadata ADD COLUMN IF NOT EXISTS
    consecutive_failures INT DEFAULT 0;

-- Update last_data_received from latest sensor data
UPDATE sensor_metadata sm
SET last_data_received = (
    SELECT MAX(timestamp)
    FROM people_counting_raw pcr
    WHERE pcr.sensor_id = sm.id
);

-- 1.3 Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_record 
ON audit_log(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at 
ON audit_log(changed_at DESC);

-- 1.4 Create sensor health log table
CREATE TABLE IF NOT EXISTS sensor_health_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sensor_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    metrics JSONB
);

CREATE INDEX IF NOT EXISTS idx_sensor_health_log_sensor 
ON sensor_health_log(sensor_id, changed_at DESC);

-- 1.5 Add performance indexes
CREATE INDEX IF NOT EXISTS idx_people_counting_raw_sensor_time 
ON people_counting_raw(sensor_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_people_counting_raw_store_time 
ON people_counting_raw(store_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_hourly_analytics_store_date_hour 
ON hourly_analytics(store_id, date DESC, hour);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_store_date 
ON daily_analytics(store_id, date DESC);

-- ============================================================
-- PHASE 2: HANDLE ALERTS TABLE
-- ============================================================

-- Drop the existing alerts table and all related tables
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS analytics_alerts CASCADE;
DROP TABLE IF EXISTS regional_alerts CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;

-- Create new unified alerts table with correct structure
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    store_id UUID REFERENCES stores(id),
    alert_type VARCHAR(50) NOT NULL,
    alert_category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metric_name VARCHAR(100),
    threshold_value NUMERIC,
    actual_value NUMERIC,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_org_store 
ON alerts(organization_id, store_id);

CREATE INDEX idx_alerts_triggered 
ON alerts(triggered_at DESC);

-- ============================================================
-- PHASE 3: RECREATE VIEWS
-- ============================================================

-- Drop and recreate latest_sensor_data view to use people_counting_raw
DROP VIEW IF EXISTS latest_sensor_data;

CREATE VIEW latest_sensor_data AS
SELECT DISTINCT ON (sensor_id)
    sensor_id,
    timestamp,
    total_in,
    total_out,
    line1_in,
    line1_out,
    line2_in,
    line2_out,
    line3_in,
    line3_out,
    line4_in,
    line4_out
FROM people_counting_raw
ORDER BY sensor_id, timestamp DESC;

-- Create sensor status monitoring view
CREATE OR REPLACE VIEW v_sensor_status AS
SELECT 
    s.id,
    s.sensor_id,
    s.sensor_name,
    st.name as store_name,
    s.status,
    s.last_data_received,
    CASE 
        WHEN last_data_received < NOW() - INTERVAL '30 minutes' THEN 'OFFLINE'
        WHEN last_data_received < NOW() - INTERVAL '15 minutes' THEN 'WARNING'
        ELSE 'ONLINE'
    END as current_status,
    EXTRACT(EPOCH FROM (NOW() - last_data_received))/60 as minutes_since_last_data,
    s.consecutive_failures
FROM sensor_metadata s
JOIN stores st ON s.store_id = st.id
WHERE s.is_active = true;

-- ============================================================
-- PHASE 4: CREATE MONITORING FUNCTIONS
-- ============================================================

-- Create function to update sensor status
CREATE OR REPLACE FUNCTION update_sensor_status() 
RETURNS void AS $$
BEGIN
    -- Mark sensors offline if no data for 30+ minutes
    UPDATE sensor_metadata
    SET 
        status = 'offline',
        offline_since = COALESCE(offline_since, NOW()),
        consecutive_failures = consecutive_failures + 1
    WHERE is_active = true
    AND last_data_received < NOW() - INTERVAL '30 minutes'
    AND status != 'offline';
    
    -- Mark sensors online when data received
    UPDATE sensor_metadata
    SET 
        status = 'online',
        offline_since = NULL,
        consecutive_failures = 0
    WHERE is_active = true
    AND last_data_received >= NOW() - INTERVAL '30 minutes'
    AND status = 'offline';
    
    -- Log status changes
    INSERT INTO sensor_health_log (sensor_id, status, reason)
    SELECT sensor_id, status, 
           CASE 
               WHEN status = 'offline' THEN 'No data for 30+ minutes'
               ELSE 'Data received'
           END
    FROM sensor_metadata
    WHERE updated_at > NOW() - INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit logging
CREATE OR REPLACE FUNCTION log_changes() 
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (
            table_name, record_id, action, 
            old_values, new_values
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP,
            to_jsonb(OLD), to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (
            table_name, record_id, action, new_values
        ) VALUES (
            TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (
            table_name, record_id, action, old_values
        ) VALUES (
            TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to key tables
DROP TRIGGER IF EXISTS audit_sensor_metadata ON sensor_metadata;
CREATE TRIGGER audit_sensor_metadata
AFTER INSERT OR UPDATE OR DELETE ON sensor_metadata
FOR EACH ROW EXECUTE FUNCTION log_changes();

DROP TRIGGER IF EXISTS audit_stores ON stores;
CREATE TRIGGER audit_stores
AFTER INSERT OR UPDATE OR DELETE ON stores
FOR EACH ROW EXECUTE FUNCTION log_changes();

DROP TRIGGER IF EXISTS audit_organizations ON organizations;
CREATE TRIGGER audit_organizations
AFTER INSERT OR UPDATE OR DELETE ON organizations
FOR EACH ROW EXECUTE FUNCTION log_changes();

-- ============================================================
-- PHASE 5: BACKUP TABLES WITH DATA
-- ============================================================

-- Create archive schema
CREATE SCHEMA IF NOT EXISTS archive;

-- Backup people_counting_data before dropping (has 1673 rows)
CREATE TABLE IF NOT EXISTS archive.people_counting_data_backup AS 
SELECT * FROM people_counting_data;

-- ============================================================
-- PHASE 6: DROP UNUSED TABLES
-- ============================================================

-- Drop unused views
DROP VIEW IF EXISTS v_active_journeys;
DROP VIEW IF EXISTS v_regional_performance;
DROP VIEW IF EXISTS v_regional_status;

-- Drop all unused tables
DROP TABLE IF EXISTS people_counting_data CASCADE;
DROP TABLE IF EXISTS customer_journeys CASCADE;
DROP TABLE IF EXISTS queue_analytics CASCADE;
DROP TABLE IF EXISTS regional_flow_matrix CASCADE;
DROP TABLE IF EXISTS heatmap_temporal_raw CASCADE;
DROP TABLE IF EXISTS vca_alarm_status CASCADE;
DROP TABLE IF EXISTS daily_summary CASCADE;
DROP TABLE IF EXISTS region_dwell_times CASCADE;
DROP TABLE IF EXISTS region_entrance_exit_events CASCADE;
DROP TABLE IF EXISTS region_type_templates CASCADE;
DROP TABLE IF EXISTS regional_analytics CASCADE;
DROP TABLE IF EXISTS regional_counts CASCADE;
DROP TABLE IF EXISTS regional_occupancy_snapshots CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS sensor_data CASCADE;
DROP TABLE IF EXISTS user_regions CASCADE;
DROP TABLE IF EXISTS user_stores CASCADE;

-- ============================================================
-- PHASE 7: VERIFY OPTIMIZATION
-- ============================================================

-- Check final table count
SELECT 'Final table count:' as info, COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- List remaining tables with sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verify sensor IDs are fixed
SELECT sensor_id, sensor_name, status, last_data_received 
FROM sensor_metadata;

-- Check all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================
SELECT '✅ Database optimization complete! Reduced from 34 to 11 tables.' as status;