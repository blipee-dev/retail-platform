-- Create User Accounts for Each Tenant
-- Run this after creating users in Supabase Auth

-- Example users (you'll need to create these in Supabase Auth first):
-- jack.admin@jackjones.com - Jack & Jones admin
-- omnia.admin@omnia.pt - Omnia admin
-- store.manager.jj@jackjones.com - J&J store manager
-- store.manager.guimaraes@omnia.pt - Guimarães store manager

-- After creating users in Supabase Auth, run this to set up their profiles:

-- Jack & Jones Admin
INSERT INTO user_profiles (id, email, full_name, organization_id, role, assigned_stores)
SELECT 
    id,
    email,
    'Jack Jones Admin',
    'c1d2e3f4-5678-90ab-cdef-123456789012',
    'tenant_admin',
    '["f47ac10b-58cc-4372-a567-0e02b2c3d479"]'::jsonb
FROM auth.users
WHERE email = 'jack.admin@jackjones.com'
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    assigned_stores = EXCLUDED.assigned_stores;

-- Omnia Admin
INSERT INTO user_profiles (id, email, full_name, organization_id, role, assigned_stores)
SELECT 
    id,
    email,
    'Omnia Admin',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'tenant_admin',
    '["f1234567-89ab-cdef-0123-456789abcdef", "f2345678-9abc-def0-1234-56789abcdef0", "f3456789-abcd-ef01-2345-6789abcdef01"]'::jsonb
FROM auth.users
WHERE email = 'omnia.admin@omnia.pt'
ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    assigned_stores = EXCLUDED.assigned_stores;