-- DATABASE OPTIMIZATION MIGRATION
-- Date: 2025-07-23
-- Purpose: Optimize database from 34 to 11 tables, add monitoring features
-- 
-- IMPORTANT: Run this migration in phases to ensure data safety
-- Phase 1: Add new features (safe to run anytime)
-- Phase 2: Create backups (run during maintenance window)
-- Phase 3: Remove unused tables (after verification)

-- ============================================================
-- PHASE 1: ADD NEW FEATURES (Safe, Non-Breaking Changes)
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

-- 1.6 Create unified alerts table (if not exists)
CREATE TABLE IF NOT EXISTS alerts (
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

CREATE INDEX IF NOT EXISTS idx_alerts_org_store 
ON alerts(organization_id, store_id);

CREATE INDEX IF NOT EXISTS idx_alerts_triggered 
ON alerts(triggered_at DESC);

-- 1.7 Create monitoring views
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

-- 1.8 Create function to update sensor status
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

-- 1.9 Create trigger for audit logging
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
-- PHASE 2: CREATE BACKUPS (Run During Maintenance Window)
-- ============================================================

-- 2.1 Create archive schema
CREATE SCHEMA IF NOT EXISTS archive;

-- 2.2 Backup tables to be removed
-- Run these one at a time and verify each backup

-- CREATE TABLE archive.people_counting_data_backup AS SELECT * FROM people_counting_data;
-- CREATE TABLE archive.customer_journeys_backup AS SELECT * FROM customer_journeys;
-- CREATE TABLE archive.queue_analytics_backup AS SELECT * FROM queue_analytics;
-- CREATE TABLE archive.regional_flow_matrix_backup AS SELECT * FROM regional_flow_matrix;
-- CREATE TABLE archive.heatmap_temporal_raw_backup AS SELECT * FROM heatmap_temporal_raw;
-- CREATE TABLE archive.vca_alarm_status_backup AS SELECT * FROM vca_alarm_status;
-- CREATE TABLE archive.analytics_alerts_backup AS SELECT * FROM analytics_alerts;
-- CREATE TABLE archive.regional_alerts_backup AS SELECT * FROM regional_alerts;
-- CREATE TABLE archive.alert_rules_backup AS SELECT * FROM alert_rules;
-- CREATE TABLE archive.daily_summary_backup AS SELECT * FROM daily_summary;
-- CREATE TABLE archive.region_dwell_times_backup AS SELECT * FROM region_dwell_times;
-- CREATE TABLE archive.region_entrance_exit_events_backup AS SELECT * FROM region_entrance_exit_events;
-- CREATE TABLE archive.region_type_templates_backup AS SELECT * FROM region_type_templates;
-- CREATE TABLE archive.regional_analytics_backup AS SELECT * FROM regional_analytics;
-- CREATE TABLE archive.regional_counts_backup AS SELECT * FROM regional_counts;
-- CREATE TABLE archive.regional_occupancy_snapshots_backup AS SELECT * FROM regional_occupancy_snapshots;
-- CREATE TABLE archive.regions_backup AS SELECT * FROM regions;
-- CREATE TABLE archive.sensor_data_backup AS SELECT * FROM sensor_data;
-- CREATE TABLE archive.user_regions_backup AS SELECT * FROM user_regions;
-- CREATE TABLE archive.user_stores_backup AS SELECT * FROM user_stores;

-- ============================================================
-- PHASE 3: REMOVE UNUSED TABLES (After Verification)
-- ============================================================

-- IMPORTANT: Only run after confirming:
-- 1. All backups are complete
-- 2. Application code has been updated
-- 3. No queries reference these tables

-- 3.1 Drop unused tables
-- DROP TABLE IF EXISTS people_counting_data;
-- DROP TABLE IF EXISTS customer_journeys;
-- DROP TABLE IF EXISTS queue_analytics;
-- DROP TABLE IF EXISTS regional_flow_matrix;
-- DROP TABLE IF EXISTS heatmap_temporal_raw;
-- DROP TABLE IF EXISTS vca_alarm_status;
-- DROP TABLE IF EXISTS analytics_alerts;
-- DROP TABLE IF EXISTS regional_alerts;
-- DROP TABLE IF EXISTS alert_rules;
-- DROP TABLE IF EXISTS daily_summary;
-- DROP TABLE IF EXISTS region_dwell_times;
-- DROP TABLE IF EXISTS region_entrance_exit_events;
-- DROP TABLE IF EXISTS region_type_templates;
-- DROP TABLE IF EXISTS regional_analytics;
-- DROP TABLE IF EXISTS regional_counts;
-- DROP TABLE IF EXISTS regional_occupancy_snapshots;
-- DROP TABLE IF EXISTS regions;
-- DROP TABLE IF EXISTS sensor_data;
-- DROP TABLE IF EXISTS user_regions;
-- DROP TABLE IF EXISTS user_stores;

-- 3.2 Drop unused views
-- DROP VIEW IF EXISTS v_active_journeys;
-- DROP VIEW IF EXISTS v_regional_performance;
-- DROP VIEW IF EXISTS v_regional_status;

-- ============================================================
-- PHASE 4: FINAL CLEANUP
-- ============================================================

-- 4.1 Update statistics
-- ANALYZE;

-- 4.2 Verify final state
-- SELECT table_name, 
--        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
-- FROM pg_tables 
-- WHERE schemaname = 'public'
-- ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================
-- ROLLBACK PLAN
-- ============================================================

-- If issues occur, tables can be restored from archive schema:
-- CREATE TABLE table_name AS SELECT * FROM archive.table_name_backup;

-- To remove new features:
-- ALTER TABLE sensor_metadata DROP COLUMN status, DROP COLUMN last_data_received, ...;
-- DROP TABLE audit_log;
-- DROP TABLE sensor_health_log;
-- DROP TABLE alerts;
-- DROP VIEW v_sensor_status;
-- DROP FUNCTION update_sensor_status();
-- DROP FUNCTION log_changes();