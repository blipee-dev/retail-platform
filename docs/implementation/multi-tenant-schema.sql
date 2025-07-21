-- Multi-Tenant Database Schema for Retail Platform MVP
-- This schema implements complete tenant isolation with Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TENANT TABLES
-- =====================================================

-- Organizations (Tenants) table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization invitations for new users
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL,
    invited_by UUID NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, email)
);

-- =====================================================
-- USER MANAGEMENT WITH TENANT SUPPORT
-- =====================================================

-- User profiles with organization association
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

-- =====================================================
-- STORE MANAGEMENT WITH TENANT ISOLATION
-- =====================================================

-- Regions belong to organizations
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

-- Stores belong to organizations
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

-- User assignments to stores (for store managers, staff, viewers)
CREATE TABLE user_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    UNIQUE(user_id, store_id)
);

-- User assignments to regions (for regional managers)
CREATE TABLE user_regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES user_profiles(id),
    UNIQUE(user_id, region_id)
);

-- =====================================================
-- SENSOR DATA WITH TENANT ISOLATION
-- =====================================================

-- Sensors belong to stores (and thus organizations)
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL, -- Denormalized for performance
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Sensor data with tenant isolation
CREATE TABLE sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL, -- Denormalized for performance
    store_id UUID NOT NULL, -- Denormalized for performance
    data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_sensor_data_org_timestamp ON sensor_data(organization_id, timestamp DESC);
CREATE INDEX idx_sensor_data_store_timestamp ON sensor_data(store_id, timestamp DESC);
CREATE INDEX idx_sensor_data_sensor_timestamp ON sensor_data(sensor_id, timestamp DESC);

-- =====================================================
-- AUDIT LOG FOR COMPLIANCE
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
    SELECT organization_id FROM user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_organization(user_id UUID, org_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = user_id AND organization_id = org_id
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users see own organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization_id(auth.uid())
    );

-- User profiles: Users can see profiles in their organization
CREATE POLICY "Users see profiles in same organization" ON user_profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

-- Stores: Users see stores based on their role
CREATE POLICY "Users see stores based on role" ON stores
    FOR ALL USING (
        organization_id = get_user_organization_id(auth.uid())
        AND (
            -- Tenant admins and analysts see all stores
            EXISTS (
                SELECT 1 FROM user_profiles
                WHERE id = auth.uid()
                AND role IN ('tenant_admin', 'analyst')
            )
            OR
            -- Regional managers see stores in their regions
            EXISTS (
                SELECT 1 FROM user_regions ur
                WHERE ur.user_id = auth.uid()
                AND ur.region_id = stores.region_id
            )
            OR
            -- Store managers, staff, and viewers see assigned stores
            EXISTS (
                SELECT 1 FROM user_stores us
                WHERE us.user_id = auth.uid()
                AND us.store_id = stores.id
            )
        )
    );

-- Sensors: Same access as stores
CREATE POLICY "Users see sensors in accessible stores" ON sensors
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
        AND EXISTS (
            SELECT 1 FROM stores
            WHERE stores.id = sensors.store_id
            -- This will cascade the store access policy
        )
    );

-- Sensor data: Same access as sensors
CREATE POLICY "Users see sensor data from accessible sensors" ON sensor_data
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
        AND EXISTS (
            SELECT 1 FROM sensors
            WHERE sensors.id = sensor_data.sensor_id
            -- This will cascade the sensor access policy
        )
    );

-- =====================================================
-- HELPER FUNCTIONS FOR APPLICATION
-- =====================================================

-- Function to create a new organization with first admin user
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
    -- Create organization
    INSERT INTO organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO new_org_id;
    
    -- Create admin user profile
    INSERT INTO user_profiles (id, organization_id, email, full_name, role)
    VALUES (admin_user_id, new_org_id, admin_email, admin_name, 'tenant_admin');
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    user_id UUID,
    resource_type TEXT,
    resource_id UUID,
    action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_role user_role_enum;
    user_org_id UUID;
BEGIN
    -- Get user role and organization
    SELECT role, organization_id INTO user_role, user_org_id
    FROM user_profiles
    WHERE id = user_id;
    
    -- Tenant admins can do everything in their organization
    IF user_role = 'tenant_admin' THEN
        RETURN true;
    END IF;
    
    -- Implement specific permission logic based on role and resource
    -- This is simplified - expand based on your needs
    CASE resource_type
        WHEN 'store' THEN
            -- Check store-specific permissions
            RETURN check_store_permission(user_id, resource_id, action);
        WHEN 'user' THEN
            -- Check user management permissions
            RETURN check_user_management_permission(user_id, user_role, action);
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INITIAL DATA AND TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();