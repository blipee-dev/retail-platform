# Cleanup Future Data Guide

## Problem
Some sensor data has timestamps in the future due to incorrect timezone handling before the fix was applied.

## Solution Options

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the queries from `scripts/migrations/remove-future-data.sql`:

```sql
-- First, check how much future data exists
SELECT 
    COUNT(*) as future_records,
    MIN(timestamp) as earliest_future,
    MAX(timestamp) as latest_future,
    COUNT(DISTINCT DATE(timestamp)) as days_affected
FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP;

-- Then delete it
DELETE FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP;
```

### Option 2: Using Node.js Script

Once network connectivity is restored:

```bash
# Check future data
node scripts/debug/remove-future-data.js

# Delete future data
node scripts/debug/remove-future-data.js --confirm
```

### Option 3: Using Supabase Dashboard

1. Go to Table Editor in Supabase
2. Select `people_counting_raw` table
3. Add filter: `timestamp` > `now()`
4. Select all rows and delete

## Prevention

The workflow now properly filters future data with these checks:

1. **Sensor Local Time Check**: Compares against sensor's local time
2. **UTC Conversion**: Properly converts to UTC before storage
3. **Future Data Filter**: Skips any records with timestamps > current time

## Verification

After cleanup, verify no future data remains:

```sql
SELECT COUNT(*) FROM people_counting_raw
WHERE timestamp > CURRENT_TIMESTAMP;
```

Should return 0.

## Note

The fixed workflow (from PR #13) prevents any new future data from being inserted, so this cleanup only needs to be done once for historical data.