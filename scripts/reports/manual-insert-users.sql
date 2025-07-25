-- Manual user profile creation
-- Run these queries one by one to avoid trigger issues

-- 1. First, check if the auth users exist and get their IDs
SELECT id, email 
FROM auth.users 
WHERE email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');

-- 2. Check current user_profiles
SELECT id, email, full_name, role, organization_id 
FROM user_profiles 
WHERE email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');

-- 3. Get the Jack & Jones organization ID
SELECT id, name 
FROM organizations 
WHERE name ILIKE '%Jack%Jones%';

-- 4. If users don't exist in user_profiles, insert them manually
-- Replace the IDs with the actual values from the queries above

-- For Jesús (replace AUTH_USER_ID_JESUS with actual ID from step 1)
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
    'AUTH_USER_ID_JESUS',  -- Replace with actual auth.users.id
    'jmunoz@patrimi.com',
    'Jesús Muñoz Casas',
    'tenant_admin',
    '12345678-1234-1234-1234-123456789012',  -- Replace with actual org ID
    '{}',
    TRUE,
    NOW(),
    NOW()
);

-- For João (replace AUTH_USER_ID_JOAO with actual ID from step 1)
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
    'AUTH_USER_ID_JOAO',  -- Replace with actual auth.users.id
    'jmelo@patrimi.com',
    'João Célio Melo Pinta Moreira',
    'tenant_admin',
    '12345678-1234-1234-1234-123456789012',  -- Replace with actual org ID
    '{}',
    TRUE,
    NOW(),
    NOW()
);

-- 5. Verify the insertion
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');