-- Check for references to user_org_lookup

-- 1. Check if user_org_lookup exists as a table or view
SELECT 
    schemaname,
    tablename as name,
    'table' as type
FROM pg_tables 
WHERE tablename = 'user_org_lookup'
UNION ALL
SELECT 
    schemaname,
    viewname as name,
    'view' as type
FROM pg_views 
WHERE viewname = 'user_org_lookup';

-- 2. Check for triggers that might reference it
SELECT 
    tgname as trigger_name,
    relname as table_name,
    pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND pg_get_triggerdef(t.oid) LIKE '%user_org_lookup%';

-- 3. Check RLS policies
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
AND (qual LIKE '%user_org_lookup%' OR with_check LIKE '%user_org_lookup%');

-- 4. Try to create the missing view (if it's supposed to be a view)
-- This is a common pattern for RLS
CREATE OR REPLACE VIEW user_org_lookup AS
SELECT 
    up.id as user_id,
    up.organization_id,
    up.role,
    o.name as organization_name
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id;

-- Grant permissions
GRANT SELECT ON user_org_lookup TO authenticated;
GRANT SELECT ON user_org_lookup TO anon;