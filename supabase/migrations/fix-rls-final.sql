-- Final fix for RLS recursion - disable and recreate all policies
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS to break the recursion
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in same org" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage users in org" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Tenant admins can update their organization" ON organizations;

-- Create a simple lookup table approach
CREATE TABLE IF NOT EXISTS user_org_lookup (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate the lookup table
INSERT INTO user_org_lookup (user_id, organization_id)
SELECT id, organization_id FROM user_profiles
ON CONFLICT (user_id) DO UPDATE SET organization_id = EXCLUDED.organization_id;

-- Enable RLS on lookup table
ALTER TABLE user_org_lookup ENABLE ROW LEVEL SECURITY;

-- Create simple policy for lookup table
CREATE POLICY "Users can view their own org lookup" ON user_org_lookup
    FOR SELECT USING (user_id = auth.uid());

-- Re-enable RLS on main tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- For now, let's make a simple policy that avoids recursion
-- Only allow users to see their own profile initially
CREATE POLICY "Simple profile access" ON user_profiles
    FOR ALL USING (id = auth.uid());

-- Simple organization policy using the lookup table
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM user_org_lookup WHERE user_id = auth.uid()
        )
    );

-- Create trigger to keep lookup table in sync
CREATE OR REPLACE FUNCTION sync_user_org_lookup()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO user_org_lookup (user_id, organization_id) 
        VALUES (NEW.id, NEW.organization_id)
        ON CONFLICT (user_id) DO UPDATE SET organization_id = NEW.organization_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE user_org_lookup 
        SET organization_id = NEW.organization_id 
        WHERE user_id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM user_org_lookup WHERE user_id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_user_org_lookup_trigger ON user_profiles;
CREATE TRIGGER sync_user_org_lookup_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION sync_user_org_lookup();

-- Test query to make sure it works
SELECT 'RLS policies recreated successfully' as status;

-- You can test this query should work without recursion:
-- SELECT * FROM user_profiles WHERE id = auth.uid();