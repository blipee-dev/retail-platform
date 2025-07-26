# blipee OS Retail Intelligence - Analytics API

The Analytics API provides access to aggregated foot traffic data, performance metrics, and insights for retail locations.

## Base URL

```
https://retail-platform.vercel.app/api/analytics
```

## Endpoints

### Get Hourly Analytics

Retrieve pre-aggregated hourly foot traffic metrics.

```http
GET /api/analytics?type=hourly
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| type | string | Yes | Must be "hourly" |
| store_id | string | No | Filter by store UUID |
| sensor_id | string | No | Filter by specific sensor |
| start_date | string | No | Start date (ISO 8601) |
| end_date | string | No | End date (ISO 8601) |
| page | number | No | Page number (default: 1) |
| per_page | number | No | Results per page (default: 50, max: 100) |

#### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "store_name": "Downtown Store",
      "sensor_id": "OML01-PC",
      "start_time": "2025-07-26T10:00:00Z",
      "end_time": "2025-07-26T11:00:00Z",
      "total_in": 145,
      "total_out": 142,
      "net_occupancy": 3,
      "peak_occupancy": 25,
      "avg_occupancy": 18,
      "conversion_rate": 12.5,
      "transactions": 18,
      "avg_transaction_value": 45.50,
      "mall_traffic": 850,
      "capture_rate": 17.1,
      "weather": {
        "temperature": 72,
        "condition": "sunny"
      }
    }
  ],
  "meta": {
    "total": 168,
    "page": 1,
    "per_page": 50,
    "pages": 4
  },
  "summary": {
    "total_footfall": 3456,
    "avg_hourly_footfall": 144,
    "peak_hour": 14,
    "peak_footfall": 287
  }
}
```

### Get Daily Analytics

Retrieve daily aggregated metrics with comparisons.

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
| include_comparisons | boolean | No | Include YoY/MoM comparisons (default: true) |

#### Response

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "store_name": "Downtown Store",
      "date": "2025-07-26",
      "total_footfall": 2450,
      "unique_visitors": 1890,
      "returning_visitors": 560,
      "peak_hour": 14,
      "peak_hour_footfall": 287,
      "avg_dwell_time": 720,
      "bounce_rate": 15.2,
      "conversion_rate": 14.8,
      "avg_basket_size": 3.2,
      "total_revenue": 15680.50,
      "total_transactions": 363,
      "avg_transaction_value": 43.20,
      "comparisons": {
        "vs_yesterday": {
          "footfall_change": 125,
          "footfall_percent": 5.4,
          "revenue_change": 850.00,
          "revenue_percent": 5.7
        },
        "vs_last_week": {
          "footfall_change": -85,
          "footfall_percent": -3.4,
          "revenue_change": -620.00,
          "revenue_percent": -3.8
        },
        "vs_last_month": {
          "footfall_change": 320,
          "footfall_percent": 15.0,
          "revenue_change": 2150.00,
          "revenue_percent": 15.9
        },
        "vs_last_year": {
          "footfall_change": 450,
          "footfall_percent": 22.5,
          "revenue_change": 3200.00,
          "revenue_percent": 25.6
        }
      },
      "weather": {
        "avg_temperature": 75,
        "condition": "partly_cloudy",
        "precipitation": 0
      }
    }
  ],
  "meta": {
    "total": 30,
    "date_range": {
      "start": "2025-06-27",
      "end": "2025-07-26"
    }
  }
}
```

### Get Store Comparison

Compare metrics across multiple stores.

```http
GET /api/analytics/comparison
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_ids | string | Yes | Comma-separated store UUIDs |
| metric | string | Yes | Metric to compare (footfall, revenue, conversion) |
| period | string | Yes | Time period (today, week, month, year) |
| group_by | string | No | Grouping (hour, day, week) |

#### Response

```json
{
  "data": {
    "metric": "footfall",
    "period": "week",
    "stores": [
      {
        "store_id": "123e4567-e89b-12d3-a456-426614174000",
        "store_name": "Downtown Store",
        "total": 17150,
        "average": 2450,
        "trend": "increasing",
        "rank": 1
      },
      {
        "store_id": "234e5678-e89b-12d3-a456-426614174000",
        "store_name": "Mall Store",
        "total": 21340,
        "average": 3048,
        "trend": "stable",
        "rank": 2
      }
    ],
    "timeline": [
      {
        "date": "2025-07-20",
        "values": {
          "123e4567-e89b-12d3-a456-426614174000": 2380,
          "234e5678-e89b-12d3-a456-426614174000": 3120
        }
      }
    ]
  }
}
```

### Get Capture Rate Analytics

Analyze store capture rate (entries vs mall traffic).

```http
GET /api/analytics/capture-rate
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | Yes | Store UUID |
| period | string | No | Time period (today, week, month) |
| group_by | string | No | Grouping (hour, day) |

#### Response

```json
{
  "data": {
    "store_id": "123e4567-e89b-12d3-a456-426614174000",
    "period": "today",
    "capture_rate": {
      "current": 15.8,
      "average": 14.2,
      "peak": 22.5,
      "trend": "improving"
    },
    "breakdown": [
      {
        "hour": 9,
        "mall_traffic": 450,
        "store_entries": 58,
        "capture_rate": 12.9
      },
      {
        "hour": 10,
        "mall_traffic": 680,
        "store_entries": 95,
        "capture_rate": 14.0
      }
    ],
    "insights": [
      {
        "type": "peak_performance",
        "message": "Capture rate peaks at 2 PM with 22.5%"
      },
      {
        "type": "opportunity",
        "message": "Morning capture rate 20% below average"
      }
    ]
  }
}
```

### Get Regional Analytics

Analyze zone/region-specific metrics within stores.

```http
GET /api/analytics/regions
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | Yes | Store UUID |
| date | string | No | Specific date (default: today) |
| region_id | string | No | Filter by specific region |
| metric | string | No | Specific metric (occupancy, dwell_time) |

