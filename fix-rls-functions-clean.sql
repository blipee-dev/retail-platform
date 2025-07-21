-- Fix RLS using functions - clean version
-- Run this in Supabase Dashboard SQL Editor

-- First, disable RLS temporarily to create functions
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "organizations_select_member" ON organizations;
DROP POLICY IF EXISTS "stores_select_org" ON stores;
DROP POLICY IF EXISTS "regions_select_org" ON regions;
DROP POLICY IF EXISTS "user_stores_select_own" ON user_stores;
DROP POLICY IF EXISTS "user_regions_select_own" ON user_regions;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_organization_id(uuid);

-- Create a function to get user's organization ID without RLS recursion
CREATE OR REPLACE FUNCTION get_user_organization_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM user_profiles WHERE id = user_uuid;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_id(uuid) TO authenticated;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- User profiles: Users can see their own profile
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- User profiles: Users can update their own profile
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can see their organization using the function
CREATE POLICY "organizations_select_member" ON organizations
    FOR SELECT USING (id = get_user_organization_id(auth.uid()));

-- Stores: Users can see stores in their organization
CREATE POLICY "stores_select_org" ON stores
    FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

-- Regions: Users can see regions in their organization
CREATE POLICY "regions_select_org" ON regions
    FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

-- User stores: Users can see their own store assignments
CREATE POLICY "user_stores_select_own" ON user_stores
    FOR SELECT USING (user_id = auth.uid());

-- User regions: Users can see their own region assignments
CREATE POLICY "user_regions_select_own" ON user_regions
    FOR SELECT USING (user_id = auth.uid());

-- Ensure permissions are granted
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON regions TO authenticated;
GRANT SELECT ON user_stores TO authenticated;
GRANT SELECT ON user_regions TO authenticated;