-- Create user profiles for Jesús Muñoz and João Melo
-- Run this in Supabase SQL Editor
-- NOTE: This only creates user_profiles entries. The users need to sign up via the app to create auth.users entries.

-- First, find the JJ organization
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_auth_user_id UUID;
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
    
    -- Find auth user for Jesús
    SELECT id INTO v_auth_user_id FROM auth.users WHERE email = 'jmunoz@patrimi.com';
    
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found for jmunoz@patrimi.com. Please create the auth user first.';
    END IF;
    
    -- Check if Jesús already exists in user_profiles
    SELECT id INTO v_user_id FROM user_profiles WHERE email = 'jmunoz@patrimi.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE user_profiles 
        SET full_name = 'Jesús Muñoz Casas',
            organization_id = v_org_id,
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = v_user_id;
        RAISE NOTICE 'Updated existing user Jesús Muñoz: %', v_user_id;
    ELSE
        -- Create new user profile using auth user id
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
            v_auth_user_id,  -- Use the auth user ID
            'jmunoz@patrimi.com',
            'Jesús Muñoz Casas',
            'tenant_admin',
            v_org_id,
            '{}',
            TRUE,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Created new user Jesús Muñoz: %', v_user_id;
    END IF;
    
    -- Find auth user for João
    SELECT id INTO v_auth_user_id FROM auth.users WHERE email = 'jmelo@patrimi.com';
    
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found for jmelo@patrimi.com. Please create the auth user first.';
    END IF;
    
    -- Check if João already exists in user_profiles
    SELECT id INTO v_user_id FROM user_profiles WHERE email = 'jmelo@patrimi.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE user_profiles 
        SET full_name = 'João Célio Melo Pinta Moreira',
            organization_id = v_org_id,
            is_active = TRUE,
            updated_at = NOW()
        WHERE id = v_user_id;
        RAISE NOTICE 'Updated existing user João Melo: %', v_user_id;
    ELSE
        -- Create new user profile using auth user id
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
            v_auth_user_id,  -- Use the auth user ID
            'jmelo@patrimi.com',
            'João Célio Melo Pinta Moreira',
            'tenant_admin',
            v_org_id,
            '{}',
            TRUE,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'Created new user João Melo: %', v_user_id;
    END IF;
    
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