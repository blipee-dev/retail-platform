-- Check what roles are available in the user_role_enum
SELECT enum_range(NULL::user_role_enum);

-- Also check existing user roles to see what's being used
SELECT DISTINCT role, COUNT(*) as count
FROM user_profiles
GROUP BY role
ORDER BY count DESC;