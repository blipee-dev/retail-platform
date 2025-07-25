-- Check all available roles in the user_role_enum
SELECT unnest(enum_range(NULL::user_role_enum)) as available_roles
ORDER BY 1;

-- Alternative way to check
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role_enum'
ORDER BY e.enumsortorder;

-- Check what roles are currently being used
SELECT 
    role,
    COUNT(*) as user_count,
    array_agg(email ORDER BY email) as users
FROM user_profiles
GROUP BY role
ORDER BY user_count DESC;

-- If platform_admin doesn't exist, here are common alternatives:
-- super_admin, admin, platform_owner, system_admin