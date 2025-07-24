-- Check trigger functions on people_counting_raw

-- 1. List all triggers with their functions
SELECT 
    t.tgname as trigger_name,
    t.tgfoid::regproc as function_name,
    CASE 
        WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END as timing,
    CASE 
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'UPDATE'  
        WHEN t.tgtype & 16 = 16 THEN 'DELETE'
    END as event
FROM pg_trigger t
WHERE t.tgrelid = 'people_counting_raw'::regclass
AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. Get the source code of each trigger function
SELECT DISTINCT
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'people_counting_raw'::regclass
AND NOT t.tgisinternal;

-- 3. Search all functions for references to people_counting_data
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE prosrc LIKE '%people_counting_data%';

-- 4. Check if there's a view named people_counting_data that might be confusing things
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views
WHERE viewname = 'people_counting_data';

-- 5. Nuclear option - disable all triggers temporarily and test
-- DON'T RUN THIS IN PRODUCTION WITHOUT CAREFUL CONSIDERATION
/*
ALTER TABLE people_counting_raw DISABLE TRIGGER ALL;

-- Try insert
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
    1, 0, 0, 0, 0, 0, 0, 0
) RETURNING id, total_in, total_out;

-- Re-enable triggers
ALTER TABLE people_counting_raw ENABLE TRIGGER ALL;
*/