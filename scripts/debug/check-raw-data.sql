-- Check recent data in people_counting_raw
SELECT 
    COUNT(*) as total_records,
    MIN(timestamp) as oldest_record,
    MAX(timestamp) as newest_record,
    EXTRACT(EPOCH FROM (NOW() - MAX(timestamp)))/60 as minutes_since_last_record
FROM people_counting_raw
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- Check data by store
SELECT 
    s.name as store_name,
    s.timezone,
    COUNT(*) as record_count,
    MIN(pcr.timestamp) as oldest_record,
    MAX(pcr.timestamp) as newest_record,
    EXTRACT(EPOCH FROM (NOW() - MAX(pcr.timestamp)))/60 as minutes_since_last
FROM people_counting_raw pcr
JOIN stores s ON s.id = pcr.store_id
WHERE pcr.timestamp > NOW() - INTERVAL '24 hours'
GROUP BY s.id, s.name, s.timezone
ORDER BY minutes_since_last;

-- Check hourly analytics table
SELECT 
    COUNT(*) as total_records,
    MIN(hour_start) as oldest_hour,
    MAX(hour_start) as newest_hour,
    EXTRACT(EPOCH FROM (NOW() - MAX(hour_start)))/60 as minutes_since_last_hour
FROM hourly_analytics
WHERE hour_start > NOW() - INTERVAL '24 hours';

-- Check if there's data in the last 3 hours (aggregation window)
SELECT 
    date_trunc('hour', timestamp) as hour,
    COUNT(*) as records_count,
    SUM(line1_in + line2_in + line3_in) as total_entries,
    SUM(line1_out + line2_out + line3_out) as total_exits
FROM people_counting_raw
WHERE timestamp > NOW() - INTERVAL '3 hours'
GROUP BY date_trunc('hour', timestamp)
ORDER BY hour DESC;