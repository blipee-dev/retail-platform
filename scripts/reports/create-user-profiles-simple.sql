-- Simple version that checks for existing users first
-- Create user profiles for Jesús Muñoz and João Melo

DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_existing_id UUID;
BEGIN
    -- Use the Jack & Jones organization ID directly
    v_org_id := '12345678-1234-1234-1234-123456789012'::UUID;
    
    -- Verify this organization exists
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = v_org_id) THEN
        RAISE EXCEPTION 'Jack & Jones organization not found with ID: %', v_org_id;
    END IF;
    
    RAISE NOTICE 'Using Jack & Jones organization: %', v_org_id;
    
    -- Handle Jesús Muñoz
    SELECT id INTO v_existing_id FROM user_profiles WHERE email = 'jmunoz@patrimi.com';
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing user
        UPDATE user_profiles 
        SET full_name = 'Jesús Muñoz Casas',
            organization_id = v_org_id,
            updated_at = NOW()
        WHERE id = v_existing_id;
        RAISE NOTICE 'Updated existing user Jesús Muñoz: %', v_existing_id;
    ELSE
        -- Create new user
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
            'viewer',
            v_org_id,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Created new user Jesús Muñoz: %', v_user_id;
    END IF;
    
    -- Handle João Melo
    SELECT id INTO v_existing_id FROM user_profiles WHERE email = 'jmelo@patrimi.com';
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing user
        UPDATE user_profiles 
        SET full_name = 'João Célio Melo Pinta Moreira',
            organization_id = v_org_id,
            updated_at = NOW()
        WHERE id = v_existing_id;
        RAISE NOTICE 'Updated existing user João Melo: %', v_existing_id;
    ELSE
        -- Create new user
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
            'viewer',
            v_org_id,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Created new user João Melo: %', v_user_id;
    END IF;
    
END $$;

-- Verify the users were created/updated
SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    o.name as organization_name
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('jmunoz@patrimi.com', 'jmelo@patrimi.com');