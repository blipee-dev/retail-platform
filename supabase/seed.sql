-- Seed data for testing the multi-tenant system

-- Insert a test organization
INSERT INTO organizations (id, name, slug, subscription_tier, subscription_status)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Demo Retail Corp', 'demo-retail', 'premium', 'active'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Test Store Chain', 'test-chain', 'free', 'trial');

-- Insert regions for Demo Retail Corp
INSERT INTO regions (id, organization_id, name, code)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'North Region', 'NORTH'),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'South Region', 'SOUTH');

-- Insert stores for Demo Retail Corp
INSERT INTO stores (id, organization_id, region_id, name, code, address, is_active)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Downtown Store', 'DT001', '123 Main St, Downtown', true),
  ('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Mall Location', 'ML001', '456 Shopping Center', true),
  ('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Airport Store', 'AP001', '789 Airport Terminal 2', true),
  ('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Suburb Outlet', 'SB001', '321 Suburb Plaza', false);

-- Note: User creation will happen through the auth flow
-- But here's test data structure for reference:

-- Test users (passwords will be set through Supabase Auth):
-- tenant_admin@demo.com - Tenant Admin for Demo Retail Corp
-- regional@demo.com - Regional Manager for North Region
-- store@demo.com - Store Manager for Downtown Store
-- analyst@demo.com - Analyst for Demo Retail Corp
-- staff@demo.com - Store Staff for Downtown Store
-- viewer@demo.com - Viewer for Demo Retail Corp