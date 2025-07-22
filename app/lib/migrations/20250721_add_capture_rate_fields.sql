-- Add capture rate fields to people_counting_data table
ALTER TABLE people_counting_data
ADD COLUMN IF NOT EXISTS passing_traffic INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passing_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS passing_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dominant_direction VARCHAR(10),
ADD COLUMN IF NOT EXISTS capture_rate DECIMAL(5,2);

-- Add indexes for capture rate analysis
CREATE INDEX IF NOT EXISTS idx_people_counting_capture_rate 
ON people_counting_data(sensor_id, timestamp, capture_rate);

CREATE INDEX IF NOT EXISTS idx_people_counting_passing_traffic
ON people_counting_data(sensor_id, timestamp, passing_traffic);

-- Update hourly_analytics to include capture rate metrics
ALTER TABLE hourly_analytics
ADD COLUMN IF NOT EXISTS avg_capture_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS total_passing_traffic INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dominant_traffic_direction VARCHAR(10);

-- Add comment explaining the business logic
COMMENT ON COLUMN people_counting_data.passing_traffic IS 'Total people passing by store (Line 4 In + Out)';
COMMENT ON COLUMN people_counting_data.passing_in IS 'People passing from one direction (Line 4 In)';
COMMENT ON COLUMN people_counting_data.passing_out IS 'People passing from other direction (Line 4 Out)';
COMMENT ON COLUMN people_counting_data.capture_rate IS 'Percentage of passing traffic that entered store (store entries / passing traffic * 100)';
COMMENT ON COLUMN people_counting_data.dominant_direction IS 'Direction with more passing traffic (in or out)';