-- Create user role enum
CREATE TYPE user_role_enum AS ENUM (
    'tenant_admin',
    'regional_manager',
    'store_manager',
    'analyst',
    'store_staff',
    'viewer'
);