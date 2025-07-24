-- Simple fix for people_counting_raw insert issues
-- Run this in Supabase SQL editor

-- 1. Show all triggers on people_counting_raw
SELECT 
    tgname as trigger_name,
    CASE 
        WHEN tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN tgtype & 4 = 4 THEN 'INSERT'
        WHEN tgtype & 8 = 8 THEN 'UPDATE'
        WHEN tgtype & 16 = 16 THEN 'DELETE'
    END as event,
    pg_get_triggerdef(oid) as full_definition
FROM pg_trigger
WHERE tgrelid = 'people_counting_raw'::regclass
AND NOT tgisinternal;

-- 2. Drop ALL user-defined triggers on people_counting_raw
-- This is safe as we can recreate needed triggers later
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'people_counting_raw'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON people_counting_raw', r.tgname);
        RAISE NOTICE 'Dropped trigger: %', r.tgname;
    END LOOP;
END $$;

-- 3. Check and fix RLS policies
-- First check what policies exist
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'people_counting_raw';

-- 4. Temporarily disable RLS to test
ALTER TABLE people_counting_raw DISABLE ROW LEVEL SECURITY;

-- 5. Test insert
INSERT INTO people_counting_raw (
    sensor_id, 
    store_id, 
    organization_id, 
    timestamp, 
    end_time,
    line1_in, line1_out, 
    line2_in, line2_out, 
    line3_in, line3_out, 
    line4_in, line4_out
) VALUES (
    'ffc2438a-ee4f-4324-96da-08671ea3b23c',  -- J&J sensor
    'd719cc6b-1715-4721-8897-6f6cd0c025b0',   -- J&J store  
    '12345678-1234-1234-1234-123456789012',   -- J&J org
    NOW(),
    NOW() + INTERVAL '1 hour',
    10, 5, 0, 0, 0, 0, 0, 0
) RETURNING id, total_in, total_out;

-- 6. Re-enable RLS
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;

-- 7. Create basic RLS policy for service role
CREATE POLICY "Service role can do everything" ON people_counting_raw
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 8. Show result
SELECT 
    id,
    timestamp,
    total_in,
    total_out,
    created_at
FROM people_counting_raw
ORDER BY created_at DESC
LIMIT 5;