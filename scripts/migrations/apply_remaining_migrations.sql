-- Apply remaining migrations in correct order
-- Run this in Supabase SQL Editor

-- 1. Create Daily Analytics Table (if not exists)
-- From: app/lib/migrations/20250722_create_daily_analytics.sql
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

-- RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view daily analytics for their organization" ON daily_analytics;
DROP POLICY IF EXISTS "Service role has full access to daily analytics" ON daily_analytics;

CREATE POLICY "Users can view daily analytics for their organization"
    ON daily_analytics FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Service role has full access to daily analytics"
    ON daily_analytics FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_daily_analytics_updated_at ON daily_analytics;

CREATE TRIGGER update_daily_analytics_updated_at
    BEFORE UPDATE ON daily_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Create/Replace Aggregation Functions
-- Note: The fix_analytics_column_mismatches migration already updated these functions
-- So we'll skip the function creation here since they were already fixed

-- 3. Cleanup duplicate tables (if they exist)
-- From: app/lib/migrations/20250722_cleanup_duplicate_tables.sql

-- Drop duplicate sensors table if it exists (we use sensor_metadata)
DROP TABLE IF EXISTS sensors CASCADE;

-- Drop duplicate profiles table if it exists (we use user_profiles)
DROP TABLE IF EXISTS profiles CASCADE;

-- 4. Run initial aggregation to populate tables
SELECT run_all_aggregations();

-- 5. Show migration results
SELECT 
    'Migrations complete!' as status,
    (SELECT COUNT(*) FROM daily_analytics) as daily_records,
    (SELECT COUNT(*) FROM hourly_analytics) as hourly_records,
    (SELECT COUNT(*) FROM people_counting_data) as source_records;