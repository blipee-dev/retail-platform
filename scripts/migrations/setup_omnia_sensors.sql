-- Setup Omnia Sensors for New Tenant
-- This script creates a new organization and stores for the Omnia sensors

-- =====================================================
-- CREATE NEW ORGANIZATION
-- =====================================================

-- Insert Omnia organization (single tenant with multiple stores)
INSERT INTO organizations (id, name, slug, type, subscription_tier, is_active)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Omnia',
    'omnia',
    'retail',
    'enterprise',
    true
) ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- CREATE STORES
-- =====================================================

-- OML01 - Guimarães Shopping
INSERT INTO stores (id, organization_id, name, code, type, format, capacity, timezone, country_code, region)
VALUES (
    'f1234567-89ab-cdef-0123-456789abcdef',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Omnia Guimarães Shopping',
    'oml01-guimaraes',
    'retail',
    'shopping_center',
    500,
    'Europe/Lisbon',
    'PT',
    'Norte'
) ON CONFLICT (organization_id, code) DO NOTHING;

-- OML02 - Fórum Almada
INSERT INTO stores (id, organization_id, name, code, type, format, capacity, timezone, country_code, region)
VALUES (
    'f2345678-9abc-def0-1234-56789abcdef0',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Omnia Fórum Almada',
    'oml02-almada',
    'retail',
    'shopping_center',
    400,
    'Europe/Lisbon',
    'PT',
    'Lisboa'
) ON CONFLICT (organization_id, code) DO NOTHING;

-- OML03 - NorteShopping
INSERT INTO stores (id, organization_id, name, code, type, format, capacity, timezone, country_code, region)
VALUES (
    'f3456789-abcd-ef01-2345-6789abcdef01',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Omnia NorteShopping',
    'oml03-norteshopping',
    'retail',
    'shopping_center',
    800,
    'Europe/Lisbon',
    'PT',
    'Porto'
) ON CONFLICT (organization_id, code) DO NOTHING;

-- =====================================================
-- REGISTER SENSORS
-- =====================================================

-- OML01 Sensor
INSERT INTO sensor_metadata (
    id,
    organization_id,
    store_id,
    sensor_id,
    sensor_name,
    sensor_type,
    sensor_model,
    api_endpoint,
    configuration,
    line_config,
    is_active
) VALUES (
    'e1234567-89ab-cdef-0123-456789abcdef',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'f1234567-89ab-cdef-0123-456789abcdef',
    'oml01-guimaraes',
    'OML01-Omnia Guimarães Shopping',
    'milesight',
    'VS121',
    'http://93.108.96.96:21001/',
    '{"username": "admin", "password": "grnl.2024", "interval": 300}',
    '{"line1": "Main Entrance", "line2": "Secondary Entrance", "line3": "Exit Gate", "line4": "Street Passing"}',
    true
) ON CONFLICT (sensor_id) DO UPDATE SET
    api_endpoint = EXCLUDED.api_endpoint,
    configuration = EXCLUDED.configuration,
    is_active = EXCLUDED.is_active;

-- OML02 Sensor
INSERT INTO sensor_metadata (
    id,
    organization_id,
    store_id,
    sensor_id,
    sensor_name,
    sensor_type,
    sensor_model,
    api_endpoint,
    configuration,
    line_config,
    is_active
) VALUES (
    'e2345678-9abc-def0-1234-56789abcdef0',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'f2345678-9abc-def0-1234-56789abcdef0',
    'oml02-almada',
    'OML02-Omnia Fórum Almada',
    'milesight',
    'VS121',
    'http://188.37.175.41:2201/',
    '{"username": "admin", "password": "grnl.2024", "interval": 300}',
    '{"line1": "Main Entrance", "line2": "Secondary Entrance", "line3": "Exit Gate", "line4": "Street Passing"}',
    true
) ON CONFLICT (sensor_id) DO UPDATE SET
    api_endpoint = EXCLUDED.api_endpoint,
    configuration = EXCLUDED.configuration,
    is_active = EXCLUDED.is_active;

-- OML03 Sensor
INSERT INTO sensor_metadata (
    id,
    organization_id,
    store_id,
    sensor_id,
    sensor_name,
    sensor_type,
    sensor_model,
    api_endpoint,
    configuration,
    line_config,
    is_active
) VALUES (
    'e3456789-abcd-ef01-2345-6789abcdef01',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'f3456789-abcd-ef01-2345-6789abcdef01',
    'oml03-norteshopping',
    'OML03-Omnia NorteShopping',
    'milesight',
    'VS121',
    'http://188.37.124.33:21002/',
    '{"username": "admin", "password": "grnl.2024", "interval": 300}',
    '{"line1": "Main Entrance", "line2": "Secondary Entrance", "line3": "Exit Gate", "line4": "Street Passing"}',
    true
) ON CONFLICT (sensor_id) DO UPDATE SET
    api_endpoint = EXCLUDED.api_endpoint,
    configuration = EXCLUDED.configuration,
    is_active = EXCLUDED.is_active;

-- =====================================================
-- CREATE DEFAULT REGIONS (optional)
-- =====================================================

-- You can add default regions for each store here if needed
-- Example for OML01:
/*
INSERT INTO regions (store_id, organization_id, name, type, capacity)
VALUES 
    ('f1234567-89ab-cdef-0123-456789abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Main Entrance Area', 'entrance', 50),
    ('f1234567-89ab-cdef-0123-456789abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Central Plaza', 'browsing', 200),
    ('f1234567-89ab-cdef-0123-456789abcdef', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Food Court', 'service', 150);
*/

-- =====================================================
-- VERIFY SETUP
-- =====================================================

-- Check the setup
SELECT 
    o.name as organization,
    s.name as store,
    sm.sensor_name,
    sm.api_endpoint,
    sm.is_active
FROM sensor_metadata sm
JOIN stores s ON sm.store_id = s.id
JOIN organizations o ON sm.organization_id = o.id
WHERE o.slug = 'omnia'
ORDER BY sm.sensor_id;