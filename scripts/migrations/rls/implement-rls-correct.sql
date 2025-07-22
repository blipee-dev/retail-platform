-- Implement proper RLS policies that work with server-side API
-- Run this in Supabase Dashboard SQL Editor

-- Re-enable RLS on core tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on sensor tables (correct table names)
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE heatmap_temporal_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE vca_alarm_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON organizations;
DROP POLICY IF EXISTS "stores_select_org" ON stores;
DROP POLICY IF EXISTS "regions_select_org" ON regions;
DROP POLICY IF EXISTS "user_stores_select_own" ON user_stores;
DROP POLICY IF EXISTS "user_regions_select_own" ON user_regions;

-- Drop existing sensor policies
DROP POLICY IF EXISTS "Users see sensors in their organization" ON sensor_metadata;
DROP POLICY IF EXISTS "Users see people counting data from their organization" ON people_counting_raw;
DROP POLICY IF EXISTS "Users see regional counting data from their organization" ON regional_counting_raw;
DROP POLICY IF EXISTS "Users see heatmap data from their organization" ON heatmap_temporal_raw;
DROP POLICY IF EXISTS "Users see alarm data from their organization" ON vca_alarm_status;
DROP POLICY IF EXISTS "Users see hourly analytics from their organization" ON hourly_analytics;
DROP POLICY IF EXISTS "Users see daily summaries from their organization" ON daily_summary;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_organization_id();
DROP FUNCTION IF EXISTS get_user_organization_id(uuid);

-- Create helper function in public schema (we have access to this)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO service_role;

-- User Profiles: Users can only see their own profile
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- User Profiles: Users can update their own profile
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can see their organization
CREATE POLICY "organizations_select_own" ON organizations
    FOR SELECT USING (id = public.get_user_organization_id());

-- Stores: Users can see stores in their organization
CREATE POLICY "stores_select_org" ON stores
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Regions: Users can see regions in their organization
CREATE POLICY "regions_select_org" ON regions
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- User Stores: Users can see their own store assignments
CREATE POLICY "user_stores_select_own" ON user_stores
    FOR SELECT USING (user_id = auth.uid());

-- User Regions: Users can see their own region assignments
CREATE POLICY "user_regions_select_own" ON user_regions
    FOR SELECT USING (user_id = auth.uid());

-- Sensor Metadata: Users can see sensors in their organization
CREATE POLICY "sensor_metadata_select_org" ON sensor_metadata
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- People Counting Data: Users can see data from their organization
CREATE POLICY "people_counting_select_org" ON people_counting_raw
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Regional Counting Data: Users can see data from their organization
CREATE POLICY "regional_counting_select_org" ON regional_counting_raw
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Heatmap Data: Users can see data from their organization
CREATE POLICY "heatmap_select_org" ON heatmap_temporal_raw
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- VCA Alarm Data: Users can see data from their organization
CREATE POLICY "vca_alarm_select_org" ON vca_alarm_status
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Hourly Analytics: Users can see data from their organization
CREATE POLICY "hourly_analytics_select_org" ON hourly_analytics
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Daily Summary: Users can see data from their organization
CREATE POLICY "daily_summary_select_org" ON daily_summary
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Alert Rules: Users can see rules from their organization
CREATE POLICY "alert_rules_select_org" ON alert_rules
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Alerts: Users can see alerts from their organization
CREATE POLICY "alerts_select_org" ON alerts
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON regions TO authenticated;
GRANT SELECT ON user_stores TO authenticated;
GRANT SELECT ON user_regions TO authenticated;
GRANT SELECT ON sensor_metadata TO authenticated;
GRANT SELECT ON people_counting_raw TO authenticated;
GRANT SELECT ON regional_counting_raw TO authenticated;
GRANT SELECT ON heatmap_temporal_raw TO authenticated;
GRANT SELECT ON vca_alarm_status TO authenticated;
GRANT SELECT ON hourly_analytics TO authenticated;
GRANT SELECT ON daily_summary TO authenticated;
GRANT SELECT ON alert_rules TO authenticated;
GRANT SELECT ON alerts TO authenticated;

-- Service role needs full access for our API routes
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON organizations TO service_role;
GRANT ALL ON stores TO service_role;
GRANT ALL ON regions TO service_role;
GRANT ALL ON user_stores TO service_role;
GRANT ALL ON user_regions TO service_role;
GRANT ALL ON sensor_metadata TO service_role;
GRANT ALL ON people_counting_raw TO service_role;
GRANT ALL ON regional_counting_raw TO service_role;
GRANT ALL ON heatmap_temporal_raw TO service_role;
GRANT ALL ON vca_alarm_status TO service_role;
GRANT ALL ON hourly_analytics TO service_role;
GRANT ALL ON daily_summary TO service_role;
GRANT ALL ON alert_rules TO service_role;
GRANT ALL ON alerts TO service_role;