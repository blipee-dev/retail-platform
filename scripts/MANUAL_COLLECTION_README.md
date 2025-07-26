# Manual Data Collection Guide

This guide explains how to manually collect historical sensor data for July 2025.

## Prerequisites

1. Ensure sensor IPs are correctly configured in the database (see `docs/SENSOR_CONFIGURATION.md`)
2. Have sensor passwords ready
3. Set up environment variables

## Running the Collection

### 1. Set Environment Variables

```bash
# Supabase credentials
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sensor passwords (replace with actual passwords)
export SENSOR_29E75799_328F_4143_9A2F_2BCC1269F77E_PASSWORD=password_for_jj
export SENSOR_FFC2438A_EE4F_4324_96DA_08671EA3B23C_PASSWORD=password_for_oml01
export SENSOR_F63EF2E9_344E_4373_AEDF_04DD05CF8F8B_PASSWORD=password_for_oml02
export SENSOR_7976051C_980B_45E1_B099_45D032F3C7AA_PASSWORD=password_for_oml03

# Or set a default password for all sensors
export DEFAULT_SENSOR_PASSWORD=your_default_password
```

### 2. Run the Collection Script

```bash
cd /workspaces/retail-platform
node scripts/manual-collect-july-data.js
```

## What the Script Does

1. **Fetches sensor configurations** from the database
2. **Validates passwords** are available
3. **Collects data in daily chunks** to avoid timeouts
4. **Handles both types of data**:
   - People counting data → `people_counting_raw` table
   - Regional data (Omnia sensors only) → `regional_counting_raw` table
5. **Checks for existing records** before inserting (prevents duplicates)
6. **Updates existing records** if they already exist

## Collection Details

- **Date Range**: July 1-26, 2025 (00:00:00 to 18:59:59)
- **Chunk Size**: 1 day at a time
- **Delay**: 2 seconds between chunks
- **Progress**: Shows every 100 records

## Monitoring Progress

The script provides detailed output:
- 📊 People counting collection
- 🗺️ Regional data collection  
- ⏳ Progress indicators
- ✅ Success summaries
- ❌ Error messages

## Troubleshooting

### Authentication Errors
- Verify sensor passwords are correct
- Check environment variables are set

### Network Timeouts
- Ensure sensor IPs are accessible
- Check firewall rules
- Verify VPN connection if needed

### Database Errors
- Check Supabase credentials
- Verify RLS policies allow insertion
- Check for unique constraint violations

## After Collection

1. Verify data was collected:
```sql
-- Check people counting data
SELECT COUNT(*), MIN(timestamp), MAX(timestamp)
FROM people_counting_raw
WHERE timestamp >= '2025-07-01' AND timestamp < '2025-07-27';

-- Check by sensor
SELECT sensor_id, COUNT(*) as records
FROM people_counting_raw
WHERE timestamp >= '2025-07-01' AND timestamp < '2025-07-27'
GROUP BY sensor_id;
```

2. Run analytics aggregation if needed:
```bash
node scripts/run_hourly_aggregation.js
node scripts/run_daily_aggregation_fixed.js
```