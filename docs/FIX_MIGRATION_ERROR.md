# Fix for Migration Error

## Error
```
ERROR: 42P01: relation "sensors" does not exist
```

## Solution

The error was caused by a leftover reference to "sensors" table instead of "sensor_metadata". This has been fixed in the migration file.

## Run Migrations Again

1. **If you got an error, some tables might have been created**. Check what exists:
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

2. **If sensor tables were partially created**, drop them:
```sql
-- Drop sensor-related tables if they exist
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

3. **Run the sensor migration again**:
   - Copy the updated content from `/supabase/migrations/20240120000007_create_sensor_tables.sql`
   - Paste in SQL Editor
   - Run

## Verify Success

After running, you should see:
```
Success. No rows returned
```

Check that all tables were created:
```sql
-- Should return ~15 tables including sensor tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
```

## Note

The migrations are now fixed and ready to run. The issue was simply a typo where we referenced "sensors" instead of "sensor_metadata" in one foreign key constraint.