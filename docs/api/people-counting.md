# blipee OS Retail Intelligence - People Counting API

The People Counting API provides access to foot traffic data from sensors installed at retail locations. All data is stored in the `people_counting_raw` table and aggregated into `hourly_analytics` and `daily_analytics` tables for performance.

## Base URL

```
https://retail-platform.vercel.app/api
```

## Authentication

All endpoints require Bearer token authentication:

```bash
Authorization: Bearer <your-supabase-token>
```

## Endpoints

### Get Hourly Analytics

Returns pre-aggregated hourly foot traffic data.

```http
GET /api/analytics?type=hourly
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Must be "hourly" |
| store_id | string | No | Filter by store UUID |
| sensor_id | string | No | Filter by sensor ID |
| start_date | string | No | Start date (ISO 8601) |
| end_date | string | No | End date (ISO 8601) |

#### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "sensor_id": "OML01-PC",
      "start_time": "2025-07-26T10:00:00Z",
      "end_time": "2025-07-26T11:00:00Z",
      "total_in": 145,
      "total_out": 142,
      "net_occupancy": 3,
      "peak_occupancy": 25,
      "conversion_rate": 0.00,
      "transactions": 0
    }
  ],
  "meta": {
    "total": 24,
    "page": 1,
    "per_page": 50
  }
}
```

### Get Daily Analytics

Returns daily aggregated metrics with comparisons.

```http
GET /api/analytics?type=daily
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Must be "daily" |
| store_id | string | No | Filter by store UUID |
| date | string | No | Specific date (YYYY-MM-DD) |
| start_date | string | No | Start date range |
| end_date | string | No | End date range |

#### Response

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "date": "2025-07-26",
      "total_footfall": 2450,
      "unique_visitors": 1890,
      "peak_hour": 14,
      "peak_hour_footfall": 287,
      "conversion_rate": 0.00,
      "avg_dwell_time": 0,
      "vs_yesterday_percent": 5.2,
      "vs_last_week_percent": -2.1,
      "vs_last_month_percent": 8.7,
      "total_revenue": 0.00,
      "total_transactions": 0
    }
  ]
}
```

### Submit Sensor Data

Ingests raw people counting data from sensors.

```http
POST /api/sensors/data
```

#### Request Body

```json
{
  "sensor_id": "OML01-PC",
  "timestamp": "2025-07-26T10:30:00Z",
  "in_count": 15,
  "out_count": 12,
  "metadata": {
    "temperature": 22.5,
    "battery": 85
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "sensor_id": "OML01-PC",
    "timestamp": "2025-07-26T10:30:00Z",
    "in_count": 15,
    "out_count": 12
  }
}
```

### Bulk Data Ingestion

Submit multiple sensor readings at once.

```http
POST /api/sensors/bulk-ingest
```

#### Request Body

```json
{
  "sensor_id": "OML01-PC",
  "data": [
    {
      "timestamp": "2025-07-26T10:00:00Z",
      "in_count": 10,
      "out_count": 8
    },
    {
      "timestamp": "2025-07-26T10:30:00Z",
      "in_count": 15,
      "out_count": 12
    }
  ]
}
```

### Get Sensor Status

Returns real-time sensor health and status information.

```http
GET /api/sensors/status
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | No | Filter by store UUID |
| sensor_id | string | No | Specific sensor ID |

#### Response

```json
{
  "data": [
    {
      "sensor_id": "OML01-PC",
      "name": "Main Entrance",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "store_name": "Downtown Store",
      "is_online": true,
      "health_status": "healthy",
      "last_seen_at": "2025-07-26T10:45:00Z",
      "last_data_timestamp": "2025-07-26T10:30:00Z",
      "battery_level": 85,
      "signal_strength": -45
    }
  ]
}
```

### Get Regional Analytics

Returns zone/region-specific occupancy data.

```http
GET /api/analytics/regions
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | Yes | Store UUID |
| date | string | No | Specific date (default: today) |
| region_id | string | No | Filter by region |

#### Response

