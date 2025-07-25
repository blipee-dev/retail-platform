-- Insert Jesús's user profile
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
    '78c93392-f5c9-4037-8832-2dadb4c8885a'::UUID,  -- Jesús's auth.users.id
    'jmunoz@patrimi.com',
    'Jesús Muñoz Casas',
    'tenant_admin',
    '12345678-1234-1234-1234-123456789012'::UUID,  -- Jack & Jones org ID
    '{}',
    TRUE,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE
SET 
    full_name = EXCLUDED.full_name,
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    is_active = TRUE,
    updated_at = NOW();

-- Verify both users are now in the system
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name,
    up.is_active
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com')
ORDER BY up.email;