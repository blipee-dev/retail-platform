-- Create user profiles for Jesús Muñoz and João Melo
-- Run this in Supabase SQL Editor

-- First, find the JJ organization
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
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
    
    -- Create or update Jesús Muñoz
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
        'org_viewer',
        v_org_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        updated_at = NOW()
    RETURNING id INTO v_user_id;
    
    RAISE NOTICE 'Created/updated user Jesús Muñoz: %', v_user_id;
    
    -- Create or update João Melo
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
        'org_viewer',
        v_org_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (email) DO UPDATE
    SET full_name = EXCLUDED.full_name,
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