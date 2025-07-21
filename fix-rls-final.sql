-- Re-enable RLS and fix policies properly
-- Run this in Supabase Dashboard SQL Editor

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view stores in their organization" ON stores;
DROP POLICY IF EXISTS "Users can view regions in their organization" ON regions;
DROP POLICY IF EXISTS "Users can view their store assignments" ON user_stores;
DROP POLICY IF EXISTS "Users can view their region assignments" ON user_regions;

-- Simple, non-recursive policies for user_profiles
CREATE POLICY "Enable read access for authenticated users" ON user_profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Simple policies for organizations
CREATE POLICY "Enable read access for authenticated users" ON organizations
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Simple policies for stores
CREATE POLICY "Enable read access for authenticated users" ON stores
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Simple policies for regions
CREATE POLICY "Enable read access for authenticated users" ON regions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Simple policies for user_stores
CREATE POLICY "Enable read access for authenticated users" ON user_stores
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Simple policies for user_regions
CREATE POLICY "Enable read access for authenticated users" ON user_regions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT UPDATE ON user_profiles TO authenticated;
GRANT SELECT ON organizations TO authenticated;
GRANT SELECT ON stores TO authenticated;
GRANT SELECT ON regions TO authenticated;
GRANT SELECT ON user_stores TO authenticated;
GRANT SELECT ON user_regions TO authenticated;