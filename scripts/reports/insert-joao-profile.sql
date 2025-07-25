-- Insert João's user profile using his auth user ID
-- First create the missing view if needed
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

-- Now insert João's profile
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
    'c0c47f72-f66e-48e8-9da7-55b9373a4ddf'::UUID,  -- João's auth.users.id
    'jmelo@patrimi.com',
    'João Célio Melo Pinta Moreira',
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
    is_active = TRUE,
    updated_at = NOW();

-- Verify it worked
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name,
    up.is_active
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email = 'jmelo@patrimi.com';