-- Create Pedro's user profile as platform_admin
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    permissions,
    is_active,
    created_at,
    updated_at
) VALUES (
    '3d2ad763-a659-4603-9913-5244dfeec28e'::UUID,  -- Pedro's auth.users.id
    'pedro@blipee.com',
    'Pedro',  -- Update with full name if needed
    'tenant_admin',  -- Using tenant_admin with NULL org as platform admin for now
    NULL,  -- Platform admins don't belong to a specific organization
    '{}',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    organization_id = NULL,  -- Ensure platform admin has no org restriction
    is_active = TRUE,
    updated_at = NOW();

-- Verify all three users are set up correctly
SELECT 
    up.email,
    up.full_name,
    up.role,
    COALESCE(o.name, '🌐 Platform Level') as organization,
    up.is_active,
    CASE 
        WHEN up.role = 'platform_admin' THEN '🔴 Full Platform Access'
        WHEN up.role = 'tenant_admin' THEN '🟠 Organization Admin'
        ELSE up.role
    END as access_level
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('pedro@blipee.com', 'jmunoz@patrimi.com', 'jmelo@patrimi.com')
ORDER BY 
    CASE 
        WHEN up.role = 'platform_admin' THEN 1
        WHEN up.role = 'tenant_admin' THEN 2
        ELSE 3
    END;