-- Fix column name mismatches in analytics tables
-- This migration aligns the table structures with the aggregation functions

-- 1. Add missing columns to hourly_analytics table
ALTER TABLE hourly_analytics 
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS hour INTEGER CHECK (hour >= 0 AND hour <= 23),
ADD COLUMN IF NOT EXISTS total_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line1_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line1_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line2_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line2_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line3_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line3_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line4_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line4_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_sample_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sample_time TIMESTAMPTZ;

-- 2. Migrate existing data to new columns (if any exists)
UPDATE hourly_analytics 
SET 
    date = DATE(hour_start),
    hour = EXTRACT(HOUR FROM hour_start),
    total_in = COALESCE(total_entries, 0),
    total_out = COALESCE(total_exits, 0),
    first_sample_time = hour_start,
    last_sample_time = hour_start + INTERVAL '1 hour'
WHERE date IS NULL AND hour_start IS NOT NULL;

-- 3. Extract line data from JSONB if it exists
UPDATE hourly_analytics 
SET 
    line1_in = COALESCE((line_distribution->>'line1_in')::INTEGER, 0),
    line1_out = COALESCE((line_distribution->>'line1_out')::INTEGER, 0),
    line2_in = COALESCE((line_distribution->>'line2_in')::INTEGER, 0),
    line2_out = COALESCE((line_distribution->>'line2_out')::INTEGER, 0),
    line3_in = COALESCE((line_distribution->>'line3_in')::INTEGER, 0),
    line3_out = COALESCE((line_distribution->>'line3_out')::INTEGER, 0),
    line4_in = COALESCE((line_distribution->>'line4_in')::INTEGER, 0),
    line4_out = COALESCE((line_distribution->>'line4_out')::INTEGER, 0)
WHERE line_distribution IS NOT NULL AND line1_in IS NULL;

-- 4. Add unique constraint on new column combination
ALTER TABLE hourly_analytics 
DROP CONSTRAINT IF EXISTS unique_hourly_analytics;

ALTER TABLE hourly_analytics 
ADD CONSTRAINT unique_hourly_analytics_new UNIQUE (sensor_id, date, hour);

-- 5. Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_date_hour ON hourly_analytics(date, hour);

-- 6. Fix the aggregate_hourly_analytics function to handle both old and new data
CREATE OR REPLACE FUNCTION aggregate_hourly_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete existing hourly data for the current hour to avoid duplicates
    DELETE FROM hourly_analytics 
    WHERE date = CURRENT_DATE 
    AND hour = EXTRACT(HOUR FROM CURRENT_TIMESTAMP);
    
    -- Aggregate data from people_counting_data for the current hour
    INSERT INTO hourly_analytics (
        organization_id,
        store_id,
        sensor_id,
        date,
        hour,
        hour_start,
        total_in,
        total_out,
        total_entries,
        total_exits,
        line1_in, line1_out,
        line2_in, line2_out,
        line3_in, line3_out,
        line4_in, line4_out,
        first_sample_time,
        last_sample_time,
        sample_count,
        data_completeness
    )
    SELECT 
        pcd.organization_id,
        pcd.store_id,
        pcd.sensor_id,
        CURRENT_DATE as date,
        EXTRACT(HOUR FROM CURRENT_TIMESTAMP)::INTEGER as hour,
        date_trunc('hour', CURRENT_TIMESTAMP) as hour_start,
        SUM(pcd.in_count) as total_in,
        SUM(pcd.out_count) as total_out,
        SUM(pcd.in_count) as total_entries,
        SUM(pcd.out_count) as total_exits,
        SUM(CASE WHEN pcd.line_id = 'line1' AND pcd.direction = 'in' THEN pcd.count ELSE 0 END) as line1_in,
        SUM(CASE WHEN pcd.line_id = 'line1' AND pcd.direction = 'out' THEN pcd.count ELSE 0 END) as line1_out,
        SUM(CASE WHEN pcd.line_id = 'line2' AND pcd.direction = 'in' THEN pcd.count ELSE 0 END) as line2_in,
        SUM(CASE WHEN pcd.line_id = 'line2' AND pcd.direction = 'out' THEN pcd.count ELSE 0 END) as line2_out,
        SUM(CASE WHEN pcd.line_id = 'line3' AND pcd.direction = 'in' THEN pcd.count ELSE 0 END) as line3_in,
        SUM(CASE WHEN pcd.line_id = 'line3' AND pcd.direction = 'out' THEN pcd.count ELSE 0 END) as line3_out,
        SUM(CASE WHEN pcd.line_id = 'line4' AND pcd.direction = 'in' THEN pcd.count ELSE 0 END) as line4_in,
        SUM(CASE WHEN pcd.line_id = 'line4' AND pcd.direction = 'out' THEN pcd.count ELSE 0 END) as line4_out,
        MIN(pcd.timestamp) as first_sample_time,
        MAX(pcd.timestamp) as last_sample_time,
        COUNT(DISTINCT pcd.timestamp) as sample_count,
        COUNT(DISTINCT pcd.timestamp)::FLOAT / 12.0 as data_completeness -- Assuming 12 samples per hour (5-min intervals)
    FROM people_counting_data pcd
    WHERE pcd.timestamp >= date_trunc('hour', CURRENT_TIMESTAMP)
    AND pcd.timestamp < date_trunc('hour', CURRENT_TIMESTAMP) + INTERVAL '1 hour'
    GROUP BY 
        pcd.organization_id,
        pcd.store_id,
        pcd.sensor_id
    ON CONFLICT (sensor_id, date, hour) 
    DO UPDATE SET
        total_in = EXCLUDED.total_in,
        total_out = EXCLUDED.total_out,
        total_entries = EXCLUDED.total_entries,
        total_exits = EXCLUDED.total_exits,
        line1_in = EXCLUDED.line1_in,
        line1_out = EXCLUDED.line1_out,
        line2_in = EXCLUDED.line2_in,
        line2_out = EXCLUDED.line2_out,
        line3_in = EXCLUDED.line3_in,
        line3_out = EXCLUDED.line3_out,
        line4_in = EXCLUDED.line4_in,
        line4_out = EXCLUDED.line4_out,
        first_sample_time = EXCLUDED.first_sample_time,
        last_sample_time = EXCLUDED.last_sample_time,
        sample_count = EXCLUDED.sample_count,
        data_completeness = EXCLUDED.data_completeness,
        updated_at = CURRENT_TIMESTAMP;
