-- Setup permissions for platform_admin role
-- Run this after adding the platform_admin role to the enum

-- First, let's check what tables need RLS policies
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Create RLS policies for platform_admin
-- These give platform_admin users access to ALL data

-- 1. Organizations - full access
CREATE POLICY "platform_admin_all_orgs" ON organizations
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- 2. Stores - full access
CREATE POLICY "platform_admin_all_stores" ON stores
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- 3. User profiles - full access
CREATE POLICY "platform_admin_all_users" ON user_profiles
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles up
        WHERE up.id = auth.uid()
        AND up.role = 'platform_admin'
    )
);

-- 4. Sensor metadata - full access
CREATE POLICY "platform_admin_all_sensors" ON sensor_metadata
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- 5. Analytics tables - full read access
CREATE POLICY "platform_admin_read_analytics" ON hourly_analytics
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

CREATE POLICY "platform_admin_read_daily_analytics" ON daily_analytics
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- 6. Raw data - full read access
CREATE POLICY "platform_admin_read_raw_data" ON people_counting_raw
FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- Summary of platform_admin permissions:
-- ✅ Can view/edit ALL organizations
-- ✅ Can view/edit ALL stores
-- ✅ Can view/edit ALL users
-- ✅ Can view/edit ALL sensors
-- ✅ Can view ALL analytics data
-- ✅ Can view ALL raw sensor data
-- ✅ Bypasses all organization-based restrictions

-- To test: Login as pedro@blipee.com and verify access to all data