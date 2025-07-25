-- Check how role permissions are implemented

-- 1. Check RLS policies that reference roles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND (qual LIKE '%role%' OR with_check LIKE '%role%')
ORDER BY tablename, policyname;

-- 2. Check if there's a permissions table
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%permission%';

-- 3. Check functions that might handle role-based access
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (prosrc LIKE '%tenant_admin%' 
    OR prosrc LIKE '%role%' 
    OR proname LIKE '%auth%'
    OR proname LIKE '%permission%')
LIMIT 10;

-- 4. Check the permissions JSON field usage
SELECT 
    role,
    COUNT(*) as user_count,
    jsonb_agg(DISTINCT permissions) as permission_examples
FROM user_profiles
WHERE permissions IS NOT NULL 
AND permissions::text != '{}'
GROUP BY role;

-- 5. Example of how platform_admin might be implemented in RLS
-- This is what you'd typically add for each table:
/*
-- Example RLS policy for platform_admin on stores table
CREATE POLICY "platform_admin_all_access" ON stores
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    )
);

-- Example RLS policy for platform_admin on organizations table
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
*/