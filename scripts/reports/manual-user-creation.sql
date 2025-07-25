-- Manual SQL commands to create users
-- Run these one by one if the automated scripts fail

-- 1. First check if users already exist
SELECT id, email, full_name, role, organization_id 
FROM user_profiles 
WHERE email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');

-- 2. If Jesús doesn't exist, create him:
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'jmunoz@patrimi.com',
    'Jesús Muñoz Casas',
    'viewer', -- Change this to match your role enum
    '12345678-1234-1234-1234-123456789012'::UUID, -- Jack & Jones org ID
    NOW(),
    NOW()
);

-- 3. If João doesn't exist, create him:
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    role,
    organization_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'jmelo@patrimi.com',
    'João Célio Melo Pinta Moreira',
    'viewer', -- Change this to match your role enum
    '12345678-1234-1234-1234-123456789012'::UUID, -- Jack & Jones org ID
    NOW(),
    NOW()
);

-- 4. If they exist but need updating:
UPDATE user_profiles 
SET full_name = 'Jesús Muñoz Casas',
    organization_id = '12345678-1234-1234-1234-123456789012'::UUID,
    updated_at = NOW()
WHERE email = 'jmunoz@patrimi.com';

UPDATE user_profiles 
SET full_name = 'João Célio Melo Pinta Moreira',
    organization_id = '12345678-1234-1234-1234-123456789012'::UUID,
    updated_at = NOW()
WHERE email = 'jmelo@patrimi.com';

-- 5. Verify the results
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');