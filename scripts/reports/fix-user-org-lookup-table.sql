-- Drop the view if it exists
DROP VIEW IF EXISTS user_org_lookup;

-- Create user_org_lookup as a TABLE instead of a view
CREATE TABLE IF NOT EXISTS user_org_lookup (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_user_org_lookup_org_id ON user_org_lookup(organization_id);

-- Grant permissions
GRANT SELECT ON user_org_lookup TO authenticated;
GRANT SELECT ON user_org_lookup TO anon;
GRANT INSERT, UPDATE, DELETE ON user_org_lookup TO authenticated;

-- Populate the table with existing data
INSERT INTO user_org_lookup (user_id, organization_id)
SELECT id, organization_id 
FROM user_profiles 
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE 
SET organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

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