```json
{
  "data": [
    {
      "region_id": "entrance",
      "region_name": "Main Entrance",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "date": "2025-07-26",
      "avg_occupancy": 5.2,
      "peak_occupancy": 15,
      "total_visitors": 1250,
      "avg_dwell_time_seconds": 45
    }
  ]
}
```

## Data Sources

### Raw Data Tables
- **people_counting_raw**: Real-time sensor readings
- **regional_counting_raw**: Zone occupancy data

### Aggregated Tables
- **hourly_analytics**: Pre-computed hourly metrics
- **daily_analytics**: Daily summaries with YoY comparisons
- **latest_sensor_data**: Materialized view for sensor status

### Collection Schedule
- Raw data: Every 30 minutes via GitHub Actions
- Hourly aggregation: Every hour at :05
- Daily aggregation: Every day at 02:00 UTC

## Supported Sensors

### Milesight Sensors
- WS301, WS302 series
- VS series with people counting
- API integration via Python bridge

### Omnia Sensors
- OML01-PC through OML04-PC
- Direct HTTP API integration
- 4 regions per sensor support

### Manual Entry
- Support for locations without sensors
- Mobile app integration (future)

## Rate Limiting

- **Default**: 100 requests/minute/IP
- **Authenticated**: 1000 requests/minute/user
- **Bulk operations**: 10 requests/minute

Headers:
- `X-RateLimit-Limit`: Total allowed
- `X-RateLimit-Remaining`: Requests left
- `X-RateLimit-Reset`: Unix timestamp

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid token |
| `FORBIDDEN` | Insufficient permissions |
| `STORE_NOT_FOUND` | Invalid store UUID |
| `SENSOR_NOT_FOUND` | Unknown sensor ID |
| `INVALID_TIMESTAMP` | Timestamp format error |
| `RATE_LIMITED` | Too many requests |
| `SENSOR_OFFLINE` | Sensor not responding |

## Examples

### cURL

```bash
# Get today's hourly data
curl -X GET "https://retail-platform.vercel.app/api/analytics?type=hourly&store_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit sensor data
curl -X POST "https://retail-platform.vercel.app/api/sensors/data" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": "OML01-PC",
    "timestamp": "2025-07-26T10:30:00Z",
    "in_count": 15,
    "out_count": 12
  }'

# Check sensor status
curl -X GET "https://retail-platform.vercel.app/api/sensors/status?sensor_id=OML01-PC" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/TypeScript

```typescript
// Using Supabase client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get hourly analytics
const { data, error } = await supabase
  .from('hourly_analytics')
  .select('*')
  .eq('store_id', '123e4567-e89b-12d3-a456-426614174000')
  .gte('start_time', '2025-07-26T00:00:00Z')
  .order('start_time', { ascending: false });

// Using fetch API
const response = await fetch('/api/analytics?type=daily', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const analytics = await response.json();
```

### Python

```python
import requests
from datetime import datetime, timezone

# Configuration
BASE_URL = 'https://retail-platform.vercel.app/api'
headers = {
    'Authorization': f'Bearer {YOUR_TOKEN}',
    'Content-Type': 'application/json'
}

# Get analytics
response = requests.get(
    f'{BASE_URL}/analytics',
    params={
        'type': 'hourly',
        'store_id': '123e4567-e89b-12d3-a456-426614174000',
        'start_date': '2025-07-26'
    },
    headers=headers
)
analytics = response.json()

# Submit sensor data
sensor_data = {
    'sensor_id': 'OML01-PC',
    'timestamp': datetime.now(timezone.utc).isoformat(),
    'in_count': 25,
    'out_count': 20
}

response = requests.post(
    f'{BASE_URL}/sensors/data',
    json=sensor_data,
    headers=headers
)
```

## Best Practices

1. **Timestamp Format**: Always use ISO 8601 with timezone
2. **Batch Operations**: Use bulk endpoints for multiple readings
3. **Error Handling**: Implement exponential backoff on rate limits
4. **Data Validation**: Ensure counts are non-negative integers
5. **Timezone Awareness**: Submit data in UTC, display in local time

## Future Enhancements

- WebSocket support for real-time updates
- GraphQL endpoint for flexible queries
- Predictive analytics API
- Computer vision integration
- Mobile SDK support