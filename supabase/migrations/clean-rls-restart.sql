-- Clean restart of RLS policies
-- Run this in Supabase Dashboard SQL Editor

-- First, disable all RLS to stop any recursion
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_org_lookup DISABLE ROW LEVEL SECURITY;

-- Drop ALL possible existing policies (no errors if they don't exist)
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in same org" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage users in org" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Tenant admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view their own org lookup" ON user_org_lookup;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON organizations;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON regions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_stores;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_regions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_org_lookup;

-- Drop lookup table if it exists
DROP TABLE IF EXISTS user_org_lookup;

-- Re-enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for authenticated users
-- These avoid recursion by not referencing other tables

-- User profiles - users can read/update their own
CREATE POLICY "user_profiles_select_own" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_update_own" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Organizations - authenticated users can read all (for now)
CREATE POLICY "organizations_select_auth" ON organizations
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Stores - authenticated users can read all (for now)
CREATE POLICY "stores_select_auth" ON stores
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Regions - authenticated users can read all (for now)
CREATE POLICY "regions_select_auth" ON regions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- User stores - authenticated users can read all (for now)
CREATE POLICY "user_stores_select_auth" ON user_stores
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- User regions - authenticated users can read all (for now)
CREATE POLICY "user_regions_select_auth" ON user_regions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON regions TO authenticated;
GRANT SELECT ON user_stores TO authenticated;
GRANT SELECT ON user_regions TO authenticated;