END;
$$;

-- 7. Fix the aggregate_daily_analytics function
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete existing daily data for today to avoid duplicates
    DELETE FROM daily_analytics 
    WHERE date = CURRENT_DATE;
    
    -- Aggregate data from hourly_analytics for today
    INSERT INTO daily_analytics (
        organization_id,
        store_id,
        sensor_id,
        date,
        total_in,
        total_out,
        peak_hour,
        peak_hour_traffic,
        hourly_in,
        hourly_out,
        avg_hourly_in,
        avg_hourly_out,
        business_hours_in,
        business_hours_out
    )
    SELECT 
        ha.organization_id,
        ha.store_id,
        ha.sensor_id,
        ha.date,
        SUM(COALESCE(ha.total_in, ha.total_entries, 0)) as total_in,
        SUM(COALESCE(ha.total_out, ha.total_exits, 0)) as total_out,
        (SELECT hour FROM hourly_analytics h2 
         WHERE h2.sensor_id = ha.sensor_id 
         AND h2.date = ha.date 
         ORDER BY COALESCE(h2.total_in, h2.total_entries, 0) + COALESCE(h2.total_out, h2.total_exits, 0) DESC 
         LIMIT 1) as peak_hour,
        (SELECT COALESCE(h2.total_in, h2.total_entries, 0) + COALESCE(h2.total_out, h2.total_exits, 0) 
         FROM hourly_analytics h2 
         WHERE h2.sensor_id = ha.sensor_id 
         AND h2.date = ha.date 
         ORDER BY COALESCE(h2.total_in, h2.total_entries, 0) + COALESCE(h2.total_out, h2.total_exits, 0) DESC 
         LIMIT 1) as peak_hour_traffic,
        jsonb_agg(COALESCE(ha.total_in, ha.total_entries, 0) ORDER BY ha.hour) as hourly_in,
        jsonb_agg(COALESCE(ha.total_out, ha.total_exits, 0) ORDER BY ha.hour) as hourly_out,
        AVG(COALESCE(ha.total_in, ha.total_entries, 0))::DECIMAL(10,2) as avg_hourly_in,
        AVG(COALESCE(ha.total_out, ha.total_exits, 0))::DECIMAL(10,2) as avg_hourly_out,
        SUM(CASE WHEN ha.hour BETWEEN 9 AND 21 THEN COALESCE(ha.total_in, ha.total_entries, 0) ELSE 0 END) as business_hours_in,
        SUM(CASE WHEN ha.hour BETWEEN 9 AND 21 THEN COALESCE(ha.total_out, ha.total_exits, 0) ELSE 0 END) as business_hours_out
    FROM hourly_analytics ha
    WHERE ha.date = CURRENT_DATE
    GROUP BY 
        ha.organization_id,
        ha.store_id,
        ha.sensor_id,
        ha.date
    ON CONFLICT (sensor_id, date) 
    DO UPDATE SET
        total_in = EXCLUDED.total_in,
        total_out = EXCLUDED.total_out,
        peak_hour = EXCLUDED.peak_hour,
        peak_hour_traffic = EXCLUDED.peak_hour_traffic,
        hourly_in = EXCLUDED.hourly_in,
        hourly_out = EXCLUDED.hourly_out,
        avg_hourly_in = EXCLUDED.avg_hourly_in,
        avg_hourly_out = EXCLUDED.avg_hourly_out,
        business_hours_in = EXCLUDED.business_hours_in,
        business_hours_out = EXCLUDED.business_hours_out,
        updated_at = CURRENT_TIMESTAMP;
END;
$$;

-- 8. Update the run_all_aggregations function to handle errors better
CREATE OR REPLACE FUNCTION run_all_aggregations()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result TEXT := '';
    error_msg TEXT;
BEGIN
    -- Run hourly aggregation
    BEGIN
        PERFORM aggregate_hourly_analytics();
        result := result || 'Hourly aggregation completed. ';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        result := result || 'Hourly aggregation failed: ' || error_msg || '. ';
    END;
    
    -- Run daily aggregation
    BEGIN
        PERFORM aggregate_daily_analytics();
        result := result || 'Daily aggregation completed.';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        result := result || 'Daily aggregation failed: ' || error_msg || '.';
    END;
    
    RETURN result;
END;
$$;