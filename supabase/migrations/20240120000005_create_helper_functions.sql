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

-- Function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role_enum AS $$
    SELECT role FROM user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check store access
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