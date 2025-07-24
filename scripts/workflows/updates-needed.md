# GitHub Actions Workflow Updates Needed

## Changes Required Due to Database Updates

### 1. Sensor Type Standardization
- All sensors are now `milesight_sensor` type (not `omnia` or `milesight_people_counter`)
- Both sensor types support people counting AND regional counting

### 2. Database Structure Changes
- Added `start_time` and `end_time` columns to analytics tables
- Removed `_old` tables
- Added table descriptions

### 3. Regional Data Collection
- Need to collect regional data from ALL sensors, not just Omnia

## Files to Update

### 1. `/scripts/workflows/collect-regional-data.js`
```javascript
// OLD - Line 33
const omniaSensors = sensors.filter(s => s.sensor_type === 'omnia');

// NEW - All sensors support regional counting
const regionalSensors = sensors; // All active sensors
```

### 2. `/scripts/workflows/lib/sensor-client.js`
Update sensor type normalization since all are now `milesight_sensor`:
```javascript
// OLD
const normalizedType = type.includes('milesight') ? 'milesight' : 
                      type.includes('omnia') ? 'omnia' : type;

// NEW  
const normalizedType = 'milesight'; // All sensors are milesight
```

### 3. Aggregation Scripts
Need to ensure aggregation functions populate the new `start_time` and `end_time` columns.

### 4. Add SENSOR_AUTH_MILESIGHT to regional collection workflow
The regional collection workflow only has SENSOR_AUTH_OMNIA but now needs both.

## Specific Updates Needed

1. **collect-regional-data.js**: Remove Omnia-only filter
2. **sensor-client.js**: Simplify sensor type handling
3. **collect-regional-data-v2.yml**: Add SENSOR_AUTH_MILESIGHT env var
4. **Update aggregation functions**: Include start_time/end_time columns
5. **Update any hardcoded sensor type checks**