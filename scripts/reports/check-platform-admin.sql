-- Check for platform admin users
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.organization_id,
    o.name as organization_name,
    up.is_active,
    up.created_at
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.role = 'platform_admin'
ORDER BY up.created_at;

-- Check all available roles in the system
SELECT DISTINCT role, COUNT(*) as user_count
FROM user_profiles
GROUP BY role
ORDER BY 
    CASE 
        WHEN role = 'platform_admin' THEN 1
        WHEN role = 'tenant_admin' THEN 2
        ELSE 3
    END;

-- Check if pedro@blipee.com exists and what role they have
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name,
    up.is_active
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.email = 'pedro@blipee.com';

-- If you want to upgrade someone to platform_admin, use this:
-- UPDATE user_profiles 
-- SET role = 'platform_admin'
-- WHERE email = 'pedro@blipee.com';

-- Or create a new platform admin (need auth user first):
-- INSERT INTO auth.users (email, email_confirmed_at) 
-- VALUES ('admin@retailplatform.com', NOW())
-- RETURNING id;

-- Then create their profile with the returned ID