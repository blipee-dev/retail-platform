-- Simple hourly aggregation function for people counting data
CREATE OR REPLACE FUNCTION aggregate_hourly_data(
    p_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_records_processed INTEGER := 0;
    v_records_inserted INTEGER := 0;
    v_records_updated INTEGER := 0;
BEGIN
    -- Default to last 24 hours if not specified
    v_start_time := COALESCE(p_start_time, NOW() - INTERVAL '24 hours');
    v_end_time := COALESCE(p_end_time, NOW());
    
    -- Round to hour boundaries
    v_start_time := date_trunc('hour', v_start_time);
    v_end_time := date_trunc('hour', v_end_time);
    
    -- Insert or update hourly analytics
    WITH hourly_data AS (
        SELECT 
            store_id,
            date_trunc('hour', timestamp) AS hour_start,
            COUNT(*) AS sample_count,
            SUM(line1_in + line2_in + line3_in + line4_in) AS total_in,
            SUM(line1_out + line2_out + line3_out + line4_out) AS total_out,
            SUM(line1_in) AS line1_in,
            SUM(line1_out) AS line1_out,
            SUM(line2_in) AS line2_in,
            SUM(line2_out) AS line2_out,
            SUM(line3_in) AS line3_in,
            SUM(line3_out) AS line3_out,
            SUM(line4_in) AS line4_in,
            SUM(line4_out) AS line4_out,
            MIN(timestamp) AS first_sample_time,
            MAX(timestamp) AS last_sample_time
        FROM people_counting_raw
        WHERE timestamp >= v_start_time 
        AND timestamp < v_end_time
        GROUP BY store_id, date_trunc('hour', timestamp)
    )
    INSERT INTO hourly_analytics (
        store_id,
        hour_start,
        date,
        hour,
        total_entries,
        total_exits,
        total_in,
        total_out,
        net_flow,
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
        last_sample_time,
        avg_occupancy,
        peak_occupancy
    )
    SELECT 
        hd.store_id,
        hd.hour_start,
        DATE(hd.hour_start),
        EXTRACT(HOUR FROM hd.hour_start)::INTEGER,
        hd.total_in,  -- total_entries
        hd.total_out, -- total_exits
        hd.total_in,
        hd.total_out,
        hd.total_in - hd.total_out, -- net_flow
        hd.line1_in,
        hd.line1_out,
        hd.line2_in,
        hd.line2_out,
        hd.line3_in,
        hd.line3_out,
        hd.line4_in,
        hd.line4_out,
        hd.sample_count,
        hd.first_sample_time,
        hd.last_sample_time,
        0, -- avg_occupancy (simplified for now)
        0  -- peak_occupancy (simplified for now)
    FROM hourly_data hd
    ON CONFLICT (store_id, hour_start) 
    DO UPDATE SET
        total_entries = EXCLUDED.total_entries,
        total_exits = EXCLUDED.total_exits,
        total_in = EXCLUDED.total_in,
        total_out = EXCLUDED.total_out,
        net_flow = EXCLUDED.net_flow,
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
        updated_at = NOW();
    
    GET DIAGNOSTICS v_records_processed = ROW_COUNT;
    
    RETURN format('Processed %s hours. Records affected: %s', 
                  EXTRACT(EPOCH FROM (v_end_time - v_start_time)) / 3600,
                  v_records_processed);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION aggregate_hourly_data TO anon, authenticated, service_role;