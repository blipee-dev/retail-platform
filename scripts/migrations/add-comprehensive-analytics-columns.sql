-- Add comprehensive people counting KPIs to analytics tables
-- This migration adds columns to properly separate store traffic from passerby traffic
-- and calculate detailed metrics like capture rate and entrance distribution

-- Add columns to hourly_analytics table
ALTER TABLE hourly_analytics 
ADD COLUMN IF NOT EXISTS store_entries INTEGER,
ADD COLUMN IF NOT EXISTS store_exits INTEGER,
ADD COLUMN IF NOT EXISTS passerby_count INTEGER,
ADD COLUMN IF NOT EXISTS passerby_in INTEGER,
ADD COLUMN IF NOT EXISTS passerby_out INTEGER,
ADD COLUMN IF NOT EXISTS capture_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS entry_line1_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS entry_line2_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS entry_line3_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exit_line1_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exit_line2_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exit_line3_pct DECIMAL(5,2);

-- Add any missing standard columns to daily_analytics
ALTER TABLE daily_analytics
ADD COLUMN IF NOT EXISTS peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS avg_dwell_time INTEGER,
ADD COLUMN IF NOT EXISTS business_hours_traffic INTEGER;

-- Add columns to daily_analytics table
ALTER TABLE daily_analytics
ADD COLUMN IF NOT EXISTS store_entries INTEGER,
ADD COLUMN IF NOT EXISTS store_exits INTEGER,
ADD COLUMN IF NOT EXISTS passerby_count INTEGER,
ADD COLUMN IF NOT EXISTS passerby_in INTEGER,
ADD COLUMN IF NOT EXISTS passerby_out INTEGER,
ADD COLUMN IF NOT EXISTS capture_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS entry_line1_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS entry_line2_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS entry_line3_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exit_line1_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exit_line2_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS exit_line3_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS peak_entry_hour INTEGER,
ADD COLUMN IF NOT EXISTS peak_exit_hour INTEGER,
ADD COLUMN IF NOT EXISTS peak_passerby_hour INTEGER,
ADD COLUMN IF NOT EXISTS business_hours_entries INTEGER,
ADD COLUMN IF NOT EXISTS after_hours_entries INTEGER,
ADD COLUMN IF NOT EXISTS business_hours_capture_rate DECIMAL(5,2);

-- Add comments to explain the columns
COMMENT ON COLUMN hourly_analytics.store_entries IS 'Total entries through Lines 1-3 (excludes passersby)';
COMMENT ON COLUMN hourly_analytics.store_exits IS 'Total exits through Lines 1-3 (excludes passersby)';
COMMENT ON COLUMN hourly_analytics.passerby_count IS 'Total passersby (Line 4 IN + OUT)';
COMMENT ON COLUMN hourly_analytics.passerby_in IS 'Directional passerby flow - one direction';
COMMENT ON COLUMN hourly_analytics.passerby_out IS 'Directional passerby flow - opposite direction';
COMMENT ON COLUMN hourly_analytics.capture_rate IS 'Percentage of passersby who entered store';
COMMENT ON COLUMN hourly_analytics.entry_line1_pct IS 'Percentage of entries through Line 1';
COMMENT ON COLUMN hourly_analytics.entry_line2_pct IS 'Percentage of entries through Line 2';
COMMENT ON COLUMN hourly_analytics.entry_line3_pct IS 'Percentage of entries through Line 3';
COMMENT ON COLUMN hourly_analytics.exit_line1_pct IS 'Percentage of exits through Line 1';
COMMENT ON COLUMN hourly_analytics.exit_line2_pct IS 'Percentage of exits through Line 2';
COMMENT ON COLUMN hourly_analytics.exit_line3_pct IS 'Percentage of exits through Line 3';

COMMENT ON COLUMN daily_analytics.peak_entry_hour IS 'Hour with most store entries (0-23)';
COMMENT ON COLUMN daily_analytics.peak_exit_hour IS 'Hour with most store exits (0-23)';
COMMENT ON COLUMN daily_analytics.peak_passerby_hour IS 'Hour with most passerby traffic (0-23)';
COMMENT ON COLUMN daily_analytics.business_hours_entries IS 'Entries during business hours (9AM-1AM)';
COMMENT ON COLUMN daily_analytics.after_hours_entries IS 'Entries outside business hours';
COMMENT ON COLUMN daily_analytics.business_hours_capture_rate IS 'Capture rate during business hours only';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_capture_rate 
ON hourly_analytics(store_id, date, capture_rate) 
WHERE capture_rate > 0;

CREATE INDEX IF NOT EXISTS idx_daily_analytics_capture_rate 
ON daily_analytics(store_id, date, capture_rate) 
WHERE capture_rate > 0;

-- Note: The aggregation scripts handle backward compatibility by populating both
-- the legacy fields (if they exist) and the new fields