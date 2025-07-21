-- Clean up conflicting RLS policies without touching the function
-- Run this in Supabase Dashboard SQL Editor

-- Drop all the conflicting policies that might be causing recursion
DROP POLICY IF EXISTS "Users see own organization" ON organizations;
DROP POLICY IF EXISTS "Tenant admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Users see profiles in same organization" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users see regions in their organization" ON regions;
DROP POLICY IF EXISTS "Admins can manage regions" ON regions;
DROP POLICY IF EXISTS "Users see stores based on role" ON stores;
DROP POLICY IF EXISTS "Managers can update stores" ON stores;

-- Drop sensor-related policies that might be causing issues
DROP POLICY IF EXISTS "Users see sensors in their organization" ON sensor_metadata;
DROP POLICY IF EXISTS "Users see people counting data from their organization" ON people_counting_raw;
DROP POLICY IF EXISTS "Users see regional counting data from their organization" ON regional_counting_raw;
DROP POLICY IF EXISTS "Users see heatmap data from their organization" ON heatmap_temporal_raw;
DROP POLICY IF EXISTS "Users see alarm data from their organization" ON vca_alarm_status;
DROP POLICY IF EXISTS "Users see hourly analytics from their organization" ON hourly_analytics;
DROP POLICY IF EXISTS "Users see daily summaries from their organization" ON daily_summary;
DROP POLICY IF EXISTS "Users can view sensors in their organization" ON sensors;
DROP POLICY IF EXISTS "Users can view sensor data in their organization" ON sensor_data;

-- Drop any other policies that might exist
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
DROP POLICY IF EXISTS "stores_select_org" ON stores;
DROP POLICY IF EXISTS "regions_select_org" ON regions;
DROP POLICY IF EXISTS "user_stores_select_own" ON user_stores;
DROP POLICY IF EXISTS "user_regions_select_own" ON user_regions;

-- Create minimal policies for basic auth functionality
-- User profiles: Users can see their own profile only
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- User profiles: Users can update their own profile
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can see their organization using the existing function
CREATE POLICY "organizations_select_member" ON organizations
    FOR SELECT USING (id = get_user_organization_id(auth.uid()));

-- Keep it simple for now - we'll add store/region policies later if needed