-- Comprehensive RLS Policies for all roles
-- This ensures proper data isolation and access control

-- Enable RLS on all important tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_configurations ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- PLATFORM_ADMIN POLICIES (Full Access)
-- ===========================================

-- Platform admin can see/edit all organizations
CREATE POLICY "platform_admin_all_organizations" ON organizations
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- Platform admin can see/edit all stores
CREATE POLICY "platform_admin_all_stores" ON stores
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- Platform admin can see/edit all users
CREATE POLICY "platform_admin_all_users" ON user_profiles
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- ===========================================
-- TENANT_ADMIN POLICIES (Organization Level)
-- ===========================================

-- Tenant admin can see/edit their organization
CREATE POLICY "tenant_admin_own_organization" ON organizations
FOR ALL TO authenticated
USING (
    id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'tenant_admin'
    )
);

-- Tenant admin can see/edit all stores in their organization
CREATE POLICY "tenant_admin_org_stores" ON stores
FOR ALL TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'tenant_admin'
    )
);

-- Tenant admin can see/edit users in their organization
CREATE POLICY "tenant_admin_org_users" ON user_profiles
FOR ALL TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'tenant_admin'
    )
);

-- ===========================================
-- REGIONAL_MANAGER POLICIES
-- ===========================================

-- Regional manager can see their organization
CREATE POLICY "regional_manager_view_organization" ON organizations
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'regional_manager'
    )
);

-- Regional manager can see/edit stores in their region (needs region assignment)
CREATE POLICY "regional_manager_regional_stores" ON stores
FOR ALL TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'regional_manager'
    )
    -- Add region filter when region assignment is implemented
);

-- ===========================================
-- STORE_MANAGER POLICIES
-- ===========================================

-- Store manager can see their stores
CREATE POLICY "store_manager_own_stores" ON stores
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT store_id 
        FROM user_store_assignments 
        WHERE user_id = auth.uid()
    )
    OR 
    id IN (
        SELECT id 
        FROM stores 
        WHERE organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'store_manager'
        )
    )
);

-- ===========================================
-- VIEWER POLICIES (Read Only)
-- ===========================================

-- Viewers can see their organization
CREATE POLICY "viewer_view_organization" ON organizations
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'viewer'
    )
);

-- Viewers can see stores in their organization
CREATE POLICY "viewer_view_stores" ON stores
FOR SELECT TO authenticated
USING (
    organization_id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role = 'viewer'
    )
);

-- ===========================================
-- DATA ACCESS POLICIES (Analytics & Raw Data)
-- ===========================================

-- Analytics data access based on store access
CREATE POLICY "analytics_access_by_store" ON hourly_analytics
FOR SELECT TO authenticated
USING (
    store_id IN (
        SELECT s.id 
        FROM stores s
        JOIN user_profiles up ON up.organization_id = s.organization_id
        WHERE up.id = auth.uid()
    )
    OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin')
);

CREATE POLICY "daily_analytics_access_by_store" ON daily_analytics
FOR SELECT TO authenticated
USING (
    store_id IN (
        SELECT s.id 
        FROM stores s
        JOIN user_profiles up ON up.organization_id = s.organization_id
        WHERE up.id = auth.uid()
    )
    OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin')
);

-- Raw data access
CREATE POLICY "raw_data_access_by_store" ON people_counting_raw
FOR SELECT TO authenticated
USING (
    store_id IN (
        SELECT s.id 
        FROM stores s
        JOIN user_profiles up ON up.organization_id = s.organization_id
        WHERE up.id = auth.uid()
    )
    OR
    auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin')
);

-- ===========================================
-- SELF ACCESS POLICIES
-- ===========================================

-- Users can always see their own profile
CREATE POLICY "users_view_own_profile" ON user_profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

-- Users can update their own profile (limited fields)
CREATE POLICY "users_update_own_profile" ON user_profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (
    id = auth.uid() 
    AND role = (SELECT role FROM user_profiles WHERE id = auth.uid())
    AND organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())
);

-- ===========================================
-- SUMMARY OF ACCESS LEVELS
-- ===========================================
-- platform_admin: Full access to everything
-- tenant_admin: Full access within their organization
-- regional_manager: View org, manage regional stores
-- store_manager: View/manage assigned stores
-- analyst: View analytics data for their org
-- store_staff: View their store data
-- viewer: Read-only access to their org data