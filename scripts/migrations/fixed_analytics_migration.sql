-- Fixed Analytics Migration
-- Run this complete script in Supabase SQL Editor

-- =====================================================
-- 1. CREATE DAILY ANALYTICS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sensor_id UUID NOT NULL REFERENCES sensor_metadata(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Traffic metrics
    total_in INTEGER DEFAULT 0,
    total_out INTEGER DEFAULT 0,
    net_traffic INTEGER GENERATED ALWAYS AS (total_in - total_out) STORED,
    
    -- Peak hour analysis
    peak_hour INTEGER, -- 0-23
    peak_hour_traffic INTEGER DEFAULT 0,
    
    -- Hourly distribution (JSON array of 24 values)
    hourly_in JSONB DEFAULT '[]'::jsonb,
    hourly_out JSONB DEFAULT '[]'::jsonb,
    
    -- Statistical metrics
    avg_hourly_in DECIMAL(10,2) DEFAULT 0,
    avg_hourly_out DECIMAL(10,2) DEFAULT 0,
    
    -- Business hours metrics (configurable per store)
    business_hours_in INTEGER DEFAULT 0,
    business_hours_out INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per sensor per day
    CONSTRAINT unique_daily_analytics UNIQUE (sensor_id, date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_store_date ON daily_analytics(store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_org_date ON daily_analytics(organization_id, date DESC);

-- Enable RLS
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view daily analytics for their organization"
    ON daily_analytics FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Service role has full access to daily analytics"
    ON daily_analytics FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 2. CREATE HOURLY AGGREGATION FUNCTIONS (FIXED)
-- =====================================================

-- Function to aggregate hourly data
CREATE OR REPLACE FUNCTION aggregate_hourly_analytics() 
RETURNS void AS $$
DECLARE
    v_record RECORD;
    v_hour INTEGER;
    v_date DATE;
    v_last_processed TIMESTAMPTZ;
BEGIN
    -- Get the last processed timestamp
    SELECT MAX(date + (hour || ' hours')::interval) 
    INTO v_last_processed
    FROM hourly_analytics;
    
    -- If no data, start from 30 days ago
    IF v_last_processed IS NULL THEN
        v_last_processed := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    
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
        WHERE timestamp > v_last_processed
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

-- =====================================================
-- 3. CREATE DAILY AGGREGATION FUNCTIONS
-- =====================================================

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

-- =====================================================
-- 4. CREATE HELPER FUNCTIONS
-- =====================================================

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION run_all_aggregations() TO authenticated;

-- =====================================================
-- 5. CLEANUP DUPLICATE TABLES
-- =====================================================

-- Drop the duplicate 'sensors' table
DROP TABLE IF EXISTS sensors CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_people_counting_raw_timestamp ON people_counting_raw(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_people_counting_data_timestamp ON people_counting_data(timestamp DESC);

-- Add documentation
COMMENT ON TABLE people_counting_raw IS 'Raw sensor data collected directly from people counting sensors';
COMMENT ON TABLE people_counting_data IS 'Processed sensor data with calculated totals';
COMMENT ON TABLE hourly_analytics IS 'Aggregated hourly statistics from people counting data';
COMMENT ON TABLE daily_analytics IS 'Aggregated daily statistics from hourly analytics';
COMMENT ON TABLE sensor_metadata IS 'Configuration and metadata for all sensors';

-- Create view for latest data
CREATE OR REPLACE VIEW latest_sensor_data AS
SELECT 
    s.sensor_name,
    s.location,
    st.name as store_name,
    o.name as organization_name,
    p.timestamp,
    p.total_in,
    p.total_out,
    p.total_in - p.total_out as net_traffic
FROM people_counting_data p
JOIN sensor_metadata s ON p.sensor_id = s.id
JOIN stores st ON p.store_id = st.id
JOIN organizations o ON p.organization_id = o.id
WHERE p.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY p.timestamp DESC;

GRANT SELECT ON latest_sensor_data TO authenticated;

-- =====================================================
-- 6. RUN INITIAL AGGREGATION
-- =====================================================

-- Run aggregation to populate tables with existing data
SELECT run_all_aggregations();

-- =====================================================
-- 7. SHOW RESULTS
-- =====================================================

SELECT 
    'Migration complete!' as status,
    (SELECT COUNT(*) FROM people_counting_raw) as raw_records,
    (SELECT COUNT(*) FROM people_counting_data) as processed_records,
    (SELECT COUNT(*) FROM hourly_analytics) as hourly_records,
    (SELECT COUNT(*) FROM daily_analytics) as daily_records;