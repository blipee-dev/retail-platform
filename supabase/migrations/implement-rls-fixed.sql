-- Implement proper RLS policies that work with server-side API
-- Run this in Supabase Dashboard SQL Editor

-- Re-enable RLS on core tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sensor tables  
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
DROP POLICY IF EXISTS "organizations_select_own" ON organizations;
DROP POLICY IF EXISTS "stores_select_org" ON stores;
DROP POLICY IF EXISTS "regions_select_org" ON regions;
DROP POLICY IF EXISTS "user_stores_select_own" ON user_stores;
DROP POLICY IF EXISTS "user_regions_select_own" ON user_regions;
DROP POLICY IF EXISTS "sensors_select_org" ON sensors;
DROP POLICY IF EXISTS "sensor_data_select_org" ON sensor_data;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_user_organization_id();
DROP FUNCTION IF EXISTS auth.get_user_organization_id();

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

-- Sensors: Users can see sensors in their organization
CREATE POLICY "sensors_select_org" ON sensors
    FOR SELECT USING (organization_id = public.get_user_organization_id());

-- Sensor Data: Users can see data from sensors in their organization
CREATE POLICY "sensor_data_select_org" ON sensor_data
    FOR SELECT USING (
        sensor_id IN (
            SELECT id FROM public.sensors WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON regions TO authenticated;
GRANT SELECT ON user_stores TO authenticated;
GRANT SELECT ON user_regions TO authenticated;
GRANT SELECT ON sensors TO authenticated;
GRANT SELECT ON sensor_data TO authenticated;

-- Service role needs full access for our API routes
GRANT ALL ON user_profiles TO service_role;
GRANT ALL ON organizations TO service_role;
GRANT ALL ON stores TO service_role;
GRANT ALL ON regions TO service_role;
GRANT ALL ON user_stores TO service_role;
GRANT ALL ON user_regions TO service_role;
GRANT ALL ON sensors TO service_role;
GRANT ALL ON sensor_data TO service_role;