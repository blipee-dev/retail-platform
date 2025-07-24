-- Fix database references to non-existent people_counting_data table

-- 1. First, let's check what's referencing the old table
-- Check for triggers
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE pg_get_triggerdef(oid) LIKE '%people_counting_data%';

-- Check for views
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE definition LIKE '%people_counting_data%';

-- Check for functions
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc
WHERE prosrc LIKE '%people_counting_data%';

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE qual LIKE '%people_counting_data%' 
   OR with_check LIKE '%people_counting_data%';

-- 2. Drop any triggers that reference people_counting_data
-- This is likely the issue - there might be an insert trigger
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname, tgrelid::regclass::text as table_name
        FROM pg_trigger
        WHERE pg_get_triggerdef(oid) LIKE '%people_counting_data%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', trigger_rec.tgname, trigger_rec.table_name);
        RAISE NOTICE 'Dropped trigger: % on %', trigger_rec.tgname, trigger_rec.table_name;
    END LOOP;
END $$;

-- 3. Drop any views that reference people_counting_data
DO $$
DECLARE
    view_rec RECORD;
BEGIN
    FOR view_rec IN 
        SELECT schemaname, viewname
        FROM pg_views
        WHERE definition LIKE '%people_counting_data%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schemaname, view_rec.viewname);
        RAISE NOTICE 'Dropped view: %.%', view_rec.schemaname, view_rec.viewname;
    END LOOP;
END $$;

-- 4. Check if there's a redirect or instead-of trigger
-- Sometimes there are triggers that redirect inserts to another table
SELECT 
    t.tgname as trigger_name,
    t.tgrelid::regclass as table_name,
    t.tgtype,
    pg_get_triggerdef(t.oid) as definition
FROM pg_trigger t
WHERE t.tgrelid = 'people_counting_raw'::regclass
ORDER BY t.tgname;

-- 5. If there's a problematic RLS policy, disable and re-enable RLS
-- This will drop all policies
-- ALTER TABLE people_counting_raw DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;

-- 6. Verify the table structure is correct
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'people_counting_raw'
ORDER BY ordinal_position;

-- 7. Test insert after fixes
-- INSERT INTO people_counting_raw (
--     sensor_id, store_id, organization_id, timestamp, end_time,
--     line1_in, line1_out, line2_in, line2_out, 
--     line3_in, line3_out, line4_in, line4_out
-- ) VALUES (
--     'ffc2438a-ee4f-4324-96da-08671ea3b23c',
--     'd719cc6b-1715-4721-8897-6f6cd0c025b0',
--     '12345678-1234-1234-1234-123456789012',
--     NOW(),
--     NOW() + INTERVAL '1 hour',
--     5, 3, 0, 0, 0, 0, 0, 0
-- );