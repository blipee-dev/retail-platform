-- STEP 2: Setup platform_admin user and policies
-- Run this AFTER step 1 has been committed

-- Update Pedro to platform_admin role
-- Keep his organization_id since it's required (NOT NULL constraint)
UPDATE user_profiles 
SET role = 'platform_admin',
    permissions = '{"platform_admin": true}',
    updated_at = NOW()
WHERE email = 'pedro@blipee.com';

-- Verify Pedro's update
SELECT id, email, full_name, role, organization_id 
FROM user_profiles 
WHERE email = 'pedro@blipee.com';

-- Enable RLS on analytics tables
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- Create platform_admin policies for analytics
CREATE POLICY "platform_admin_all_hourly_analytics" ON hourly_analytics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

CREATE POLICY "platform_admin_all_daily_analytics" ON daily_analytics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- Organization-based access for other users
CREATE POLICY "org_based_hourly_analytics" ON hourly_analytics
FOR SELECT TO authenticated
USING (
    store_id IN (
        SELECT s.id 
        FROM stores s
        WHERE s.organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
        )
    )
);

CREATE POLICY "org_based_daily_analytics" ON daily_analytics
FOR SELECT TO authenticated
USING (
    store_id IN (
        SELECT s.id 
        FROM stores s
        WHERE s.organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE id = auth.uid()
            AND organization_id IS NOT NULL
        )
    )
);

-- Add platform_admin policies for other critical tables
-- Enable RLS first if needed
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "platform_admin_all_organizations" ON organizations
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- Stores
CREATE POLICY "platform_admin_all_stores" ON stores
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- User profiles
CREATE POLICY "platform_admin_all_users" ON user_profiles
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- Sensor metadata
CREATE POLICY "platform_admin_all_sensors" ON sensor_metadata
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- Raw data
CREATE POLICY "platform_admin_all_raw_data" ON people_counting_raw
FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- Final verification - show all users and their access
SELECT 
    up.email,
    up.full_name,
    up.role::text as role,
    COALESCE(o.name, 'Platform Level') as organization,
    CASE up.role::text
        WHEN 'platform_admin' THEN 'Full Platform Access'
        WHEN 'tenant_admin' THEN 'Organization Admin'
        WHEN 'regional_manager' THEN 'Regional Manager'
        WHEN 'store_manager' THEN 'Store Manager'
        WHEN 'viewer' THEN 'Viewer'
        ELSE up.role::text
    END as access_level
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.is_active = true
ORDER BY 
    CASE up.role::text
        WHEN 'platform_admin' THEN 1
        WHEN 'tenant_admin' THEN 2
        ELSE 3
    END;