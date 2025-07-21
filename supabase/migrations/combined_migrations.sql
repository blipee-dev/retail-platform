-- ================================================
-- Combined Migrations for Retail Platform
-- Run this file in Supabase SQL Editor
-- ================================================

-- Enable UUID extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. USER ROLES ENUM
-- ================================================
CREATE TYPE user_role_enum AS ENUM (
    'tenant_admin',
    'regional_manager',
    'store_manager',
    'analyst',
    'store_staff',
    'viewer'
);

-- ================================================
-- 2. ORGANIZATIONS TABLE
-- ================================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 3. UPDATE FUNCTION AND USER PROFILES
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role_enum NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

CREATE INDEX idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 4. STORE HIERARCHY TABLES
-- ================================================
CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

CREATE TABLE user_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    UNIQUE(user_id, store_id)
);

CREATE TABLE user_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    UNIQUE(user_id, region_id)
);

-- Indexes
CREATE INDEX idx_regions_organization_id ON regions(organization_id);
CREATE INDEX idx_stores_organization_id ON stores(organization_id);
CREATE INDEX idx_stores_region_id ON stores(region_id);
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);
CREATE INDEX idx_user_regions_user_id ON user_regions(user_id);
CREATE INDEX idx_user_regions_region_id ON user_regions(region_id);

-- Enable RLS
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 5. HELPER FUNCTIONS
-- ================================================
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id AND organization_id = org_id
    );
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_organization_with_admin(
    org_name TEXT,
    org_slug TEXT,
    admin_user_id UUID,
    admin_email TEXT,
    admin_name TEXT
) RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    INSERT INTO organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    INSERT INTO user_profiles (id, organization_id, email, full_name, role)
    VALUES (admin_user_id, new_org_id, admin_email, admin_name, 'tenant_admin');
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role_enum AS $$
    SELECT role FROM user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_store_access(user_id UUID, store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles up
        LEFT JOIN user_stores us ON us.user_id = up.id
        LEFT JOIN user_regions ur ON ur.user_id = up.id
        LEFT JOIN stores s ON s.id = store_id
        WHERE up.id = user_id
        AND (
            up.role = 'tenant_admin' OR
            up.role = 'analyst' OR
            (up.role = 'regional_manager' AND s.region_id = ur.region_id) OR
            (up.role IN ('store_manager', 'store_staff', 'viewer') AND us.store_id = store_id)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6. RLS POLICIES
-- ================================================

-- Organizations policies
CREATE POLICY "Users see own organization" ON organizations
    FOR SELECT USING (id = get_user_organization_id(auth.uid()));

CREATE POLICY "Tenant admins can update organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id(auth.uid()) 
        AND get_user_role(auth.uid()) = 'tenant_admin'
    );

-- User profiles policies
CREATE POLICY "Users see profiles in same organization" ON user_profiles
    FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage user profiles" ON user_profiles
    FOR ALL USING (
        organization_id = get_user_organization_id(auth.uid())
        AND get_user_role(auth.uid()) IN ('tenant_admin', 'regional_manager', 'store_manager')
    );

-- Regions policies
CREATE POLICY "Users see regions in their organization" ON regions
    FOR SELECT USING (organization_id = get_user_organization_id(auth.uid()));

CREATE POLICY "Admins can manage regions" ON regions
    FOR ALL USING (
        organization_id = get_user_organization_id(auth.uid())
        AND get_user_role(auth.uid()) = 'tenant_admin'
    );

-- Stores policies
CREATE POLICY "Users see stores based on role" ON stores
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            get_user_role(auth.uid()) IN ('tenant_admin', 'analyst')
            OR
            (get_user_role(auth.uid()) = 'regional_manager' AND 
             EXISTS (
                SELECT 1 FROM user_regions ur
                WHERE ur.user_id = auth.uid()
                AND ur.region_id = stores.region_id
             ))
            OR
            EXISTS (
                SELECT 1 FROM user_stores us
                WHERE us.user_id = auth.uid()
                AND us.store_id = stores.id
            )
        )
    );

CREATE POLICY "Managers can update stores" ON stores
    FOR UPDATE USING (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            get_user_role(auth.uid()) = 'tenant_admin'
            OR
            (get_user_role(auth.uid()) = 'regional_manager' AND 
             EXISTS (
                SELECT 1 FROM user_regions ur
                WHERE ur.user_id = auth.uid()
                AND ur.region_id = stores.region_id
             ))
            OR
            (get_user_role(auth.uid()) = 'store_manager' AND
             EXISTS (
                SELECT 1 FROM user_stores us
                WHERE us.user_id = auth.uid()
                AND us.store_id = stores.id
             ))
        )
    );

-- Assignment policies
CREATE POLICY "Users see their own store assignments" ON user_stores
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        get_user_role(auth.uid()) IN ('tenant_admin', 'regional_manager')
    );

CREATE POLICY "Users see their own region assignments" ON user_regions
    FOR SELECT USING (
        user_id = auth.uid()
        OR
        get_user_role(auth.uid()) = 'tenant_admin'
    );

-- ================================================
-- 7. UPDATE TRIGGERS
-- ================================================
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_regions_updated_at 
    BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_stores_updated_at 
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- IMPORTANT: Sensor tables are in separate file
-- Run 20240120000007_create_sensor_tables.sql after this
-- ================================================