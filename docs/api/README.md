# API Documentation

## Overview

The blipee OS Retail Intelligence API provides programmatic access to all platform features through a RESTful interface, GraphQL endpoint, and real-time WebSocket connections.

## Base URLs

- **Production**: `https://app.blipee.com/api/v1`
- **Staging**: `https://staging.blipee.com/api/v1`
- **Development**: `https://dev.blipee.com/api/v1`
- **Codespaces**: `https://[codespace-url]/api/v1`

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
- [Organizations](./organizations.md) - Tenant management
- [Users](./users.md) - User management and permissions

### Analytics APIs

- [People Counting](./people-counting.md) - Foot traffic data
- [Sales](./sales.md) - Transaction and revenue data
- [Metrics](./metrics.md) - Combined analytics
- [Reports](./reports.md) - Generated reports

### Management APIs

- [Sites](./sites.md) - Store/location management
- [Sensors](./sensors.md) - Device configuration
- [Targets](./targets.md) - KPI management
- [Alerts](./alerts.md) - Notification rules

### Integration APIs

- [Webhooks](./webhooks.md) - Event notifications
- [Power BI](./powerbi.md) - Microsoft Power BI integration
- [Dynamics 365](./dynamics.md) - Microsoft Dynamics integration
- [POS Systems](./pos-systems.md) - Point of Sale integrations

### AI APIs

- [Predictions](./predictions.md) - ML predictions
- [Insights](./insights.md) - AI-generated insights
- [Recommendations](./recommendations.md) - Action suggestions

## GraphQL API

The platform also provides a GraphQL endpoint at `/graphql`:

```graphql
query GetStoreMetrics($storeId: ID!, $date: Date!) {
  store(id: $storeId) {
    name
    metrics(date: $date) {
      footfall
      revenue
      conversionRate
      captureRate
    }
    predictions {
      nextHourFootfall
      endOfDayRevenue
    }
  }
}
```

## WebSocket API

Real-time updates are available via WebSocket:

```javascript
const ws = new WebSocket('wss://api.retailintelligence.io/v1/ws');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  // Handle real-time updates
});

// Subscribe to events
ws.send(JSON.stringify({
  action: 'subscribe',
  channels: ['metrics:store:123', 'alerts:org:456']
}));
```

## SDKs

Official SDKs are available for:

- [JavaScript/TypeScript](https://github.com/blipee/js-sdk)
- [Python](https://github.com/blipee/python-sdk)
- [Go](https://github.com/blipee/go-sdk)
- [Ruby](https://github.com/blipee/ruby-sdk)

## Postman Collection

Download our [Postman Collection](https://www.postman.com/blipee/workspace/blipee-os-retail-intelligence-api) for easy API exploration.

## API Changelog

See [API Changelog](./CHANGELOG.md) for version history and migration guides.

## Support

- **Documentation**: This guide
- **API Status**: [status.blipee.com](https://status.blipee.com)
- **Support**: api-support@blipee.com