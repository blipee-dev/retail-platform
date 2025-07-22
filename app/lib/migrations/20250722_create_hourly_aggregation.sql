-- Create hourly aggregation function and trigger
-- This aggregates data from people_counting_data into hourly_analytics

-- Function to aggregate hourly data
CREATE OR REPLACE FUNCTION aggregate_hourly_analytics() 
RETURNS void AS $$
DECLARE
    v_record RECORD;
    v_hour INTEGER;
    v_date DATE;
BEGIN
    -- Aggregate all unaggregated data from people_counting_data
    FOR v_record IN 
        SELECT 
            organization_id,
            store_id,
            sensor_id,
            DATE_TRUNC('hour', timestamp) as hour_timestamp,
            SUM(COALESCE(line1_in, 0) + COALESCE(line2_in, 0) + COALESCE(line3_in, 0) + COALESCE(line4_in, 0)) as total_in,
            SUM(COALESCE(line1_out, 0) + COALESCE(line2_out, 0) + COALESCE(line3_out, 0) + COALESCE(line4_out, 0)) as total_out,
            SUM(COALESCE(line1_in, 0)) as line1_in,
            SUM(COALESCE(line1_out, 0)) as line1_out,
            SUM(COALESCE(line2_in, 0)) as line2_in,
            SUM(COALESCE(line2_out, 0)) as line2_out,
            SUM(COALESCE(line3_in, 0)) as line3_in,
            SUM(COALESCE(line3_out, 0)) as line3_out,
            SUM(COALESCE(line4_in, 0)) as line4_in,
            SUM(COALESCE(line4_out, 0)) as line4_out,
            COUNT(*) as sample_count,
            MIN(timestamp) as first_sample,
            MAX(timestamp) as last_sample
        FROM people_counting_data
        WHERE timestamp > COALESCE(
            (SELECT MAX(hour) FROM hourly_analytics),
            CURRENT_DATE - INTERVAL '30 days'
        )
        GROUP BY organization_id, store_id, sensor_id, hour_timestamp
    LOOP
        -- Extract hour and date from timestamp
        v_hour := EXTRACT(HOUR FROM v_record.hour_timestamp);
        v_date := DATE(v_record.hour_timestamp);
        
        -- Insert or update hourly_analytics
        INSERT INTO hourly_analytics (
            organization_id,
            store_id,
            sensor_id,
            date,
            hour,
            total_in,
            total_out,
            line1_in,
            line1_out,
            line2_in,
            line2_out,
            line3_in,
            line3_out,
            line4_in,
            line4_out,
            sample_count,
            first_sample_time,
            last_sample_time
        ) VALUES (
            v_record.organization_id,
            v_record.store_id,
            v_record.sensor_id,
            v_date,
            v_hour,
            v_record.total_in,
            v_record.total_out,
            v_record.line1_in,
            v_record.line1_out,
            v_record.line2_in,
            v_record.line2_out,
            v_record.line3_in,
            v_record.line3_out,
            v_record.line4_in,
            v_record.line4_out,
            v_record.sample_count,
            v_record.first_sample,
            v_record.last_sample
        )
        ON CONFLICT (sensor_id, date, hour) 
        DO UPDATE SET
            total_in = EXCLUDED.total_in,
            total_out = EXCLUDED.total_out,
            line1_in = EXCLUDED.line1_in,
            line1_out = EXCLUDED.line1_out,
            line2_in = EXCLUDED.line2_in,
            line2_out = EXCLUDED.line2_out,
            line3_in = EXCLUDED.line3_in,
            line3_out = EXCLUDED.line3_out,
            line4_in = EXCLUDED.line4_in,
            line4_out = EXCLUDED.line4_out,
            sample_count = EXCLUDED.sample_count,
            first_sample_time = EXCLUDED.first_sample_time,
            last_sample_time = EXCLUDED.last_sample_time,
            updated_at = CURRENT_TIMESTAMP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function that can be called by a trigger
CREATE OR REPLACE FUNCTION trigger_hourly_aggregation()
RETURNS trigger AS $$
BEGIN
    -- Run aggregation asynchronously to avoid blocking inserts
    PERFORM pg_notify('aggregate_hourly', 'new_data');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on people_counting_data to aggregate after insert
CREATE TRIGGER aggregate_hourly_after_insert
    AFTER INSERT ON people_counting_data
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_hourly_aggregation();

-- Create a scheduled job to run aggregation every hour
-- Note: This requires pg_cron extension or external scheduler
-- For now, we'll rely on the trigger and manual runs

-- Function to manually run aggregation
CREATE OR REPLACE FUNCTION run_hourly_aggregation()
RETURNS TEXT AS $$
BEGIN
    PERFORM aggregate_hourly_analytics();
    RETURN 'Hourly aggregation completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION run_hourly_aggregation() TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_hourly_analytics() TO service_role;