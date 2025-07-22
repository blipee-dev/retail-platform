-- Create daily aggregation function
-- This aggregates data from hourly_analytics into daily_analytics

-- Function to aggregate daily data
CREATE OR REPLACE FUNCTION aggregate_daily_analytics() 
RETURNS void AS $$
DECLARE
    v_record RECORD;
    v_hourly_in JSONB;
    v_hourly_out JSONB;
    v_peak_hour INTEGER;
    v_peak_traffic INTEGER;
BEGIN
    -- Aggregate all unaggregated data from hourly_analytics
    FOR v_record IN 
        SELECT 
            organization_id,
            store_id,
            sensor_id,
            date,
            SUM(total_in) as total_in,
            SUM(total_out) as total_out,
            AVG(total_in) as avg_hourly_in,
            AVG(total_out) as avg_hourly_out,
            -- Aggregate business hours (9 AM - 9 PM)
            SUM(CASE WHEN hour >= 9 AND hour < 21 THEN total_in ELSE 0 END) as business_hours_in,
            SUM(CASE WHEN hour >= 9 AND hour < 21 THEN total_out ELSE 0 END) as business_hours_out
        FROM hourly_analytics
        WHERE date > COALESCE(
            (SELECT MAX(date) FROM daily_analytics),
            CURRENT_DATE - INTERVAL '30 days'
        )
        GROUP BY organization_id, store_id, sensor_id, date
    LOOP
        -- Build hourly arrays
        SELECT 
            jsonb_agg(COALESCE(h.total_in, 0) ORDER BY hour_num.hour),
            jsonb_agg(COALESCE(h.total_out, 0) ORDER BY hour_num.hour)
        INTO v_hourly_in, v_hourly_out
        FROM generate_series(0, 23) AS hour_num(hour)
        LEFT JOIN hourly_analytics h 
            ON h.sensor_id = v_record.sensor_id 
            AND h.date = v_record.date 
            AND h.hour = hour_num.hour;
        
        -- Find peak hour
        SELECT hour, total_in + total_out
        INTO v_peak_hour, v_peak_traffic
        FROM hourly_analytics
        WHERE sensor_id = v_record.sensor_id AND date = v_record.date
        ORDER BY (total_in + total_out) DESC
        LIMIT 1;
        
        -- Insert or update daily_analytics
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
        ) VALUES (
            v_record.organization_id,
            v_record.store_id,
            v_record.sensor_id,
            v_record.date,
            v_record.total_in,
            v_record.total_out,
            v_peak_hour,
            v_peak_traffic,
            v_hourly_in,
            v_hourly_out,
            v_record.avg_hourly_in,
            v_record.avg_hourly_out,
            v_record.business_hours_in,
            v_record.business_hours_out
        )
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
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function that can be called by a trigger
CREATE OR REPLACE FUNCTION trigger_daily_aggregation()
RETURNS trigger AS $$
BEGIN
    -- Only run at the end of the day or for historical data
    IF EXTRACT(HOUR FROM NEW.last_sample_time) = 23 OR NEW.date < CURRENT_DATE THEN
        PERFORM pg_notify('aggregate_daily', NEW.date::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on hourly_analytics to aggregate after insert
CREATE TRIGGER aggregate_daily_after_insert
    AFTER INSERT ON hourly_analytics
    FOR EACH ROW
    EXECUTE FUNCTION trigger_daily_aggregation();

-- Function to manually run daily aggregation
CREATE OR REPLACE FUNCTION run_daily_aggregation()
RETURNS TEXT AS $$
BEGIN
    PERFORM aggregate_daily_analytics();
    RETURN 'Daily aggregation completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to run all aggregations
CREATE OR REPLACE FUNCTION run_all_aggregations()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
BEGIN
    -- Run hourly aggregation first
    PERFORM aggregate_hourly_analytics();
    
    -- Then run daily aggregation
    PERFORM aggregate_daily_analytics();
    
    -- Get summary
    SELECT format('Aggregation complete. Hourly: %s records, Daily: %s records',
        (SELECT COUNT(*) FROM hourly_analytics WHERE date >= CURRENT_DATE - INTERVAL '7 days'),
        (SELECT COUNT(*) FROM daily_analytics WHERE date >= CURRENT_DATE - INTERVAL '7 days')
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION run_daily_aggregation() TO authenticated;
GRANT EXECUTE ON FUNCTION run_all_aggregations() TO authenticated;
GRANT EXECUTE ON FUNCTION aggregate_daily_analytics() TO service_role;