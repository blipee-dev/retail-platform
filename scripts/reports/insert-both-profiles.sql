-- Insert both user profiles
-- Replace JESUS_AUTH_ID with the actual auth.users.id for jmunoz@patrimi.com

-- First ensure the view exists (to avoid the error)
CREATE OR REPLACE VIEW user_org_lookup AS
SELECT 
    up.id as user_id,
    up.organization_id,
    up.role,
    o.name as organization_name
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id;

GRANT SELECT ON user_org_lookup TO authenticated;
GRANT SELECT ON user_org_lookup TO anon;

-- Get the Jack & Jones org ID
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Find Jack & Jones organization
    SELECT id INTO v_org_id
    FROM organizations
    WHERE name ILIKE '%Jack & Jones%' OR name ILIKE '%Jack%Jones%'
    LIMIT 1;
    
    -- If not found, use the known ID
    IF v_org_id IS NULL THEN
        v_org_id := '12345678-1234-1234-1234-123456789012'::UUID;
    END IF;
    
    -- Insert or update João
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
        'c0c47f72-f66e-48e8-9da7-55b9373a4ddf'::UUID,  -- João's auth ID
        'jmelo@patrimi.com',
        'João Célio Melo Pinta Moreira',
        'tenant_admin',
        v_org_id,
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
    
    RAISE NOTICE 'João profile created/updated';
    
    -- Insert or update Jesús (need to replace with actual auth ID)
    -- Uncomment and update when you have Jesús's auth.users.id
    /*
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
        'JESUS_AUTH_ID'::UUID,  -- Replace with Jesús's auth.users.id
        'jmunoz@patrimi.com',
        'Jesús Muñoz Casas',
        'tenant_admin',
        v_org_id,
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
    
    RAISE NOTICE 'Jesús profile created/updated';
    */
END $$;

-- Verify the results
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name,
    up.is_active
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');