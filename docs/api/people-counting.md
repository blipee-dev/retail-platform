# People Counting API

The People Counting API provides access to foot traffic data from sensors installed at retail locations.

## Endpoints

### Get Current Occupancy

Returns the current occupancy for a specific site.

```http
GET /sites/{siteId}/occupancy/current
```

#### Parameters

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| siteId | string | path | Yes | The site identifier |

#### Response

```json
{
  "data": {
    "siteId": "site_123",
    "occupancy": 145,
    "capacity": 500,
    "percentage": 29,
    "lastUpdated": "2025-07-16T10:30:00Z",
    "trend": "increasing",
    "zones": [
      {
        "id": "entrance",
        "occupancy": 23
      },
      {
        "id": "main_floor",
        "occupancy": 98
      }
    ]
  }
}
```

### Get Historical Foot Traffic

Retrieves historical foot traffic data for a specified period.

```http
GET /sites/{siteId}/footfall
```

#### Parameters

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| siteId | string | path | Yes | The site identifier |
| start_date | string | query | Yes | Start date (ISO 8601) |
| end_date | string | query | Yes | End date (ISO 8601) |
| granularity | string | query | No | Data granularity: `hour`, `day`, `week`, `month` (default: `hour`) |
| include_predictions | boolean | query | No | Include AI predictions (default: `false`) |

#### Response

```json
{
  "data": {
    "siteId": "site_123",
    "period": {
      "start": "2025-07-01T00:00:00Z",
      "end": "2025-07-07T23:59:59Z"
    },
    "summary": {
      "totalFootfall": 15420,
      "avgDaily": 2203,
      "peakHour": "2025-07-05T14:00:00Z",
      "peakCount": 487
    },
    "data": [
      {
        "timestamp": "2025-07-01T00:00:00Z",
        "entries": 45,
        "exits": 42,
        "passersby": 230,
        "occupancy": 3
      }
    ],
    "predictions": {
      "nextHour": 156,
      "confidence": 0.92
    }
  },
  "pagination": {
    "page": 1,
    "per_page": 168,
    "total": 168
  }
}
```

### Get Capture Rate

Calculates the capture rate (store entries vs. mall traffic).

```http
GET /sites/{siteId}/capture-rate
```

#### Parameters

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| siteId | string | path | Yes | The site identifier |
| date | string | query | No | Specific date (default: today) |
| compare_to | string | query | No | Comparison period: `yesterday`, `last_week`, `last_month` |

#### Response

```json
{
  "data": {
    "siteId": "site_123",
    "date": "2025-07-16",
    "captureRate": {
      "value": 12.5,
      "storeEntries": 1250,
      "mallTraffic": 10000
    },
    "comparison": {
      "period": "yesterday",
      "value": 11.8,
      "change": 0.7,
      "changePercent": 5.9
    },
    "hourlyBreakdown": [
      {
        "hour": 10,
        "rate": 8.5,
        "entries": 85,
        "traffic": 1000
      }
    ]
  }
}
```

### Create Manual Count

Allows manual entry of people counting data (for locations without sensors).

```http
POST /sites/{siteId}/footfall/manual
```

#### Request Body

```json
{
  "timestamp": "2025-07-16T10:00:00Z",
  "period": "hour",
  "counts": {
    "entries": 150,
    "exits": 145,
    "passersby": 500
  },
  "notes": "Holiday sale event"
}
```

#### Response

```json
{
  "data": {
    "id": "count_789",
    "siteId": "site_123",
    "timestamp": "2025-07-16T10:00:00Z",
    "source": "manual",
    "counts": {
      "entries": 150,
      "exits": 145,
      "passersby": 500
    },
    "createdBy": "user_456",
    "createdAt": "2025-07-16T10:05:00Z"
  }
}
```

### Get Dwell Time Analysis

Analyzes how long people stay in different zones.

```http
GET /sites/{siteId}/dwell-time
```

#### Parameters

| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| siteId | string | path | Yes | The site identifier |
| date | string | query | No | Analysis date (default: today) |
| zones | string | query | No | Comma-separated zone IDs |

#### Response

```json
{
  "data": {
    "siteId": "site_123",
    "date": "2025-07-16",
    "avgDwellTime": {
      "minutes": 12.5,
      "seconds": 750
    },
    "zones": [
      {
        "id": "entrance",
        "name": "Entrance",
        "avgDwellMinutes": 2.3,
        "distribution": {
          "0-5min": 75,
          "5-10min": 18,
          "10-20min": 5,
          "20min+": 2
        }
      }
    ],
    "insights": [
      {
        "type": "high_dwell",
        "zone": "promotions",
        "message": "Promotion area shows 45% higher dwell time than average"
      }
    ]
  }
}
```

## WebSocket Events

Subscribe to real-time people counting updates:

```javascript
// Subscribe to occupancy updates
{
  "action": "subscribe",
  "channel": "occupancy:site:123"
}

// Receive updates
{
  "event": "occupancy.updated",
  "data": {
    "siteId": "site_123",
    "occupancy": 156,
    "change": 3,
    "timestamp": "2025-07-16T10:35:00Z"
  }
}
```

## Rate Limits

- **Standard**: 100 requests per minute
- **Real-time**: 1000 WebSocket messages per minute

## Error Codes

| Code | Description |
|------|-------------|
| `SITE_NOT_FOUND` | The specified site does not exist |
| `NO_SENSOR_DATA` | No sensor configured for this site |
| `INVALID_DATE_RANGE` | Date range exceeds maximum allowed (90 days) |
| `INSUFFICIENT_PERMISSIONS` | User lacks permission to view this data |

## Examples

### cURL

```bash
# Get current occupancy
curl -X GET https://api.retailintelligence.io/v1/sites/site_123/occupancy/current \
  -H "Authorization: Bearer YOUR_API_TOKEN"

# Get weekly foot traffic
curl -X GET "https://api.retailintelligence.io/v1/sites/site_123/footfall?start_date=2025-07-01&end_date=2025-07-07&granularity=day" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### JavaScript SDK

```javascript
import { RetailIntelligence } from '@retail-intelligence/sdk';

const client = new RetailIntelligence('YOUR_API_TOKEN');

// Get current occupancy
const occupancy = await client.sites.getOccupancy('site_123');

// Get historical data
const footfall = await client.sites.getFootfall('site_123', {
  startDate: '2025-07-01',
  endDate: '2025-07-07',
  granularity: 'day'
});

// Subscribe to real-time updates
client.realtime.subscribe('occupancy:site:123', (event) => {
  console.log('Occupancy updated:', event.data.occupancy);
});
```

### Python SDK

```python
from retail_intelligence import Client

client = Client('YOUR_API_TOKEN')

# Get current occupancy
occupancy = client.sites.get_occupancy('site_123')

# Get historical data
footfall = client.sites.get_footfall(
    'site_123',
    start_date='2025-07-01',
    end_date='2025-07-07',
    granularity='day'
)

# Subscribe to real-time updates
def on_occupancy_update(event):
    print(f"Occupancy updated: {event['data']['occupancy']}")

client.realtime.subscribe('occupancy:site:123', on_occupancy_update)
```