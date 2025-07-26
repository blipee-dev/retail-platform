# blipee OS Retail Intelligence - API Documentation

## Overview

The blipee OS Retail Intelligence API provides programmatic access to all platform features through a RESTful interface with plans for GraphQL and WebSocket support in future releases.

## Base URLs

- **Production**: `https://retail-platform.vercel.app/api`
- **Staging**: `https://retail-platform-git-staging.vercel.app/api`
- **Development**: `https://retail-platform-git-develop.vercel.app/api`
- **Local**: `http://localhost:3000/api`

## Authentication

All API requests require authentication using Bearer tokens:

```bash
Authorization: Bearer <your-api-token>
```

### Obtaining API Tokens

1. **Dashboard**: Navigate to Settings → API Keys
2. **Programmatically**: Use the `/auth/token` endpoint

## API Standards

### Request Format

- **Content-Type**: `application/json`
- **Accept**: `application/json`
- **X-API-Version**: `1.0` (optional, for version override)

### Response Format

```json
{
  "data": {},
  "meta": {
    "timestamp": "2025-07-16T10:00:00Z",
    "request_id": "req_abc123",
    "version": "1.0"
  },
  "pagination": {
    "page": 1,
    "per_page": 50,
    "total": 150,
    "pages": 3
  }
}
```

### Error Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "start_date",
        "message": "Must be in ISO 8601 format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-07-16T10:00:00Z",
    "request_id": "req_abc123"
  }
}
```

## Rate Limiting

- **Default**: 1000 requests per hour
- **Enterprise**: 10000 requests per hour
- **Headers**:
  - `X-RateLimit-Limit`: Total allowed requests
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp for reset

## API Sections

### Core APIs

- [Authentication](./authentication.md) - User auth, tokens, sessions
- [Authentication](./authentication.md) - User auth and session management
- [Stores](./stores.md) - Store and location management
- [Users](./users.md) - User profiles and permissions

### Analytics APIs

- [Sensors](./sensors.md) - Sensor configuration and status
- [People Counting](./people-counting.md) - Foot traffic data
- [Analytics](./analytics.md) - Aggregated metrics and insights
- [Reports](./reports.md) - Daily email reports (implemented)

### Management APIs

- [Alerts](./alerts.md) - System alerts and notifications
- [Regions](./regions.md) - Zone configuration within stores
- [Health](./health.md) - System health monitoring

### Integration APIs

- [Bulk Operations](./bulk-operations.md) - Batch data processing
- [Export](./export.md) - Data export capabilities
- Future: Webhooks, Power BI, POS integrations

### AI APIs

- Future: AI predictions, insights, and recommendations

## Current API Endpoints

### Authentication
```
POST   /api/auth/signin
POST   /api/auth/signup
POST   /api/auth/signout
GET    /api/auth/profile
```

### Sensors
```
GET    /api/sensors
POST   /api/sensors/data
GET    /api/sensors/status
```

### Analytics
```
GET    /api/analytics?type=hourly
GET    /api/analytics?type=daily
```

### Setup (Admin)
```
POST   /api/setup/tenants
POST   /api/setup/sensors
POST   /api/setup/bypass-rls
```

## Authentication

### Bearer Token
All API requests require authentication using Supabase auth tokens:

```bash
Authorization: Bearer <your-supabase-token>
```

### Session Management
Sessions are managed by Supabase Auth with automatic refresh handling.

## Request Examples

### cURL
```bash
# Get sensor status
curl -X GET https://retail-platform.vercel.app/api/sensors/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Ingest sensor data
curl -X POST https://retail-platform.vercel.app/api/sensors/data \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sensor_id": "OML01-PC", "in_count": 10, "out_count": 8}'
```

### JavaScript/TypeScript
```typescript
// Using fetch
const response = await fetch('/api/analytics?type=hourly', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
```

## Data Models

### Sensor Data
```typescript
interface SensorData {
  sensor_id: string;
  timestamp: string;
  in_count: number;
  out_count: number;
  metadata?: Record<string, any>;
}
```

### Analytics Response
```typescript
interface AnalyticsResponse {
  store_id: string;
  sensor_id: string;
  start_time: string;
  end_time: string;
  total_in: number;
  total_out: number;
  conversion_rate?: number;
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid sensor_id format",
    "details": {
      "field": "sensor_id",
      "value": "invalid-id"
    }
  }
}
```

### Common Error Codes
| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid request parameters |
| `RATE_LIMITED` | Too many requests |

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Support

- **Documentation**: This guide and endpoint-specific docs
- **GitHub Issues**: [Report issues](https://github.com/blipee/retail-intelligence/issues)
- **Email**: support@blipee.com