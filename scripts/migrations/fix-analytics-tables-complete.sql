-- Complete fix for analytics tables to support all our KPIs
-- This migration fixes all structural issues

-- First, clean up any problematic data
-- Delete rows with NULL sensor_id before we try to modify constraints
DELETE FROM daily_analytics 
WHERE sensor_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_analytics' 
    AND column_name = 'sensor_id'
  );

DELETE FROM hourly_analytics 
WHERE sensor_id IS NULL 
  AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hourly_analytics' 
    AND column_name = 'sensor_id'
  );

-- Now let's check current structure and fix it
DO $$
BEGIN
  -- Check if we need to remove sensor_id from daily_analytics
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'daily_analytics' 
    AND column_name = 'sensor_id'
    AND is_nullable = 'NO'
  ) THEN
    -- Make sensor_id nullable first, then we can remove it
    ALTER TABLE daily_analytics ALTER COLUMN sensor_id DROP NOT NULL;
  END IF;
  
  -- Same for hourly_analytics
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hourly_analytics' 
    AND column_name = 'sensor_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE hourly_analytics ALTER COLUMN sensor_id DROP NOT NULL;
  END IF;
END $$;

-- Remove columns that shouldn't be in analytics tables
ALTER TABLE hourly_analytics 
DROP COLUMN IF EXISTS sensor_id,  -- Analytics are at store level, not sensor level
DROP COLUMN IF EXISTS hour_start,  -- We use date + hour instead
DROP COLUMN IF EXISTS hour_end;

ALTER TABLE daily_analytics 
DROP COLUMN IF EXISTS sensor_id;  -- Analytics are at store level, not sensor level

-- Now add all the columns we need for hourly_analytics
ALTER TABLE hourly_analytics 
-- Time columns (ensure they exist and are NOT NULL)
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS hour INTEGER CHECK (hour >= 0 AND hour <= 23);

-- Make date and hour NOT NULL if they exist but are nullable
DO $$
BEGIN
  -- Update any NULL dates to a default before making NOT NULL
  UPDATE hourly_analytics SET date = CURRENT_DATE WHERE date IS NULL;
  UPDATE hourly_analytics SET hour = 0 WHERE hour IS NULL;
  
  -- Now make them NOT NULL
  ALTER TABLE hourly_analytics 
    ALTER COLUMN date SET NOT NULL,
    ALTER COLUMN hour SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set NOT NULL constraints: %', SQLERRM;
END $$;

-- Add all KPI columns with proper defaults
ALTER TABLE hourly_analytics 
-- People counting metrics
ADD COLUMN IF NOT EXISTS total_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_exits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_exits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passerby_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS capture_rate DECIMAL(5,2) DEFAULT 0,

-- Entry/Exit distribution
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

-- Regional metrics
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

-- Fix daily_analytics table
ALTER TABLE daily_analytics 
-- Ensure date is NOT NULL
ADD COLUMN IF NOT EXISTS date DATE;

DO $$
BEGIN
  UPDATE daily_analytics SET date = CURRENT_DATE WHERE date IS NULL;
  ALTER TABLE daily_analytics ALTER COLUMN date SET NOT NULL;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Could not set date NOT NULL: %', SQLERRM;
END $$;

ALTER TABLE daily_analytics 
-- People counting metrics
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

-- Distribution averages
ADD COLUMN IF NOT EXISTS entry_line1_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_line2_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS entry_line3_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line1_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line2_pct DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS exit_line3_pct DECIMAL(5,2) DEFAULT 0,

-- Business hours
ADD COLUMN IF NOT EXISTS business_hours_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS after_hours_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_hours_capture_rate DECIMAL(5,2) DEFAULT 0,

-- Regional metrics
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

-- Create proper unique constraints
ALTER TABLE hourly_analytics 
DROP CONSTRAINT IF EXISTS hourly_analytics_unique_key,
DROP CONSTRAINT IF EXISTS hourly_analytics_store_date_hour_key;

ALTER TABLE hourly_analytics 
ADD CONSTRAINT hourly_analytics_unique_key 
UNIQUE (store_id, date, hour);

ALTER TABLE daily_analytics 
DROP CONSTRAINT IF EXISTS daily_analytics_unique_key,
DROP CONSTRAINT IF EXISTS daily_analytics_store_date_key;

ALTER TABLE daily_analytics 
ADD CONSTRAINT daily_analytics_unique_key 
UNIQUE (store_id, date);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_date_hour 
ON hourly_analytics(date, hour);

CREATE INDEX IF NOT EXISTS idx_hourly_analytics_store_date 
ON hourly_analytics(store_id, date);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date 
ON daily_analytics(date);

CREATE INDEX IF NOT EXISTS idx_daily_analytics_store_date 
ON daily_analytics(store_id, date);

-- Add helpful comments
COMMENT ON TABLE hourly_analytics IS 'Hourly aggregated analytics at store level (not sensor level)';
COMMENT ON TABLE daily_analytics IS 'Daily aggregated analytics at store level (not sensor level)';

COMMENT ON COLUMN hourly_analytics.store_entries IS 'Total entries through store entrances (Lines 1-3)';
COMMENT ON COLUMN hourly_analytics.passerby_count IS 'Total people passing by (Line 4)';
COMMENT ON COLUMN hourly_analytics.capture_rate IS 'Percentage of passersby who entered the store';
COMMENT ON COLUMN hourly_analytics.avg_store_dwell_time IS 'Average minutes spent in store based on regional occupancy';

-- Verify the final structure
SELECT 
  'Table structure after migration:' as info;

SELECT 
  table_name,
  COUNT(*) as column_count,
  STRING_AGG(
    CASE 
      WHEN column_name IN ('date', 'hour', 'store_id', 'organization_id') THEN column_name || '*'
      ELSE column_name 
    END, 
    ', ' ORDER BY ordinal_position
  ) as key_columns
FROM information_schema.columns 
WHERE table_name IN ('hourly_analytics', 'daily_analytics')
  AND table_schema = 'public'
GROUP BY table_name;