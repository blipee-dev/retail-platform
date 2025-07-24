-- Find what's causing the people_counting_data error

-- 1. Check all triggers on people_counting_raw
SELECT 
    tgname as trigger_name,
    tgfoid::regproc as trigger_function
FROM pg_trigger
WHERE tgrelid = 'people_counting_raw'::regclass
AND NOT tgisinternal;

-- 2. Check all generated columns that might reference another table
SELECT 
    attname as column_name,
    pg_get_expr(adbin, adrelid) as generation_expression
FROM pg_attribute
JOIN pg_attrdef ON (attrelid = adrelid AND attnum = adnum)
WHERE attrelid = 'people_counting_raw'::regclass
AND attgenerated != '';

-- 3. Get the actual error by trying an insert
DO $$
BEGIN
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
    );
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error: % - %', SQLSTATE, SQLERRM;
    RAISE NOTICE 'Detail: %', SQLSTATE;
END $$;

-- 4. Check constraints that might reference other tables
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'people_counting_raw'::regclass;

-- 5. Check if total_in or total_out are generated columns with bad expressions
SELECT 
    column_name,
    data_type,
    is_generated,
    generation_expression
FROM information_schema.columns
WHERE table_name = 'people_counting_raw'
AND column_name IN ('total_in', 'total_out', 'net_flow');