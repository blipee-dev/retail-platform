-- Safe version that checks for valid roles first
-- Create user profiles for Jesús Muñoz and João Melo

-- First check what roles are available
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_role TEXT;
BEGIN
    -- Find the Jack & Jones organization
    SELECT id INTO v_org_id
    FROM organizations
    WHERE name ILIKE '%Jack & Jones%' OR name ILIKE '%Jack%Jones%'
    LIMIT 1;
    
    -- If not found by name, use the known ID
    IF v_org_id IS NULL THEN
        v_org_id := '12345678-1234-1234-1234-123456789012'::UUID;
        
        -- Verify this organization exists
        IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) THEN
            RAISE EXCEPTION 'Jack & Jones organization not found with ID: %', v_org_id;
        END IF;
    END IF;
    
    RAISE NOTICE 'Found Jack & Jones organization: %', v_org_id;
    
    -- Determine the appropriate viewer role
    -- Try common role names in order of preference
    SELECT role INTO v_role
    FROM (
        VALUES 
            ('viewer'),
            ('org_viewer'),
            ('store_viewer'),
            ('user'),
            ('member')
    ) AS roles(role)
    WHERE role::text IN (
        SELECT unnest(enum_range(NULL::user_role_enum))::text
    )
    LIMIT 1;
    
    IF v_role IS NULL THEN
        -- If no common viewer role found, use the first available role
        SELECT unnest(enum_range(NULL::user_role_enum))::text INTO v_role LIMIT 1;
        RAISE NOTICE 'Using default role: %', v_role;
    ELSE
        RAISE NOTICE 'Using role: %', v_role;
    END IF;
    
    -- Create or update Jesús Muñoz
    INSERT INTO user_profiles (
        email,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at
    ) VALUES (
        'jmunoz@patrimi.com',
        'Jesús Muñoz Casas',
        v_role::user_role_enum,
        v_org_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id,
        updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created/updated user Jesús Muñoz: %', v_user_id;
    
    -- Create or update João Melo
    INSERT INTO user_profiles (
        email,
        full_name,
        role,
        organization_id,
        created_at,
        updated_at
    ) VALUES (
        'jmelo@patrimi.com',
        'João Célio Melo Pinta Moreira',
        v_role::user_role_enum,
        v_org_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        organization_id = EXCLUDED.organization_id,
        updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created/updated user João Melo: %', v_user_id;
    
END $$;

-- Verify the users were created
SELECT 
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');