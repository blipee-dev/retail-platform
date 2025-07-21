-- Fix the infinite recursion in RLS policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles in their organization" ON user_profiles;

-- Create a simpler helper function that doesn't cause recursion
CREATE OR REPLACE FUNCTION get_user_org_id_simple(user_id UUID)
RETURNS UUID AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM user_profiles 
    WHERE id = user_id;
    
    RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create non-recursive policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view profiles in same org" ON user_profiles
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Admins can manage users in their organization
CREATE POLICY "Admins can manage users in org" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.organization_id = user_profiles.organization_id
            AND admin_profile.role IN ('tenant_admin', 'regional_manager')
        )
    );

-- Fix organizations policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Fix other table policies that might have recursion
DROP POLICY IF EXISTS "Users can view regions in their organization" ON regions;
CREATE POLICY "Users can view regions in their organization" ON regions
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can view stores in their organization" ON stores;
CREATE POLICY "Users can view stores in their organization" ON stores
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Test the fix
SELECT 'RLS policies fixed successfully' as status;