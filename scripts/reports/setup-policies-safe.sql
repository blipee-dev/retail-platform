-- Setup RLS policies safely (drops existing ones first)

-- 1. Drop existing policies for analytics tables
DROP POLICY IF EXISTS "platform_admin_all_hourly_analytics" ON hourly_analytics;
DROP POLICY IF EXISTS "platform_admin_all_daily_analytics" ON daily_analytics;
DROP POLICY IF EXISTS "org_based_hourly_analytics" ON hourly_analytics;
DROP POLICY IF EXISTS "org_based_daily_analytics" ON daily_analytics;

-- 2. Drop other existing platform_admin policies
DROP POLICY IF EXISTS "platform_admin_all_organizations" ON organizations;
DROP POLICY IF EXISTS "platform_admin_all_stores" ON stores;
DROP POLICY IF EXISTS "platform_admin_all_users" ON user_profiles;
DROP POLICY IF EXISTS "platform_admin_all_sensors" ON sensor_metadata;
DROP POLICY IF EXISTS "platform_admin_all_raw_data" ON people_counting_raw;

-- 3. Enable RLS on tables if not already enabled
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;

-- 4. Create platform_admin policies for analytics
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

-- 5. Organization-based access for other users
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
            AND role != 'platform_admin'
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
            AND role != 'platform_admin'
        )
    )
);

-- 6. Platform admin policies for other tables
CREATE POLICY "platform_admin_all_organizations" ON organizations
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

CREATE POLICY "platform_admin_all_stores" ON stores
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

CREATE POLICY "platform_admin_all_users" ON user_profiles
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

CREATE POLICY "platform_admin_all_sensors" ON sensor_metadata
FOR ALL TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

CREATE POLICY "platform_admin_all_raw_data" ON people_counting_raw
FOR SELECT TO authenticated
USING (auth.uid() IN (SELECT id FROM user_profiles WHERE role = 'platform_admin'));

-- 7. Verify all policies
SELECT 
    tablename,
    policyname,
    cmd,
    substring(qual, 1, 60) as policy_preview
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE '%platform_admin%'
ORDER BY tablename, policyname;

-- 8. Show current users and their access
SELECT 
    up.email,
    up.full_name,
    up.role::text,
    o.name as organization,
    CASE 
        WHEN up.role = 'platform_admin' THEN 'Full Platform Access'
        WHEN up.role = 'tenant_admin' THEN 'Organization Admin'
        ELSE up.role::text
    END as access_level
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('pedro@blipee.com', 'jmunoz@patrimi.com', 'jmelo@patrimi.com')
ORDER BY up.email;