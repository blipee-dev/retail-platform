-- Comprehensive table restructure to support all KPIs we designed
-- This migration fixes raw data tables first, then analytics tables

-- ================================================
-- STEP 1: Fix people_counting_raw table
-- ================================================
-- This table should store raw sensor data with proper structure

-- First, let's see what we currently have
SELECT 'Current people_counting_raw structure:' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'people_counting_raw' 
ORDER BY ordinal_position;

-- The table should have:
-- - Basic identification (id, sensor_id, store_id, organization_id)
-- - Timestamps (timestamp, end_time)
-- - Line data (line1_in, line1_out, etc. for 4 lines)
-- - Computed totals
-- - Metadata (created_at)

-- No changes needed here as the structure is already correct
-- (based on our earlier investigation)

-- ================================================
-- STEP 2: Fix regional_counting_raw table
-- ================================================
SELECT 'Current regional_counting_raw structure:' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'regional_counting_raw' 
ORDER BY ordinal_position;

-- The table should have:
-- - Basic identification (id, sensor_id, store_id, organization_id)
-- - Timestamps (timestamp, end_time)
-- - Region counts (region1_count through region4_count)
-- - Metadata (created_at)

-- Ensure all required columns exist
ALTER TABLE regional_counting_raw
ADD COLUMN IF NOT EXISTS sensor_id UUID REFERENCES sensor_metadata(id),
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS store_id UUID NOT NULL REFERENCES stores(id);

-- ================================================
-- STEP 3: Clean and restructure hourly_analytics
-- ================================================
SELECT 'Restructuring hourly_analytics table...' as step;

-- Create a new clean table with the exact structure we need
CREATE TABLE IF NOT EXISTS hourly_analytics_new (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Time identification (no sensor_id - analytics are at store level)
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  
  -- People Counting KPIs
  -- Raw counts
  total_entries INTEGER DEFAULT 0,
  total_exits INTEGER DEFAULT 0,
  net_flow INTEGER GENERATED ALWAYS AS (total_entries - total_exits) STORED,
  
  -- Store traffic (Lines 1-3)
  store_entries INTEGER DEFAULT 0,
  store_exits INTEGER DEFAULT 0,
  
  -- Passerby traffic (Line 4)
  passerby_count INTEGER DEFAULT 0,
  passerby_in INTEGER DEFAULT 0,
  passerby_out INTEGER DEFAULT 0,
  
  -- Capture rate
  capture_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Entry distribution (% through each entrance)
  entry_line1_pct DECIMAL(5,2) DEFAULT 0,
  entry_line2_pct DECIMAL(5,2) DEFAULT 0,
  entry_line3_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Exit distribution (% through each exit)
  exit_line1_pct DECIMAL(5,2) DEFAULT 0,
  exit_line2_pct DECIMAL(5,2) DEFAULT 0,
  exit_line3_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Line details
  line1_in INTEGER DEFAULT 0,
  line1_out INTEGER DEFAULT 0,
  line2_in INTEGER DEFAULT 0,
  line2_out INTEGER DEFAULT 0,
  line3_in INTEGER DEFAULT 0,
  line3_out INTEGER DEFAULT 0,
  line4_in INTEGER DEFAULT 0,
  line4_out INTEGER DEFAULT 0,
  
  -- Regional Analytics KPIs
  -- Dwell time
  avg_store_dwell_time DECIMAL(6,2) DEFAULT 0,
  
  -- Zone occupancy
  total_zone_occupancy INTEGER DEFAULT 0,
  zone1_peak_occupancy INTEGER DEFAULT 0,
  zone2_peak_occupancy INTEGER DEFAULT 0,
  zone3_peak_occupancy INTEGER DEFAULT 0,
  zone4_peak_occupancy INTEGER DEFAULT 0,
  
  -- Zone share (percentage of total occupancy)
  zone1_share_pct DECIMAL(5,2) DEFAULT 0,
  zone2_share_pct DECIMAL(5,2) DEFAULT 0,
  zone3_share_pct DECIMAL(5,2) DEFAULT 0,
  zone4_share_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Zone dwell contribution
  zone1_dwell_contribution DECIMAL(5,2) DEFAULT 0,
  zone2_dwell_contribution DECIMAL(5,2) DEFAULT 0,
  zone3_dwell_contribution DECIMAL(5,2) DEFAULT 0,
  zone4_dwell_contribution DECIMAL(5,2) DEFAULT 0,
  
  -- Metadata
  sample_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT hourly_analytics_unique UNIQUE (store_id, date, hour)
);

-- Copy any existing good data from old table
INSERT INTO hourly_analytics_new (
  organization_id, store_id, date, hour,
  total_entries, total_exits, store_entries, store_exits,
  passerby_count, passerby_in, passerby_out, capture_rate,
  sample_count, created_at, updated_at
)
SELECT 
  organization_id, store_id, date, hour,
  COALESCE(total_entries, 0), COALESCE(total_exits, 0),
  COALESCE(store_entries, 0), COALESCE(store_exits, 0),
  COALESCE(passerby_count, 0), COALESCE(passerby_in, 0),
  COALESCE(passerby_out, 0), COALESCE(capture_rate, 0),
  COALESCE(sample_count, 0), created_at, updated_at
FROM hourly_analytics
WHERE date IS NOT NULL 
  AND hour IS NOT NULL
  AND store_id IS NOT NULL
  AND organization_id IS NOT NULL;

-- Rename tables
ALTER TABLE hourly_analytics RENAME TO hourly_analytics_old;
ALTER TABLE hourly_analytics_new RENAME TO hourly_analytics;

