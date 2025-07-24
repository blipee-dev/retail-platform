-- Drop the _old tables from the migration
-- These tables are no longer needed after successful migration

-- Show what we're about to drop
SELECT 'Tables to be dropped:' as action;
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('hourly_analytics_old', 'daily_analytics_old');

-- Drop the old tables
DROP TABLE IF EXISTS hourly_analytics_old CASCADE;
DROP TABLE IF EXISTS daily_analytics_old CASCADE;

-- Verify they're gone
SELECT 'Remaining tables after cleanup:' as status;
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE '_prisma%'
ORDER BY tablename;

-- Summary of space saved
SELECT 'Cleanup complete! Space saved: ~1.9 MB' as status;