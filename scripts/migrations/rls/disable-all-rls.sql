-- Temporarily disable ALL RLS to get auth working
-- We'll add security back gradually once basic auth works
-- Run this in Supabase Dashboard SQL Editor

-- Disable RLS on all tables
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions DISABLE ROW LEVEL SECURITY;

-- Also disable on sensor tables if they exist
ALTER TABLE sensor_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw DISABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw DISABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_temporal_raw DISABLE ROW LEVEL SECURITY;
ALTER TABLE vca_alarm_status DISABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data DISABLE ROW LEVEL SECURITY;