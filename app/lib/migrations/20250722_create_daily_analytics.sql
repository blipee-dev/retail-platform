-- Create daily_analytics table for aggregated daily statistics
-- This table stores daily summaries of people counting data

-- Create daily_analytics table
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
CREATE INDEX idx_daily_analytics_date ON daily_analytics(date DESC);
CREATE INDEX idx_daily_analytics_store_date ON daily_analytics(store_id, date DESC);
CREATE INDEX idx_daily_analytics_org_date ON daily_analytics(organization_id, date DESC);

-- Enable RLS
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;

-- RLS policies (same as other analytics tables)
CREATE POLICY "Users can view daily analytics for their organization"
    ON daily_analytics FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Service role has full access to daily analytics"
    ON daily_analytics FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- Create update trigger for updated_at
CREATE TRIGGER update_daily_analytics_updated_at
    BEFORE UPDATE ON daily_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();