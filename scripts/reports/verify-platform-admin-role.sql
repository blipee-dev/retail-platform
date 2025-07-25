-- Verify the platform_admin role was added
-- Run this AFTER the ALTER TYPE command

SELECT unnest(enum_range(NULL::user_role_enum)) as available_roles
ORDER BY 1;