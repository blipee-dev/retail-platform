-- Fix RLS for analytics tables
-- These tables currently have no security policies!

-- 1. Enable RLS on analytics tables
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- 2. Platform Admin - Full access to all analytics
-- Using tenant_admin with NULL organization_id as platform admin
CREATE POLICY "platform_admin_all_hourly_analytics" ON hourly_analytics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'tenant_admin'
        AND organization_id IS NULL
    )
);

CREATE POLICY "platform_admin_all_daily_analytics" ON daily_analytics
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'tenant_admin'
        AND organization_id IS NULL
    )
);

-- 3. Organization-based access - Users can only see analytics for stores in their organization
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
        )
    )
);

-- 4. Verify the policies were created
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('hourly_analytics', 'daily_analytics')
ORDER BY tablename, policyname;

-- 5. Test the policies
-- As Pedro (platform_admin): Should see ALL analytics
-- As Jesús/João (tenant_admin): Should only see Jack & Jones store analytics
-- As any other org user: Should only see their org's analytics