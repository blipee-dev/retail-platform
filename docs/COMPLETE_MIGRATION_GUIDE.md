# Complete Migration Guide - Fix and Run

## Current Status
✅ Migration error fixed (changed "sensors" to "sensor_metadata" on line 208)
⏳ Ready to run migrations in Supabase

## Step 1: Check Current Database State

Since you encountered an error, some tables might have been partially created. First, check what exists:

```sql
-- Run this in Supabase SQL Editor to see what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Step 2: Clean Up (If Needed)

If sensor tables were partially created, drop them before re-running:

```sql
-- Only run this if sensor tables exist but are incomplete
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS alert_rules CASCADE;
DROP TABLE IF EXISTS daily_summary CASCADE;
DROP TABLE IF EXISTS hourly_analytics CASCADE;
DROP TABLE IF EXISTS vca_alarm_status CASCADE;
DROP TABLE IF EXISTS heatmap_temporal_raw CASCADE;
DROP TABLE IF EXISTS regional_counting_raw CASCADE;
DROP TABLE IF EXISTS people_counting_raw CASCADE;
DROP TABLE IF EXISTS sensor_metadata CASCADE;
```

## Step 3: Run Migrations

### Option A: Using Combined Migration (Recommended)

1. Go to Supabase SQL Editor
2. Create new query
3. Copy entire contents of `/supabase/migrations/combined_migrations.sql`
4. Run it
5. Then copy entire contents of `/supabase/migrations/20240120000007_create_sensor_tables.sql`
6. Run it

### Option B: Run Individual Migrations

If combined migration fails, run each file in order:

1. `/supabase/migrations/20240120000001_create_user_roles_enum.sql`
2. `/supabase/migrations/20240120000002_create_organizations_table.sql`
3. `/supabase/migrations/20240120000003_create_user_profiles_table.sql`
4. `/supabase/migrations/20240120000004_create_store_hierarchy_tables.sql`
5. `/supabase/migrations/20240120000005_create_helper_functions.sql`
6. `/supabase/migrations/20240120000006_create_rls_policies.sql`
7. `/supabase/migrations/20240120000007_create_sensor_tables.sql` (now fixed!)

## Step 4: Verify Installation

After successful migration, run these checks:

```sql
-- 1. Count tables (should be 15+)
SELECT COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 3. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- 4. Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

## Expected Results

You should see these tables:
- organizations
- user_profiles
- regions
- stores
- user_stores
- user_regions
- sensor_metadata ✅ (not "sensors")
- people_counting_raw
- regional_counting_raw
- heatmap_temporal_raw
- vca_alarm_status
- hourly_analytics
- daily_summary
- alert_rules
- alerts

## Step 5: Test the Setup

Create a test user and organization:

```sql
-- This will test if everything is working
SELECT create_organization_with_admin(
    'Test Organization',
    'test-org',
    gen_random_uuid(), -- This will fail but shows functions work
    'test@example.com',
    'Test Admin'
);
```

## Troubleshooting

### If you get "type already exists" errors:
The auth tables were already created. Skip to sensor migration.

### If you get "function does not exist" errors:
The helper functions migration didn't run. Run migration #5 separately.

### If you get permission errors:
Make sure you're using the service_role key or logged in as postgres user.

## Next Steps After Success

1. ✅ Create your first organization via `/auth/signup`
2. ✅ Test role-based access
3. ✅ Add a test sensor
4. ✅ Start ingesting data

## Quick Health Check Query

Run this to see if everything is healthy:

```sql
WITH health_check AS (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as tables,
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions,
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as rls_tables
)
SELECT 
    CASE 
        WHEN tables >= 15 AND functions >= 5 AND rls_tables >= 10 
        THEN '✅ Database setup complete!'
        ELSE '❌ Setup incomplete - check individual counts'
    END as status,
    tables as total_tables,
    functions as total_functions,
    rls_tables as tables_with_rls
FROM health_check;
```

Good luck! The migrations are now fixed and ready to run. 🚀