# Fix for Real-Time Data Collection

## The Problem
The current GitHub Actions workflow skips timestamps that already exist in the database. But sensors provide cumulative data for the current hour that updates throughout the hour.

Example:
- At 11:00: Sensor reports 11:00 timestamp with 0 people
- At 11:30: Sensor reports 11:00 timestamp with 150 people  
- At 12:00: Sensor reports 11:00 timestamp with 306 people (final)

The workflow currently only inserts the first one and skips updates.

## The Solution

The workflow needs to be modified to:

1. **For past hours**: Skip if already collected (current behavior)
2. **For current hour**: Update the existing record with new cumulative data

### Code change needed in `.github/workflows/collect-sensor-data.yml`:

```javascript
// Around line 139, replace:
if (lastTimestamp && record.timestamp <= lastTimestamp) continue;

// With:
const isCurrentHour = record.timestamp.getHours() === now.getHours() && 
                     record.timestamp.toDateString() === now.toDateString();

if (lastTimestamp && record.timestamp <= lastTimestamp && !isCurrentHour) {
  // Skip past hours that are already collected
  continue;
}

// For current hour, we'll update the existing record
if (isCurrentHour && lastTimestamp && record.timestamp <= lastTimestamp) {
  // Update existing record instead of insert
  const updateResponse = await fetch(
    `${supabaseUrl}/rest/v1/people_counting_raw?sensor_id=eq.${sensor.id}&timestamp=eq.${record.timestamp.toISOString()}`,
    {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        line1_in: record.line1_in,
        line1_out: record.line1_out,
        // ... other fields
      })
    }
  );
}
```

## Alternative: Upsert Strategy

Use PostgreSQL's UPSERT (INSERT ... ON CONFLICT UPDATE):

```javascript
// Use upsert for all records
const insertResponse = await fetch(`${supabaseUrl}/rest/v1/people_counting_raw`, {
  method: 'POST',
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal,resolution=merge-duplicates'
  },
  body: JSON.stringify(recordsToInsert)
});
```

This will:
- Insert new records
- Update existing records with new data
- Perfect for cumulative sensor data!

## Current Workaround

Until the workflow is fixed, run it manually every 30 minutes to get updated counts for the current hour.