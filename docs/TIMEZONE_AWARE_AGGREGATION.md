# Timezone-Aware Daily Aggregation

## Overview

The blipee OS Retail Intelligence platform now supports timezone-aware daily aggregation, ensuring that each store's daily analytics are calculated based on their local business day (midnight to midnight in their timezone).

## How It Works

### 1. Hourly Check
- A workflow runs every hour checking all active stores
- Calculates each store's current local time
- Identifies stores where it's between midnight and 2 AM local time

### 2. Store-Specific Aggregation
- Runs aggregation for each store independently
- Uses the store's timezone to define the day boundaries
- Ensures data aligns with local business operations

### 3. Benefits
- **Accurate Daily Reports**: Data matches the store's actual business day
- **Global Support**: Works across all timezones
- **Parallel Processing**: Multiple stores can be aggregated simultaneously

## Implementation

### Workflow: `.github/workflows/timezone-daily-aggregation.yml`

```yaml
schedule:
  - cron: '0 * * * *'  # Runs every hour
```

### Process Flow

1. **Check Stores** (`check-stores` job)
   - Queries all active stores from database
   - Calculates local time for each store
   - Outputs list of stores needing aggregation

2. **Aggregate Stores** (`aggregate-stores` job)
   - Uses GitHub Actions matrix strategy
   - Runs parallel aggregation for up to 5 stores
   - Each store gets its own aggregation job

3. **Summary** (`summary` job)
   - Provides overview of aggregation results
   - Logs completion status

## Store Timezone Configuration

Stores must have a valid timezone in the database:

```sql
UPDATE stores 
SET timezone = 'America/New_York' 
WHERE id = 'store-123';
```

Supported timezones include:
- `Europe/London`
- `Europe/Lisbon`
- `Europe/Paris`
- `America/New_York`
- `America/Los_Angeles`
- `Asia/Tokyo`
- `Australia/Sydney`
- And many more...

## Daily Analytics Structure

The aggregation creates/updates records in `daily_analytics` table with:

- **Temporal Data**
  - `date`: The local date (YYYY-MM-DD)
  - `start_time`: Day start in UTC
  - `end_time`: Day end in UTC

- **Traffic Metrics**
  - `total_in`: Total entries for the day
  - `total_out`: Total exits for the day
  - `peak_occupancy`: Maximum occupancy reached
  - `avg_occupancy`: Average occupancy throughout the day

- **Insights**
  - `peak_hour`: Hour with highest traffic (0-23)
  - `busiest_period`: morning/afternoon/evening
  - `operational_hours`: Hours with data
  - `data_quality_score`: 0-100 based on completeness

## Manual Execution

### Aggregate Specific Store
```bash
gh workflow run timezone-daily-aggregation.yml \
  -f store_id=store-123
```

### Force Aggregate All Stores
```bash
gh workflow run timezone-daily-aggregation.yml \
  -f force_all=true
```

## Monitoring

Check aggregation status:
```sql
SELECT 
  s.name,
  s.timezone,
  da.date,
  da.created_at
FROM stores s
LEFT JOIN daily_analytics da ON s.id = da.store_id
  AND da.date = CURRENT_DATE - INTERVAL '1 day'
WHERE s.is_active = true
ORDER BY s.timezone, s.name;
```

## Troubleshooting

### Store Not Being Aggregated
1. Check store timezone is set correctly
2. Verify store is marked as active
3. Ensure sensors are associated with the store
4. Check workflow logs for errors

### Data Quality Issues
- Review `data_quality_score` in daily_analytics
- Check for gaps in hourly_analytics data
- Verify sensor connectivity during the day

## Migration from UTC-Only

If migrating from UTC-only aggregation:

1. Set correct timezones for all stores
2. Re-run historical aggregation if needed
3. Update reports to use local dates

```bash
# Re-aggregate last 7 days for a store
for i in {1..7}; do
  gh workflow run timezone-daily-aggregation.yml \
    -f store_id=store-123
done
```