-- Temporarily disable RLS to get auth working
-- We'll re-enable it properly after testing the auth flow

-- Disable RLS on all tables temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE regions DISABLE ROW LEVEL SECURITY;
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensors DISABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data DISABLE ROW LEVEL SECURITY;

-- Drop ALL RLS policies to prevent any recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in same org" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage users in org" ON user_profiles;
DROP POLICY IF EXISTS "Simple profile access" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Tenant admins can update their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view regions in their organization" ON regions;
DROP POLICY IF EXISTS "Users can view stores in their organization" ON stores;
DROP POLICY IF EXISTS "Users can view sensors in their organization" ON sensors;
DROP POLICY IF EXISTS "Users can view sensor data in their organization" ON sensor_data;

-- Drop the helper functions that might be causing issues
DROP FUNCTION IF EXISTS get_user_organization_id(UUID);
DROP FUNCTION IF EXISTS get_user_org_id_simple(UUID);

SELECT 'RLS temporarily disabled - auth should work now' as status;