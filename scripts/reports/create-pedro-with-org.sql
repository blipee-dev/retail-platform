-- Create Pedro's user profile
-- First, check if there's a platform/admin organization or create one

-- Option 1: Use an existing organization (get the first one)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Try to find a "Platform" or "Admin" organization first
    SELECT id INTO v_org_id
    FROM organizations
    WHERE name ILIKE '%platform%' OR name ILIKE '%admin%' OR name = 'Blipee'
    LIMIT 1;
    
    -- If not found, get any organization
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id
        FROM organizations
        LIMIT 1;
    END IF;
    
    -- If still no org, we need to create one
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (name, created_at, updated_at)
        VALUES ('Platform Administration', NOW(), NOW())
        RETURNING id INTO v_org_id;
        
        RAISE NOTICE 'Created Platform Administration organization: %', v_org_id;
    END IF;
    
    -- Now create Pedro's profile
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
        '3d2ad763-a659-4603-9913-5244dfeec28e'::UUID,  -- Pedro's auth.users.id
        'pedro@blipee.com',
        'Pedro',
        'tenant_admin',  -- Will change to platform_admin after adding the role
        v_org_id,  -- Using the organization we found/created
        '{"platform_admin": true}',  -- Mark as platform admin in permissions
        TRUE,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        organization_id = EXCLUDED.organization_id,
        permissions = EXCLUDED.permissions,
        is_active = TRUE,
        updated_at = NOW();
    
    RAISE NOTICE 'Created/updated Pedro with organization: %', v_org_id;
END $$;

-- Verify all users
SELECT 
    up.email,
    up.full_name,
    up.role,
    o.name as organization,
    up.permissions,
    up.is_active
FROM user_profiles up
LEFT JOIN organizations o ON up.organization_id = o.id
WHERE up.email IN ('pedro@blipee.com', 'jmunoz@patrimi.com', 'jmelo@patrimi.com')
ORDER BY up.email;