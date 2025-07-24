-- Drop all _old tables that are no longer needed
-- These were created during the table restructuring migration

-- First, let's see what _old tables exist
SELECT 'Tables to be dropped:' as info;
SELECT 
  tablename as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%_old'
ORDER BY tablename;

-- Create a backup record of what we're dropping
SELECT 
  'Creating backup record of tables to be dropped...' as status,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name LIKE '%_old';

-- Drop the _old tables
-- Note: CASCADE will also drop any dependent objects (like views, foreign keys)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%_old') 
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
END $$;

-- Verify all _old tables have been dropped
SELECT 'Verification - remaining _old tables:' as status;
SELECT COUNT(*) as remaining_old_tables
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%_old';

-- Clean up any orphaned sequences
SELECT 'Cleaning up orphaned sequences...' as status;
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
          AND sequence_name LIKE '%_old_%'
    )
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
END $$;

-- Show current tables (excluding system tables)
SELECT 'Current application tables after cleanup:' as status;
SELECT 
  tablename as table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE '_prisma%'
  AND tablename NOT IN ('schema_migrations', 'migrations')
ORDER BY tablename;

-- Summary
SELECT 'Cleanup complete!' as status;