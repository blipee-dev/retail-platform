-- ================================================
-- Safe Combined Migrations for Retail Platform
-- This version checks for existing objects before creating
-- ================================================

-- Enable UUID extension first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. USER ROLES ENUM (Safe version)
-- ================================================
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'tenant_admin',
        'regional_manager',
        'store_manager',
        'analyst',
        'store_staff',
        'viewer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================================
-- 2. ORGANIZATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS organizations (
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

-- Create indexes if they don't exist
DO $$ BEGIN
    CREATE INDEX idx_organizations_slug ON organizations(slug);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_organizations_status ON organizations(subscription_status);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

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

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role_enum NOT NULL,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$ BEGIN
    CREATE INDEX idx_user_profiles_org ON user_profiles(organization_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_user_profiles_role ON user_profiles(role);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_user_profiles_email ON user_profiles(email);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- 4. STORE HIERARCHY TABLES
-- ================================================
CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    manager_id UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    region_id UUID REFERENCES regions(id),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    address TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    manager_id UUID REFERENCES user_profiles(id),
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create indexes
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE INDEX idx_regions_org ON regions(organization_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_stores_org ON stores(organization_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_stores_region ON stores(region_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create triggers
DROP TRIGGER IF EXISTS update_regions_updated_at ON regions;
CREATE TRIGGER update_regions_updated_at
    BEFORE UPDATE ON regions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- 5. HELPER FUNCTIONS
-- ================================================
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (
        id,
        email,
        full_name,
        role,
        organization_id
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')::user_role_enum,
        COALESCE(
            (NEW.raw_user_meta_data->>'organization_id')::UUID,
            (SELECT id FROM organizations LIMIT 1)
        )
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- ================================================
-- 6. RLS POLICIES
-- ================================================

-- Organizations policies
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id = get_user_organization_id(auth.uid())
    );

DROP POLICY IF EXISTS "Tenant admins can update their organization" ON organizations;
CREATE POLICY "Tenant admins can update their organization" ON organizations
    FOR UPDATE USING (
        id = get_user_organization_id(auth.uid()) AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'tenant_admin'
        )
    );

-- User profiles policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
CREATE POLICY "Users can view profiles in their organization" ON user_profiles
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage profiles in their organization" ON user_profiles;
CREATE POLICY "Admins can manage profiles in their organization" ON user_profiles
    FOR ALL USING (
        organization_id = get_user_organization_id(auth.uid()) AND
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('tenant_admin', 'regional_manager')
        )
    );

-- Regions policies
DROP POLICY IF EXISTS "Users can view regions in their organization" ON regions;
CREATE POLICY "Users can view regions in their organization" ON regions
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

-- Stores policies  
DROP POLICY IF EXISTS "Users can view stores in their organization" ON stores;
CREATE POLICY "Users can view stores in their organization" ON stores
    FOR SELECT USING (
        organization_id = get_user_organization_id(auth.uid())
    );

-- ================================================
-- 7. SENSOR DATA TABLES
-- ================================================
CREATE TABLE IF NOT EXISTS sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'milesight', 'omnia', etc.
    location VARCHAR(255),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_data_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sensor_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    data_type VARCHAR(50) NOT NULL, -- 'people_count', 'heatmap', 'regional_count'
    raw_data JSONB NOT NULL,
    processed_data JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and create indexes
ALTER TABLE sensors ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE INDEX idx_sensors_store ON sensors(store_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sensor_data_sensor ON sensor_data(sensor_id);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sensor_data_timestamp ON sensor_data(timestamp);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_sensor_data_type ON sensor_data(data_type);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Create triggers
DROP TRIGGER IF EXISTS update_sensors_updated_at ON sensors;
CREATE TRIGGER update_sensors_updated_at
    BEFORE UPDATE ON sensors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Sensor policies
DROP POLICY IF EXISTS "Users can view sensors in their organization" ON sensors;
CREATE POLICY "Users can view sensors in their organization" ON sensors
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM stores 
            WHERE stores.id = sensors.store_id 
            AND stores.organization_id = get_user_organization_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can view sensor data in their organization" ON sensor_data;
CREATE POLICY "Users can view sensor data in their organization" ON sensor_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sensors 
            JOIN stores ON stores.id = sensors.store_id
            WHERE sensors.id = sensor_data.sensor_id 
            AND stores.organization_id = get_user_organization_id(auth.uid())
        )
    );

-- ================================================
-- COMPLETE! 
-- ================================================
-- All tables, functions, and policies created safely
-- Run: node test-auth.js to verify connection