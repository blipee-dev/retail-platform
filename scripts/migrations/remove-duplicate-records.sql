-- Identify and remove duplicate records in people_counting_raw
-- Duplicates = same sensor_id + timestamp (start time)
-- Keep only the most recently created record

-- 1. Identify duplicates - count records with same sensor_id and timestamp
WITH duplicate_counts AS (
    SELECT 
        sensor_id,
        timestamp,
        COUNT(*) as duplicate_count,
        MAX(created_at) as latest_created,
        MIN(created_at) as earliest_created,
        ARRAY_AGG(id ORDER BY created_at DESC) as record_ids
    FROM people_counting_raw
    GROUP BY sensor_id, timestamp
    HAVING COUNT(*) > 1
)
SELECT 
    s.sensor_name,
    s.sensor_id as sensor_code,
    COUNT(*) as duplicate_groups,
    SUM(duplicate_count) as total_records,
    SUM(duplicate_count - 1) as records_to_delete
FROM duplicate_counts d
JOIN sensor_metadata s ON s.id = d.sensor_id
GROUP BY s.sensor_name, s.sensor_id
ORDER BY records_to_delete DESC;

-- 2. Show sample of duplicates with details
WITH duplicates AS (
    SELECT 
        p.*,
        s.sensor_name,
        ROW_NUMBER() OVER (PARTITION BY p.sensor_id, p.timestamp ORDER BY p.created_at DESC) as rn,
        COUNT(*) OVER (PARTITION BY p.sensor_id, p.timestamp) as duplicate_count
    FROM people_counting_raw p
    JOIN sensor_metadata s ON s.id = p.sensor_id
)
SELECT 
    sensor_name,
    timestamp,
    end_time,
    duplicate_count,
    created_at,
    total_in,
    total_out,
    CASE WHEN rn = 1 THEN 'KEEP (newest)' ELSE 'DELETE' END as action
FROM duplicates
WHERE duplicate_count > 1
ORDER BY sensor_name, timestamp, created_at DESC
LIMIT 50;

-- 3. Summary of what will be deleted
WITH duplicates_to_delete AS (
    SELECT 
        p.id,
        p.sensor_id,
        p.timestamp,
        p.created_at,
        ROW_NUMBER() OVER (PARTITION BY p.sensor_id, p.timestamp ORDER BY p.created_at DESC) as rn
    FROM people_counting_raw p
)
SELECT 
    'Records to delete' as status,
    COUNT(*) as count
FROM duplicates_to_delete
WHERE rn > 1
UNION ALL
SELECT 
    'Records to keep' as status,
    COUNT(*) as count
FROM duplicates_to_delete
WHERE rn = 1;

-- 4. DELETE DUPLICATES (uncomment to execute)
-- This keeps only the most recently created record for each sensor_id + timestamp combination
/*
WITH duplicates_to_delete AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY sensor_id, timestamp ORDER BY created_at DESC) as rn
    FROM people_counting_raw
)
DELETE FROM people_counting_raw
WHERE id IN (
    SELECT id 
    FROM duplicates_to_delete 
    WHERE rn > 1
);
*/

-- 5. Verify no duplicates remain after deletion
/*
SELECT 
    sensor_id,
    timestamp,
    COUNT(*) as record_count
FROM people_counting_raw
GROUP BY sensor_id, timestamp
HAVING COUNT(*) > 1;
*/

-- 6. Add unique constraint to prevent future duplicates (optional)
-- This will prevent the same sensor from having multiple records for the same timestamp
/*
ALTER TABLE people_counting_raw 
ADD CONSTRAINT unique_sensor_timestamp 
UNIQUE (sensor_id, timestamp);
*/