#### Response

```json
{
  "data": [
    {
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "date": "2025-07-26",
      "regions": [
        {
          "region_id": "entrance",
          "region_name": "Main Entrance",
          "metrics": {
            "total_visitors": 2450,
            "avg_occupancy": 8.5,
            "peak_occupancy": 25,
            "avg_dwell_time_seconds": 45,
            "bounce_rate": 65.2
          },
          "heatmap_data": {
            "resolution": "1m",
            "data": [[10, 20, 5], [11, 19, 8], ...]
          }
        },
        {
          "region_id": "checkout",
          "region_name": "Checkout Area",
          "metrics": {
            "total_visitors": 1850,
            "avg_occupancy": 12.3,
            "peak_occupancy": 35,
            "avg_dwell_time_seconds": 180,
            "queue_time_seconds": 120
          }
        }
      ]
    }
  ]
}
```

### Get Performance Metrics

Retrieve KPI performance against targets.

```http
GET /api/analytics/performance
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | No | Store UUID |
| kpi | string | No | Specific KPI (footfall, conversion, revenue) |
| period | string | Yes | Time period (day, week, month, quarter) |

#### Response

```json
{
  "data": {
    "period": "month",
    "kpis": [
      {
        "name": "footfall",
        "target": 75000,
        "actual": 72450,
        "achievement": 96.6,
        "trend": "increasing",
        "projection": 74500,
        "status": "on_track"
      },
      {
        "name": "conversion_rate",
        "target": 15.0,
        "actual": 14.2,
        "achievement": 94.7,
        "trend": "stable",
        "projection": 14.5,
        "status": "at_risk"
      },
      {
        "name": "revenue",
        "target": 500000,
        "actual": 485000,
        "achievement": 97.0,
        "trend": "increasing",
        "projection": 510000,
        "status": "on_track"
      }
    ],
    "insights": [
      {
        "type": "recommendation",
        "kpi": "conversion_rate",
        "message": "Conversion rate 0.8% below target. Consider staff training on upselling."
      }
    ]
  }
}
```

### Export Analytics Data

Export analytics data in various formats.

```http
POST /api/analytics/export
```

#### Request Body

```json
{
  "type": "daily",
  "store_ids": ["123e4567-e89b-12d3-a456-426614174000"],
  "start_date": "2025-07-01",
  "end_date": "2025-07-26",
  "format": "csv",
  "metrics": ["footfall", "conversion_rate", "revenue"],
  "email": "user@example.com"
}
```

#### Response

```json
{
  "message": "Export queued successfully",
  "job_id": "export_123456",
  "estimated_time": 30,
  "delivery_method": "email"
}
```

## Metrics Definitions

| Metric | Description | Calculation |
|--------|-------------|-------------|
| `total_in` | People entering | Sum of in counts |
| `total_out` | People exiting | Sum of out counts |
| `net_occupancy` | Current occupancy | total_in - total_out |
| `conversion_rate` | Sales conversion | (transactions / footfall) × 100 |
| `capture_rate` | Mall capture rate | (store_entries / mall_traffic) × 100 |
| `avg_dwell_time` | Average time in store | Total dwell / unique visitors |
| `bounce_rate` | Quick exits | (exits < 2 min / entries) × 100 |

## Time Periods

| Period | Description | Format |
|--------|-------------|--------|
| `today` | Current day | Starting 00:00 local time |
| `yesterday` | Previous day | Full 24 hours |
| `week` | Last 7 days | Including today |
| `month` | Last 30 days | Including today |
| `quarter` | Last 90 days | Including today |
| `year` | Last 365 days | Including today |
| `custom` | Date range | Use start_date and end_date |

## Examples

### cURL

```bash
# Get hourly analytics for today
curl -X GET "https://retail-platform.vercel.app/api/analytics?type=hourly&store_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get daily analytics with comparisons
curl -X GET "https://retail-platform.vercel.app/api/analytics?type=daily&date=2025-07-26" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export monthly data
curl -X POST "https://retail-platform.vercel.app/api/analytics/export" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "daily",
    "start_date": "2025-07-01",
    "end_date": "2025-07-31",
    "format": "csv"
  }'
```

### JavaScript/TypeScript

```typescript
// Get hourly analytics
const hourlyData = await fetch('/api/analytics?type=hourly', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json());

// Compare stores
const comparison = await fetch('/api/analytics/comparison?' + new URLSearchParams({
  store_ids: 'store1,store2',
  metric: 'footfall',
  period: 'week'
}), {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(res => res.json());
```

## Rate Limits

- Standard: 100 requests per minute
- Export operations: 10 requests per hour
- Comparison queries: 50 requests per hour

## Best Practices

1. **Query Optimization**
   - Use date ranges to limit data
   - Request only needed metrics
   - Use pagination for large datasets

2. **Caching**
   - Hourly data: Cache for 5 minutes
   - Daily data: Cache for 1 hour
   - Comparisons: Cache for 15 minutes

3. **Performance**
   - Avoid queries spanning > 90 days
   - Use pre-aggregated data when possible
   - Schedule exports during off-peak hours