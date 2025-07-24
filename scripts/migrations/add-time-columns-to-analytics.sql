-- Add start_time and end_time columns to analytics tables
-- This makes the time period explicit and consistent with raw data tables

-- Add columns to hourly_analytics
ALTER TABLE hourly_analytics 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Add columns to daily_analytics  
ALTER TABLE daily_analytics
ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE;

-- Update existing hourly records with calculated timestamps
UPDATE hourly_analytics
SET 
  start_time = date + (hour || ' hours')::INTERVAL,
  end_time = date + (hour || ' hours')::INTERVAL + INTERVAL '1 hour' - INTERVAL '1 second'
WHERE start_time IS NULL;

-- Update existing daily records with calculated timestamps
UPDATE daily_analytics
SET 
  start_time = date::TIMESTAMP,
  end_time = date::TIMESTAMP + INTERVAL '1 day' - INTERVAL '1 second'
WHERE start_time IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_start_time ON hourly_analytics(start_time);
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_end_time ON hourly_analytics(end_time);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_start_time ON daily_analytics(start_time);
CREATE INDEX IF NOT EXISTS idx_daily_analytics_end_time ON daily_analytics(end_time);

-- Verify the update
SELECT 
  'Hourly Analytics Time Columns' as table_name,
  COUNT(*) as total_records,
  COUNT(start_time) as records_with_start_time,
  COUNT(end_time) as records_with_end_time,
  MIN(start_time) as earliest_start,
  MAX(end_time) as latest_end
FROM hourly_analytics;

SELECT 
  'Daily Analytics Time Columns' as table_name,
  COUNT(*) as total_records,
  COUNT(start_time) as records_with_start_time,
  COUNT(end_time) as records_with_end_time,
  MIN(start_time) as earliest_start,
  MAX(end_time) as latest_end
FROM daily_analytics;

-- Sample data to verify correctness
SELECT 
  store_name,
  date,
  hour,
  start_time,
  end_time,
  total_entries,
  total_zone_occupancy
FROM hourly_analytics
WHERE date >= '2025-07-01'
ORDER BY start_time DESC
LIMIT 5;