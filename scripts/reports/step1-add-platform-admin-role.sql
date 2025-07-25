-- STEP 1: Add platform_admin role to enum
-- Run this FIRST and SEPARATELY

-- Add the new role
ALTER TYPE user_role_enum ADD VALUE 'platform_admin' AFTER 'tenant_admin';

-- Verify it was added
SELECT unnest(enum_range(NULL::user_role_enum)) as roles
ORDER BY 1;

-- IMPORTANT: This change must be committed before running step 2!
-- In Supabase SQL Editor, this happens automatically when you run the query