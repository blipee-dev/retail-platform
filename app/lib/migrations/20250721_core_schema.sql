-- Core Schema Migration
-- This creates the foundational tables that all other tables depend on

-- =====================================================
-- ORGANIZATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    -- Organization details
    type VARCHAR(50) DEFAULT 'retail', -- 'retail', 'hospitality', 'healthcare', etc.
    size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
    
    -- Contact information
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    billing_email VARCHAR(255),
    
    -- Address
    address JSONB DEFAULT '{}',
    
    -- Settings
    settings JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]', -- Enabled features
    
    -- Subscription
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_active ON organizations(is_active);

-- =====================================================
-- STORES
-- =====================================================

CREATE TABLE IF NOT EXISTS stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Store identification
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL, -- Internal store code
    external_id VARCHAR(255), -- ID in external systems
    
    -- Store details
    type VARCHAR(50), -- 'retail', 'warehouse', 'popup', etc.
    format VARCHAR(50), -- 'supermarket', 'boutique', 'department', etc.
    size_sqm FLOAT,
    capacity INTEGER DEFAULT 200, -- Maximum safe capacity
    
    -- Location
    address JSONB DEFAULT '{}',
    timezone VARCHAR(100) DEFAULT 'UTC',
    country_code VARCHAR(2),
    region VARCHAR(100),
    
    -- Operating hours
    operating_hours JSONB DEFAULT '{}', -- {monday: {open: "09:00", close: "21:00"}, ...}
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    alert_settings JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    opened_date DATE,
    closed_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(organization_id, code)
);

CREATE INDEX IF NOT EXISTS idx_stores_org ON stores(organization_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_stores_code ON stores(code);

-- =====================================================
-- PROFILES (extends Supabase auth.users)
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    
    -- User details
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    phone VARCHAR(50),
    
    -- Role and permissions
    role VARCHAR(50) DEFAULT 'viewer', -- 'tenant_admin', 'regional_manager', 'store_manager', 'analyst', 'store_staff', 'viewer'
    permissions JSONB DEFAULT '[]',
    
    -- Assignment
    assigned_stores JSONB DEFAULT '[]', -- Array of store IDs
    assigned_regions JSONB DEFAULT '[]', -- Array of region codes
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    locale VARCHAR(10) DEFAULT 'en',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(organization_id, role);

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default organization for development
INSERT INTO organizations (id, name, slug, type, subscription_tier)
VALUES (
    'b2b39c7f-8c6e-4b8a-9c4a-5e8f7a9b2d4c',
    'Demo Retail Company',
    'demo-retail',
    'retail',
    'free'
) ON CONFLICT (slug) DO NOTHING;

-- Insert J&J store
INSERT INTO stores (id, organization_id, name, code, type, format, capacity, timezone)
VALUES (
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    'b2b39c7f-8c6e-4b8a-9c4a-5e8f7a9b2d4c',
    'J&J Arrábida',
    'jj-01-arrabida',
    'retail',
    'fashion',
    200,
    'Europe/Lisbon'
) ON CONFLICT (organization_id, code) DO NOTHING;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE organizations IS 'Top-level tenant/organization in the multi-tenant system';
COMMENT ON TABLE stores IS 'Physical locations/stores belonging to organizations';
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth with organization context';

COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for the organization';
COMMENT ON COLUMN stores.capacity IS 'Maximum safe occupancy for the store';
COMMENT ON COLUMN stores.operating_hours IS 'JSON object with days as keys and {open, close} times';
COMMENT ON COLUMN profiles.role IS 'User role determining access level within organization';
COMMENT ON COLUMN profiles.assigned_stores IS 'Array of store IDs the user has access to';