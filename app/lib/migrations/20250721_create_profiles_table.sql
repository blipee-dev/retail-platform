-- Create Profiles Table
-- This migration creates the profiles table that extends Supabase auth.users

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(organization_id, role);

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a profile for any existing auth users
INSERT INTO profiles (id, email, organization_id)
SELECT 
    id, 
    email,
    'b2b39c7f-8c6e-4b8a-9c4a-5e8f7a9b2d4c' -- Default to demo organization
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth with organization context';
COMMENT ON COLUMN profiles.role IS 'User role determining access level within organization';
COMMENT ON COLUMN profiles.assigned_stores IS 'Array of store IDs the user has access to';
COMMENT ON COLUMN profiles.permissions IS 'Array of specific permissions beyond role defaults';
COMMENT ON COLUMN profiles.locale IS 'User preferred language/locale for internationalization';