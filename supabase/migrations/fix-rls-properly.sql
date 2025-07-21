-- Properly fix RLS policies to avoid recursion
-- Run this in Supabase Dashboard SQL Editor

-- First, ensure RLS is enabled on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "organizations_select_auth" ON organizations;
DROP POLICY IF EXISTS "stores_select_auth" ON stores;
DROP POLICY IF EXISTS "regions_select_auth" ON regions;
DROP POLICY IF EXISTS "user_stores_select_auth" ON user_stores;
DROP POLICY IF EXISTS "user_regions_select_auth" ON user_regions;

-- User profiles: Users can only see their own profile
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- User profiles: Users can only update their own profile  
CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can see organizations they belong to
-- This uses a subquery to avoid recursion
CREATE POLICY "organizations_select_member" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Stores: Users can see stores in their organization
CREATE POLICY "stores_select_org" ON stores
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- Regions: Users can see regions in their organization
CREATE POLICY "regions_select_org" ON regions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_profiles.id = auth.uid()
        )
    );

-- User stores: Users can see their own store assignments
CREATE POLICY "user_stores_select_own" ON user_stores
    FOR SELECT USING (user_id = auth.uid());

-- User regions: Users can see their own region assignments
CREATE POLICY "user_regions_select_own" ON user_regions
    FOR SELECT USING (user_id = auth.uid());

-- Ensure the authenticated role has the necessary permissions
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON regions TO authenticated;
GRANT SELECT ON user_stores TO authenticated;
GRANT SELECT ON user_regions TO authenticated;