-- ================================================
-- STEP 4: Clean and restructure daily_analytics
-- ================================================
SELECT 'Restructuring daily_analytics table...' as step;

CREATE TABLE IF NOT EXISTS daily_analytics_new (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  -- Date (no sensor_id - analytics are at store level)
  date DATE NOT NULL,
  
  -- People Counting KPIs (daily totals)
  total_entries INTEGER DEFAULT 0,
  total_exits INTEGER DEFAULT 0,
  net_flow INTEGER GENERATED ALWAYS AS (total_entries - total_exits) STORED,
  
  -- Store traffic
  store_entries INTEGER DEFAULT 0,
  store_exits INTEGER DEFAULT 0,
  
  -- Passerby traffic
  passerby_count INTEGER DEFAULT 0,
  passerby_in INTEGER DEFAULT 0,
  passerby_out INTEGER DEFAULT 0,
  
  -- Daily capture rate
  capture_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Peak hours
  peak_hour INTEGER, -- Hour with most entries
  peak_entry_hour INTEGER,
  peak_exit_hour INTEGER,
  peak_passerby_hour INTEGER,
  
  -- Entry/Exit distribution (daily averages)
  entry_line1_pct DECIMAL(5,2) DEFAULT 0,
  entry_line2_pct DECIMAL(5,2) DEFAULT 0,
  entry_line3_pct DECIMAL(5,2) DEFAULT 0,
  exit_line1_pct DECIMAL(5,2) DEFAULT 0,
  exit_line2_pct DECIMAL(5,2) DEFAULT 0,
  exit_line3_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Business hours analysis
  business_hours_entries INTEGER DEFAULT 0,
  after_hours_entries INTEGER DEFAULT 0,
  business_hours_capture_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Regional Analytics KPIs (daily)
  avg_store_dwell_time DECIMAL(6,2) DEFAULT 0,
  total_zone_occupancy INTEGER DEFAULT 0,
  
  -- Zone metrics
  zone1_share_pct DECIMAL(5,2) DEFAULT 0,
  zone2_share_pct DECIMAL(5,2) DEFAULT 0,
  zone3_share_pct DECIMAL(5,2) DEFAULT 0,
  zone4_share_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Zone peak hours
  zone1_peak_hour INTEGER,
  zone2_peak_hour INTEGER,
  zone3_peak_hour INTEGER,
  zone4_peak_hour INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT daily_analytics_unique UNIQUE (store_id, date)
);

-- Copy any existing good data
INSERT INTO daily_analytics_new (
  organization_id, store_id, date,
  total_entries, total_exits, store_entries, store_exits,
  passerby_count, passerby_in, passerby_out, capture_rate,
  peak_hour, created_at, updated_at
)
SELECT 
  organization_id, store_id, date,
  COALESCE(total_entries, 0), COALESCE(total_exits, 0),
  COALESCE(store_entries, 0), COALESCE(store_exits, 0),
  COALESCE(passerby_count, 0), COALESCE(passerby_in, 0),
  COALESCE(passerby_out, 0), COALESCE(capture_rate, 0),
  peak_hour, created_at, updated_at
FROM daily_analytics
WHERE date IS NOT NULL 
  AND store_id IS NOT NULL
  AND organization_id IS NOT NULL;

-- Rename tables
ALTER TABLE daily_analytics RENAME TO daily_analytics_old;
ALTER TABLE daily_analytics_new RENAME TO daily_analytics;

-- ================================================
-- STEP 5: Create indexes for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_store_date ON hourly_analytics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_date_hour ON hourly_analytics(date, hour);
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_org ON hourly_analytics(organization_id);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_store_date ON daily_analytics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_org ON daily_analytics(organization_id);

-- ================================================
-- STEP 6: Add helpful comments
-- ================================================
COMMENT ON TABLE hourly_analytics IS 'Hourly aggregated analytics at store level combining people counting and regional data';
COMMENT ON TABLE daily_analytics IS 'Daily aggregated analytics at store level with peak hours and business hours analysis';

COMMENT ON COLUMN hourly_analytics.store_entries IS 'Total entries through store entrances (Lines 1-3 only)';
COMMENT ON COLUMN hourly_analytics.passerby_count IS 'Total people passing by store (Line 4 IN + OUT)';
COMMENT ON COLUMN hourly_analytics.capture_rate IS 'Percentage of passersby who entered the store';
COMMENT ON COLUMN hourly_analytics.avg_store_dwell_time IS 'Average minutes customers spent in store based on occupancy data';
COMMENT ON COLUMN hourly_analytics.zone1_share_pct IS 'Percentage of total occupancy in Zone 1';

COMMENT ON COLUMN daily_analytics.peak_hour IS 'Hour of day (0-23) with most store entries';
COMMENT ON COLUMN daily_analytics.business_hours_entries IS 'Entries during business hours (9 AM - 1 AM)';
COMMENT ON COLUMN daily_analytics.business_hours_capture_rate IS 'Capture rate during business hours only';

-- ================================================
-- STEP 7: Verify the new structure
-- ================================================
SELECT 'New table structures created:' as step;

SELECT 
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name IN ('hourly_analytics', 'daily_analytics')
  AND table_schema = 'public'
GROUP BY table_name;

-- ================================================
-- STEP 8: Drop old tables after verification
-- ================================================
-- Run these manually after verifying the migration worked:
-- DROP TABLE IF EXISTS hourly_analytics_old;
-- DROP TABLE IF EXISTS daily_analytics_old;