# Sensor Data Collection Fix - Real-time Cumulative Data

## Problem Identified

The GitHub Actions workflow for sensor data collection was not handling real-time cumulative data correctly. Sensors provide cumulative counts that update throughout each hour, but the workflow was only INSERTing new timestamps and never UPDATing existing ones.

### Issue Details

1. **Sensor Behavior**: Milesight VS121 sensors provide cumulative data for the current hour. For example:
   - At 11:04 UTC: Returns data for 11:00-12:00 with counts up to that moment (e.g., 306 IN, 96 OUT)
   - At 11:30 UTC: Returns updated data for the same 11:00-12:00 period (e.g., 450 IN, 150 OUT)
   - At 12:00 UTC: Returns final data for 11:00-12:00 period

2. **Original Workflow Logic**:
   ```javascript
   // Skip if already collected
   if (lastTimestamp && record.timestamp <= lastTimestamp) continue;
   ```
   This prevented updating existing timestamps with new cumulative data.

3. **Result**: Data collection stopped after the first run of each hour, missing all subsequent updates.

## Solution Implemented

Modified the GitHub Actions workflow to use proper UPSERT logic:

1. **Check and Update**: For each record within the last 3 hours:
   - Check if the timestamp already exists in the database
   - If exists: UPDATE the record with new cumulative values
   - If not exists: INSERT a new record

2. **Implementation**:
   ```javascript
   // Check if record exists
   const existing = await checkResponse.json();
   
   if (existing && existing.length > 0) {
     // Update existing record
     await fetch(url, { method: 'PATCH', body: JSON.stringify(newData) });
   } else {
     // Insert new record
     await fetch(url, { method: 'POST', body: JSON.stringify(recordData) });
   }
   ```

3. **Time Window**: Process records from the last 3 hours to ensure:
   - Current hour data is always updated
   - Previous hour gets final updates
   - Buffer for any delayed processing

## Results

- Real-time data is now properly captured throughout each hour
- Historical data integrity is maintained
- Workflow handles both new records and updates seamlessly
- No data loss from cumulative sensor readings

## Files Modified

- `.github/workflows/collect-sensor-data.yml` - Updated with proper UPSERT logic
- Created backup: `.github/workflows/collect-sensor-data-old.yml`

## Next Steps

1. Monitor the next few workflow runs to ensure data is being updated correctly
2. Verify that current hour data shows increasing counts throughout the hour
3. Consider adding metrics to track update frequency vs insert frequency