-- CLEANUP UNUSED TABLES
-- This script removes only the tables that are no longer needed
-- Run this in Supabase SQL Editor
-- Date: 2025-07-23

-- First, let's check what depends on these tables
SELECT 
    'Dependencies check' as phase,
    conname as constraint_name,
    conrelid::regclass as on_table,
    confrelid::regclass as references_table
FROM pg_constraint
WHERE confrelid IN (
    'people_counting_data'::regclass,
    'customer_journeys'::regclass,
    'queue_analytics'::regclass,
    'regional_flow_matrix'::regclass,
    'analytics_alerts'::regclass,
    'regional_alerts'::regclass,
    'alert_rules'::regclass
)
AND contype = 'f';

-- Drop views that might depend on these tables
DROP VIEW IF EXISTS v_active_journeys CASCADE;
DROP VIEW IF EXISTS v_regional_performance CASCADE;
DROP VIEW IF EXISTS v_regional_status CASCADE;

-- Drop the tables one by one with CASCADE to handle dependencies
DROP TABLE IF EXISTS customer_journeys CASCADE;
DROP TABLE IF EXISTS queue_analytics CASCADE;
DROP TABLE IF EXISTS regional_flow_matrix CASCADE;
DROP TABLE IF EXISTS heatmap_temporal_raw CASCADE;
DROP TABLE IF EXISTS vca_alarm_status CASCADE;
DROP TABLE IF EXISTS analytics_alerts CASCADE;
DROP TABLE IF EXISTS regional_alerts CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
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

-- Keep people_counting_data for now since it might have dependencies
-- We'll handle it separately after checking what depends on it

-- Verify what's left
SELECT 
    'Tables remaining' as info,
    table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;