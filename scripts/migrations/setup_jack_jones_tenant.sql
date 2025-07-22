-- Setup Jack & Jones Tenant
-- This script creates the Jack & Jones organization and updates the existing J&J store

-- =====================================================
-- CREATE JACK & JONES ORGANIZATION
-- =====================================================

-- Insert Jack & Jones organization
INSERT INTO organizations (id, name, slug, type, subscription_tier, is_active)
VALUES (
    'c1d2e3f4-5678-90ab-cdef-123456789012',
    'Jack & Jones',
    'jack-and-jones',
    'retail',
    'professional',
    true
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- UPDATE EXISTING J&J STORE TO NEW TENANT
-- =====================================================

-- Update the J&J Arrábida store to belong to Jack & Jones organization
UPDATE stores 
SET 
    organization_id = 'c1d2e3f4-5678-90ab-cdef-123456789012',
    name = 'Jack & Jones Arrábida',
    format = 'fashion_retail',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'jj-01-arrabida';

-- =====================================================
-- UPDATE SENSOR METADATA
-- =====================================================

-- Update sensor to belong to Jack & Jones organization
UPDATE sensor_metadata
SET 
    organization_id = 'c1d2e3f4-5678-90ab-cdef-123456789012',
    updated_at = CURRENT_TIMESTAMP
WHERE sensor_id IN ('jj-01-arrabida', 'jj_01_arrábida', 'jj_01_arrabida');

-- =====================================================
-- UPDATE ANY EXISTING DATA TO NEW ORGANIZATION
-- =====================================================

-- Update people counting raw data
UPDATE people_counting_raw
SET organization_id = 'c1d2e3f4-5678-90ab-cdef-123456789012'
WHERE store_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Update people counting processed data
UPDATE people_counting_data
SET organization_id = 'c1d2e3f4-5678-90ab-cdef-123456789012'
WHERE store_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Update hourly analytics
UPDATE hourly_analytics
SET organization_id = 'c1d2e3f4-5678-90ab-cdef-123456789012'
WHERE store_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- Update any alerts
UPDATE analytics_alerts
SET organization_id = 'c1d2e3f4-5678-90ab-cdef-123456789012'
WHERE store_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

-- =====================================================
-- CLEAN UP OLD DEMO ORGANIZATION (optional)
-- =====================================================

-- Remove the demo organization if it has no other stores
DELETE FROM organizations 
WHERE slug = 'demo-retail' 
AND NOT EXISTS (
    SELECT 1 FROM stores 
    WHERE organization_id = organizations.id
);

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check the setup
SELECT 
    o.name as organization,
    o.slug as org_slug,
    s.name as store,
    s.code as store_code,
    sm.sensor_name,
    sm.api_endpoint
FROM sensor_metadata sm
JOIN stores s ON sm.store_id = s.id
JOIN organizations o ON sm.organization_id = o.id
ORDER BY o.name, s.name;

-- Summary by organization
SELECT 
    o.name as organization,
    COUNT(DISTINCT s.id) as store_count,
    COUNT(DISTINCT sm.id) as sensor_count
FROM organizations o
LEFT JOIN stores s ON s.organization_id = o.id
LEFT JOIN sensor_metadata sm ON sm.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.name;