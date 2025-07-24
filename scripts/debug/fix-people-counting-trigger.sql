-- Fix the people_counting_raw trigger issue

-- 1. First, verify which trigger is using the problematic function
SELECT 
    t.tgname as trigger_name,
    t.tgfoid::regproc as function_name
FROM pg_trigger t
WHERE t.tgrelid = 'people_counting_raw'::regclass
AND t.tgfoid = 'process_people_counting_data'::regproc;

-- 2. Drop the problematic trigger
DROP TRIGGER IF EXISTS process_people_counting_raw_trigger ON people_counting_raw;
DROP TRIGGER IF EXISTS people_counting_raw_process_trigger ON people_counting_raw;
-- Try common trigger names
DROP TRIGGER IF EXISTS trigger_process_people_counting ON people_counting_raw;
DROP TRIGGER IF EXISTS people_counting_raw_insert ON people_counting_raw;

-- 3. Drop ALL triggers that use the problematic function
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'people_counting_raw'::regclass 
        AND tgfoid = 'process_people_counting_data'::regproc
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON people_counting_raw', r.tgname);
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- 4. Test insert after dropping the trigger
INSERT INTO people_counting_raw (
    sensor_id, store_id, organization_id, 
    timestamp, end_time,
    line1_in, line1_out, line2_in, line2_out,
    line3_in, line3_out, line4_in, line4_out
) VALUES (
    'ffc2438a-ee4f-4324-96da-08671ea3b23c',
    'd719cc6b-1715-4721-8897-6f6cd0c025b0',
    '12345678-1234-1234-1234-123456789012',
    NOW(), NOW() + interval '1 hour',
    10, 5, 0, 0, 0, 0, 0, 0
) RETURNING id, total_in, total_out, created_at;

-- 5. Verify data was inserted
SELECT 
    id,
    sensor_id,
    timestamp,
    total_in,
    total_out,
    created_at
FROM people_counting_raw
ORDER BY created_at DESC
LIMIT 5;

-- 6. Optional: Drop the obsolete functions that reference people_counting_data
-- Only do this if you're sure they're not needed
/*
DROP FUNCTION IF EXISTS process_people_counting_data() CASCADE;
DROP FUNCTION IF EXISTS calculate_current_occupancy(uuid) CASCADE;
DROP FUNCTION IF EXISTS aggregate_hourly_analytics() CASCADE;
*/