-- Complete setup for platform_admin role
-- Run this as superuser or database owner

-- STEP 1: Add platform_admin to the enum
ALTER TYPE user_role_enum ADD VALUE 'platform_admin' AFTER 'tenant_admin';

-- Verify it was added
SELECT unnest(enum_range(NULL::user_role_enum)) as roles
ORDER BY 1;

-- STEP 2: Update Pedro to platform_admin role
UPDATE user_profiles 
SET role = 'platform_admin',
    organization_id = NULL,  -- Platform admins don't belong to specific orgs
    updated_at = NOW()
WHERE email = 'pedro@blipee.com';

-- Verify Pedro's update
SELECT id, email, full_name, role, organization_id 
FROM user_profiles 
WHERE email = 'pedro@blipee.com';

-- STEP 3: Enable RLS on analytics tables
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create platform_admin policies for analytics
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

-- STEP 5: Organization-based access for other users
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

-- STEP 6: Add platform_admin policies for other tables
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

-- STEP 7: Verify all users and their access levels
SELECT 
    up.email,
    up.full_name,
    up.role,
    COALESCE(o.name, 'Platform Level') as organization,
    CASE 
        WHEN up.role = 'platform_admin' THEN 'Full Platform Access'
        WHEN up.role = 'tenant_admin' THEN 'Organization Admin'
        ELSE up.role
    END as access_level
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('pedro@blipee.com', 'jmunoz@patrimi.com', 'jmelo@patrimi.com')
ORDER BY 
    CASE 
        WHEN up.role = 'platform_admin' THEN 1
        ELSE 2
    END;