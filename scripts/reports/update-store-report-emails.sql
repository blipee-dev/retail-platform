-- Update Jack & Jones stores to include report email recipients
-- This is a simpler solution that doesn't require auth users

DO $$
DECLARE
    v_org_id UUID;
    v_store_count INTEGER;
BEGIN
    -- Find the Jack & Jones organization
    SELECT id INTO v_org_id
    FROM organizations
    WHERE name ILIKE '%Jack & Jones%' OR name ILIKE '%Jack%Jones%'
    LIMIT 1;
    
    -- If not found by name, use the known ID
    IF v_org_id IS NULL THEN
        v_org_id := '12345678-1234-1234-1234-123456789012'::UUID;
    END IF;
    
    -- Update all Jack & Jones stores to include the report emails
    UPDATE stores
    SET report_emails = 'pedro@blipee.com,jmunoz@patrimi.com,jmelo@patrimi.com',
        updated_at = NOW()
    WHERE organization_id = v_org_id
    AND is_active = TRUE;
    
    GET DIAGNOSTICS v_store_count = ROW_COUNT;
    
    RAISE NOTICE 'Updated % Jack & Jones stores with report recipients', v_store_count;
    
    -- Show the updated stores
    RAISE NOTICE 'Updated stores:';
    FOR v_store_count IN 
        SELECT name, report_emails 
        FROM stores 
        WHERE organization_id = v_org_id 
        AND is_active = TRUE
    LOOP
        RAISE NOTICE '  - %', v_store_count;
    END LOOP;
END $$;

-- Verify the updates
SELECT 
    s.name as store_name,
    s.report_emails,
    o.name as organization_name
FROM stores s
JOIN organizations o ON s.organization_id = o.id
WHERE o.name ILIKE '%Jack & Jones%'
AND s.is_active = TRUE;