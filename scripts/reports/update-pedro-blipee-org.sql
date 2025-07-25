-- Create or find blipee organization and update Pedro

DO $$
DECLARE
    v_blipee_org_id UUID;
    v_pedro_id UUID;
BEGIN
    -- Find Pedro's user profile ID
    SELECT id INTO v_pedro_id
    FROM user_profiles
    WHERE email = 'pedro@blipee.com';
    
    IF v_pedro_id IS NULL THEN
        RAISE EXCEPTION 'Pedro user profile not found';
    END IF;
    
    -- Check if blipee organization exists
    SELECT id INTO v_blipee_org_id
    FROM organizations
    WHERE LOWER(name) = 'blipee';
    
    -- If not found, create it
    IF v_blipee_org_id IS NULL THEN
        INSERT INTO organizations (
            name, 
            slug,
            settings,
            subscription_tier,
            subscription_status,
            created_at, 
            updated_at
        )
        VALUES (
            'blipee',
            'blipee',
            '{}',
            'free',
            'active',
            NOW(), 
            NOW()
        )
        RETURNING id INTO v_blipee_org_id;
        
        RAISE NOTICE 'Created blipee organization: %', v_blipee_org_id;
    ELSE
        RAISE NOTICE 'Found existing blipee organization: %', v_blipee_org_id;
    END IF;
    
    -- Update Pedro to belong to blipee organization
    UPDATE user_profiles
    SET organization_id = v_blipee_org_id,
        updated_at = NOW()
    WHERE id = v_pedro_id;
    
    RAISE NOTICE 'Updated Pedro to blipee organization';
END $$;

-- Verify the update
SELECT 
    up.email,
    up.full_name,
    up.role::text as role,
    o.name as organization,
    up.permissions,
    CASE 
        WHEN up.role = 'platform_admin' THEN 'Platform Administrator'
        WHEN up.role = 'tenant_admin' AND o.name = 'blipee' THEN 'Blipee Admin'
        WHEN up.role = 'tenant_admin' THEN 'Organization Admin'
        ELSE up.role::text
    END as access_description
FROM user_profiles up
JOIN organizations o ON up.organization_id = o.id
WHERE up.email = 'pedro@blipee.com';

-- Show all organizations for reference
SELECT 
    o.id,
    o.name,
    COUNT(DISTINCT s.id) as store_count,
    COUNT(DISTINCT up.id) as user_count
FROM organizations o
LEFT JOIN stores s ON s.organization_id = o.id
LEFT JOIN user_profiles up ON up.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.name;