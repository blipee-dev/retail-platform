-- Add platform_admin role to enum
-- Run this by itself, then check the result in a separate query

ALTER TYPE user_role_enum ADD VALUE 'platform_admin' AFTER 'tenant_admin';