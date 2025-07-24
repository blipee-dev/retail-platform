-- Fix analytics tables to support all KPIs we designed
-- This migration ensures the tables can capture everything we need

-- First, let's check what columns currently exist and add missing ones

-- Fix hourly_analytics table
ALTER TABLE hourly_analytics 
-- Remove hour_start if it exists (we use date + hour instead)
DROP COLUMN IF EXISTS hour_start,
DROP COLUMN IF EXISTS hour_end,

-- Ensure we have the time columns we need
ADD COLUMN IF NOT EXISTS date DATE NOT NULL,
ADD COLUMN IF NOT EXISTS hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),

-- People counting KPIs (ensure all exist)
ADD COLUMN IF NOT EXISTS total_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_exits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_exits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS capture_rate DECIMAL(5,2) DEFAULT 0,

-- Entry/Exit distribution percentages
ADD COLUMN IF NOT EXISTS entry_line1_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_line2_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_line3_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line1_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line2_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line3_pct DECIMAL(5,2) DEFAULT 0,

-- Line details
ADD COLUMN IF NOT EXISTS line1_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line1_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line2_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line2_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line3_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line3_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line4_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS line4_out INTEGER DEFAULT 0,

-- Regional/Zone metrics
ADD COLUMN IF NOT EXISTS avg_store_dwell_time DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_zone_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone1_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone2_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone3_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone4_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone1_peak_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone2_peak_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone3_peak_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone4_peak_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone1_dwell_contribution DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone2_dwell_contribution DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone3_dwell_contribution DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone4_dwell_contribution DECIMAL(5,2) DEFAULT 0,

-- Metadata
ADD COLUMN IF NOT EXISTS sample_count INTEGER DEFAULT 0;

-- Create unique constraint on store + date + hour
ALTER TABLE hourly_analytics 
DROP CONSTRAINT IF EXISTS hourly_analytics_store_date_hour_key;

ALTER TABLE hourly_analytics 
ADD CONSTRAINT hourly_analytics_store_date_hour_key 
UNIQUE (store_id, date, hour);

-- Fix daily_analytics table
ALTER TABLE daily_analytics 
-- People counting KPIs
ADD COLUMN IF NOT EXISTS total_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_exits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_exits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS capture_rate DECIMAL(5,2) DEFAULT 0,

-- Peak hours
ADD COLUMN IF NOT EXISTS peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS peak_entry_hour INTEGER,
ADD COLUMN IF NOT EXISTS peak_exit_hour INTEGER,
ADD COLUMN IF NOT EXISTS peak_passerby_hour INTEGER,

-- Entry/Exit distribution percentages (daily averages)
ADD COLUMN IF NOT EXISTS entry_line1_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_line2_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_line3_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line1_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line2_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line3_pct DECIMAL(5,2) DEFAULT 0,

-- Business hours analysis
ADD COLUMN IF NOT EXISTS business_hours_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_hours_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_hours_capture_rate DECIMAL(5,2) DEFAULT 0,

-- Regional/Zone metrics
ADD COLUMN IF NOT EXISTS avg_store_dwell_time DECIMAL(6,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_zone_occupancy INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone1_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone2_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone3_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone4_share_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS zone1_peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS zone2_peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS zone3_peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS zone4_peak_hour INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_store_date 
ON hourly_analytics(store_id, date, hour);

CREATE INDEX IF NOT EXISTS idx_hourly_analytics_date 
ON hourly_analytics(date);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_store_date 
ON daily_analytics(store_id, date);

-- Add comments to document the columns
COMMENT ON COLUMN hourly_analytics.date IS 'Date of the hourly period';
COMMENT ON COLUMN hourly_analytics.hour IS 'Hour of day (0-23)';
COMMENT ON COLUMN hourly_analytics.store_entries IS 'Total entries through Lines 1-3 (excludes passersby)';
COMMENT ON COLUMN hourly_analytics.store_exits IS 'Total exits through Lines 1-3 (excludes passersby)';
COMMENT ON COLUMN hourly_analytics.passerby_count IS 'Total passersby (Line 4 IN + OUT)';
COMMENT ON COLUMN hourly_analytics.capture_rate IS 'Percentage of passersby who entered store';
COMMENT ON COLUMN hourly_analytics.avg_store_dwell_time IS 'Average time spent in store (minutes)';
COMMENT ON COLUMN hourly_analytics.total_zone_occupancy IS 'Sum of all zone occupancies for the hour';

COMMENT ON COLUMN daily_analytics.peak_hour IS 'Hour with most store entries (0-23)';
COMMENT ON COLUMN daily_analytics.business_hours_entries IS 'Entries during business hours (9AM-1AM)';
COMMENT ON COLUMN daily_analytics.zone1_peak_hour IS 'Hour with highest Zone 1 occupancy';

-- Verify the structure
SELECT 
  'hourly_analytics' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'hourly_analytics'
  AND table_schema = 'public'
UNION ALL
SELECT 
  'daily_analytics' as table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'daily_analytics'
  AND table_schema = 'public';