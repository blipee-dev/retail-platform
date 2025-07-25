-- Add platform_admin role to user_role_enum
-- This must be run as a superuser or database owner

-- First, check current roles
SELECT unnest(enum_range(NULL::user_role_enum)) as current_roles
ORDER BY 1;

-- Add the new role to the enum
ALTER TYPE user_role_enum ADD VALUE 'platform_admin' AFTER 'tenant_admin';

-- Verify the new role was added
SELECT unnest(enum_range(NULL::user_role_enum)) as updated_roles
ORDER BY 1;

-- Now you can update Pedro to use the new role
UPDATE user_profiles 
SET role = 'platform_admin',
    updated_at = NOW()
WHERE email = 'pedro@blipee.com';

-- Verify the update
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    COALESCE(o.name, 'Platform Level') as organization,
    up.is_active
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('pedro@blipee.com', 'jmunoz@patrimi.com', 'jmelo@patrimi.com')
ORDER BY 
    CASE 
        WHEN up.role = 'platform_admin' THEN 1
        WHEN up.role = 'tenant_admin' THEN 2
        ELSE 3
    END,
    up.email;

-- Note: If you want to position it differently or need more control,
-- you might need to recreate the enum type, which is more complex