-- Add regional analytics KPIs to hourly and daily analytics tables
-- This migration adds comprehensive regional counting metrics and combined insights

-- Add regional metrics to hourly_analytics table
ALTER TABLE hourly_analytics 
-- Store-wide dwell time from regional data
ADD COLUMN IF NOT EXISTS avg_store_dwell_time DECIMAL(6,2),
-- Total occupancy across all zones
ADD COLUMN IF NOT EXISTS total_zone_occupancy INTEGER,
-- Zone share percentages (where customers spend time)
ADD COLUMN IF NOT EXISTS zone1_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone2_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone3_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone4_share_pct DECIMAL(5,2),
-- Peak occupancy per zone
ADD COLUMN IF NOT EXISTS zone1_peak_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone2_peak_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone3_peak_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone4_peak_occupancy INTEGER,
-- Zone dwell contribution (person-minutes)
ADD COLUMN IF NOT EXISTS zone1_dwell_contribution DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone2_dwell_contribution DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone3_dwell_contribution DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone4_dwell_contribution DECIMAL(5,2),
-- Combined metric for validation
ADD COLUMN IF NOT EXISTS occupancy_accuracy_score DECIMAL(5,2);

-- Add regional metrics to daily_analytics table
ALTER TABLE daily_analytics
-- All hourly columns plus:
ADD COLUMN IF NOT EXISTS avg_store_dwell_time DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS total_zone_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone1_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone2_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone3_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone4_share_pct DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS zone1_peak_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone2_peak_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone3_peak_occupancy INTEGER,
ADD COLUMN IF NOT EXISTS zone4_peak_occupancy INTEGER,
-- When zone peaks occurred
ADD COLUMN IF NOT EXISTS zone1_peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS zone2_peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS zone3_peak_hour INTEGER,
ADD COLUMN IF NOT EXISTS zone4_peak_hour INTEGER,
-- Zone dwell contributions not needed for daily (redundant with share)
-- Combined validation metric
ADD COLUMN IF NOT EXISTS occupancy_accuracy_score DECIMAL(5,2);

-- Add helpful comments
COMMENT ON COLUMN hourly_analytics.avg_store_dwell_time IS 'Average time customers spend in store (minutes) calculated from regional data';
COMMENT ON COLUMN hourly_analytics.total_zone_occupancy IS 'Sum of all zone occupancies at this hour';
COMMENT ON COLUMN hourly_analytics.zone1_share_pct IS 'Percentage of total occupancy in Zone 1';
COMMENT ON COLUMN hourly_analytics.zone1_peak_occupancy IS 'Maximum occupancy reached in Zone 1 this hour';
COMMENT ON COLUMN hourly_analytics.zone1_dwell_contribution IS 'Percentage of total person-minutes spent in Zone 1';
COMMENT ON COLUMN hourly_analytics.occupancy_accuracy_score IS 'Validation score comparing people counting vs regional data';

COMMENT ON COLUMN daily_analytics.avg_store_dwell_time IS 'Daily average dwell time across all customers';
COMMENT ON COLUMN daily_analytics.zone1_peak_hour IS 'Hour when Zone 1 reached peak occupancy (0-23)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_dwell_time 
ON hourly_analytics(store_id, date, avg_store_dwell_time) 
WHERE avg_store_dwell_time > 0;

CREATE INDEX IF NOT EXISTS idx_daily_analytics_zone_occupancy 
ON daily_analytics(store_id, date, total_zone_occupancy) 
WHERE total_zone_occupancy > 0;

-- Create views for easier reporting

-- Zone performance view
CREATE OR REPLACE VIEW zone_performance_daily AS
SELECT 
  store_id,
  date,
  -- Zone rankings
  CASE 
    WHEN zone1_share_pct >= GREATEST(zone2_share_pct, zone3_share_pct, zone4_share_pct) THEN 'Zone 1'
    WHEN zone2_share_pct >= GREATEST(zone1_share_pct, zone3_share_pct, zone4_share_pct) THEN 'Zone 2'
    WHEN zone3_share_pct >= GREATEST(zone1_share_pct, zone2_share_pct, zone4_share_pct) THEN 'Zone 3'
    ELSE 'Zone 4'
  END as most_popular_zone,
  -- Combined metrics
  store_entries,
  passerby_count,
  capture_rate,
  avg_store_dwell_time,
  total_zone_occupancy
FROM daily_analytics
WHERE date >= CURRENT_DATE - INTERVAL '30 days';

-- Validation view to check data consistency
CREATE OR REPLACE VIEW data_validation_hourly AS
SELECT 
  h.store_id,
  h.date,
  h.hour,
  h.store_entries,
  h.store_exits,
  h.store_entries - h.store_exits as calculated_occupancy,
  h.total_zone_occupancy as measured_occupancy,
  ABS((h.store_entries - h.store_exits) - h.total_zone_occupancy) as occupancy_difference,
  CASE 
    WHEN h.total_zone_occupancy > 0 AND (h.store_entries - h.store_exits) > 0 THEN
      100 - (ABS((h.store_entries - h.store_exits) - h.total_zone_occupancy) / h.total_zone_occupancy * 100)
    ELSE 0
  END as accuracy_percentage
FROM hourly_analytics h
WHERE h.date >= CURRENT_DATE - INTERVAL '7 days'
  AND h.total_zone_occupancy IS NOT NULL;