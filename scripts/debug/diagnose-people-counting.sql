-- Quick diagnostic for people_counting_raw issues
-- Run this first to see what's wrong

-- 1. Check if people_counting_data exists (it shouldn't)
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'people_counting_data'
) as old_table_exists;

-- 2. Search for ANY reference to people_counting_data in the database
WITH db_references AS (
    -- Check triggers
    SELECT 'trigger' as type, tgname as name, pg_get_triggerdef(oid) as definition
    FROM pg_trigger
    WHERE pg_get_triggerdef(oid) LIKE '%people_counting_data%'
    
    UNION ALL
    
    -- Check views
    SELECT 'view' as type, viewname as name, definition
    FROM pg_views
    WHERE definition LIKE '%people_counting_data%'
    
    UNION ALL
    
    -- Check functions
    SELECT 'function' as type, proname as name, prosrc as definition
    FROM pg_proc
    WHERE prosrc LIKE '%people_counting_data%'
)
SELECT * FROM db_references;

-- 2b. Check rules separately (they have different columns)
SELECT 
    'rule' as type,
    rulename as name,
    definition
FROM pg_rules
WHERE definition LIKE '%people_counting_data%';

-- 3. Most likely culprit - check for INSTEAD OF rules
SELECT 
    schemaname,
    tablename,
    rulename,
    definition
FROM pg_rules
WHERE tablename = 'people_counting_raw';

-- 4. Check if it's actually a view pretending to be a table
SELECT 
    c.relname,
    c.relkind,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized view'
        WHEN 'f' THEN 'foreign table'
    END as type
FROM pg_class c
WHERE c.relname = 'people_counting_raw'
AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');