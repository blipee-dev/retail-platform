# blipee OS Retail Intelligence - Sensors API

The Sensors API provides endpoints for managing people counting sensors, retrieving sensor status, and configuring sensor settings.

## Base URL

```
https://retail-platform.vercel.app/api/sensors
```

## Endpoints

### List Sensors

Get all sensors for the authenticated user's organization.

```http
GET /api/sensors
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | No | Filter by store UUID |
| is_online | boolean | No | Filter by online status |
| sensor_type | string | No | Filter by type (milesight, omnia) |

#### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "sensor_id": "OML01-PC",
      "name": "Main Entrance",
      "sensor_type": "omnia",
      "store_id": "123e4567-e89b-12d3-a456-426614174000",
      "store_name": "Downtown Store",
      "location": {
        "floor": 1,
        "zone": "entrance",
        "coordinates": {"x": 10, "y": 20}
      },
      "configuration": {
        "ip_address": "192.168.1.100",
        "port": 80,
        "polling_interval": 300
      },
      "timezone_offset": -18000,
      "is_online": true,
      "health_status": "healthy",
      "last_seen_at": "2025-07-26T10:45:00Z",
      "created_at": "2025-01-15T08:00:00Z",
      "metrics": {
        "uptime_percentage": 99.8,
        "data_points_today": 48,
        "last_error": null
      }
    }
  ],
  "meta": {
    "total": 4,
    "online": 4,
    "offline": 0
  }
}
```

### Get Sensor Details

Retrieve detailed information about a specific sensor.

```http
GET /api/sensors/{sensor_id}
```

#### Path Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| sensor_id | string | Yes | The sensor identifier |

#### Response

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "sensor_id": "OML01-PC",
    "name": "Main Entrance",
    "sensor_type": "omnia",
    "store": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Downtown Store",
      "timezone": "America/New_York",
      "address": "123 Main St, New York, NY 10001"
    },
    "location": {
      "floor": 1,
      "zone": "entrance",
      "description": "Main customer entrance",
      "coordinates": {"x": 10, "y": 20}
    },
    "configuration": {
      "ip_address": "192.168.1.100",
      "port": 80,
      "username": "admin",
      "polling_interval": 300,
      "retry_attempts": 3,
      "timeout": 30
    },
    "regions": [
      {
        "region_id": "entrance_in",
        "name": "Entrance In",
        "type": "entry",
        "polygon": [[0,0], [10,0], [10,10], [0,10]]
      },
      {
        "region_id": "entrance_out",
        "name": "Entrance Out",
        "type": "exit",
        "polygon": [[10,0], [20,0], [20,10], [10,10]]
      }
    ],
    "status": {
      "is_online": true,
      "health_status": "healthy",
      "last_seen_at": "2025-07-26T10:45:00Z",
      "battery_level": 85,
      "signal_strength": -45,
      "firmware_version": "2.1.0",
      "uptime_seconds": 864000
    },
    "statistics": {
      "total_in_today": 1245,
      "total_out_today": 1198,
      "avg_daily_traffic": 2500,
      "peak_hour_today": 14,
      "data_quality_score": 98.5
    }
  }
}
```

### Create Sensor

Register a new sensor in the system.

```http
POST /api/sensors
```

#### Request Body

```json
{
  "sensor_id": "OML04-PC",
  "name": "Back Entrance",
  "sensor_type": "omnia",
  "store_id": "123e4567-e89b-12d3-a456-426614174000",
  "location": {
    "floor": 1,
    "zone": "back_entrance",
    "description": "Employee and delivery entrance"
  },
  "configuration": {
    "ip_address": "192.168.1.104",
    "port": 80,
    "username": "admin",
    "password": "encrypted_password",
    "polling_interval": 300
  }
}
```

#### Response

```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "sensor_id": "OML04-PC",
    "name": "Back Entrance",
    "message": "Sensor created successfully"
  }
}
```

### Update Sensor

Update sensor configuration or metadata.

```http
PATCH /api/sensors/{sensor_id}
```

#### Request Body

```json
{
  "name": "Back Entrance - Updated",
  "configuration": {
    "polling_interval": 600
  },
  "location": {
    "description": "Employee entrance only"
  }
}
```

#### Response

```json
{
  "data": {
    "sensor_id": "OML04-PC",
    "name": "Back Entrance - Updated",
    "updated_fields": ["name", "configuration.polling_interval", "location.description"],
    "message": "Sensor updated successfully"
  }
}
```

### Delete Sensor

Remove a sensor from the system (soft delete).

```http
DELETE /api/sensors/{sensor_id}
```

#### Response

```json
{
  "message": "Sensor deleted successfully",
  "data": {
    "sensor_id": "OML04-PC",
    "deleted_at": "2025-07-26T11:00:00Z"
  }
}
```

### Get Sensor Status

Get real-time status for all sensors.

```http
GET /api/sensors/status
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| store_id | string | No | Filter by store UUID |
| health_status | string | No | Filter by status (healthy, warning, critical) |

#### Response

```json
{
  "data": [
    {
      "sensor_id": "OML01-PC",
      "name": "Main Entrance",
      "store_name": "Downtown Store",
      "is_online": true,
      "health_status": "healthy",
      "last_seen_at": "2025-07-26T10:45:00Z",
      "last_data_timestamp": "2025-07-26T10:30:00Z",
      "metrics": {
        "response_time_ms": 125,
        "error_rate": 0.0,
        "data_lag_minutes": 15
      },
      "alerts": []
    },
    {
      "sensor_id": "OML02-PC",
      "name": "Side Entrance",
      "store_name": "Downtown Store",
      "is_online": true,
      "health_status": "warning",
      "last_seen_at": "2025-07-26T10:30:00Z",
      "last_data_timestamp": "2025-07-26T10:00:00Z",
      "metrics": {
        "response_time_ms": 450,
        "error_rate": 0.05,
        "data_lag_minutes": 45
      },
      "alerts": [
        {
          "type": "DATA_DELAY",
          "message": "No data received for 45 minutes",
          "severity": "warning"
        }
      ]
    }
  ],
  "summary": {
    "total": 4,
    "online": 4,
    "offline": 0,
    "healthy": 3,
    "warning": 1,
    "critical": 0
  }
}
```

### Test Sensor Connection

Test connectivity to a sensor.

```http
POST /api/sensors/{sensor_id}/test
```

#### Response

```json
{
  "success": true,
  "data": {
    "sensor_id": "OML01-PC",
    "response_time_ms": 145,
    "firmware_version": "2.1.0",
    "current_data": {
      "timestamp": "2025-07-26T10:50:00Z",
      "in_count": 5,
      "out_count": 3,
      "occupancy": 47
    }
  }
}
```

### Configure Regions

Set up counting regions for a sensor.

```http
POST /api/sensors/{sensor_id}/regions
```

#### Request Body

```json
{
  "regions": [
    {
      "region_id": "zone_1",
      "name": "Entry Zone",
      "type": "entry",
      "polygon": [[0,0], [100,0], [100,50], [0,50]]
    },
    {
      "region_id": "zone_2",
      "name": "Exit Zone",
      "type": "exit",
      "polygon": [[0,50], [100,50], [100,100], [0,100]]
    }
  ]
}
```

#### Response

```json
{
  "message": "Regions configured successfully",
  "data": {
    "sensor_id": "OML01-PC",
    "regions_count": 2
  }
}
```

### Get Sensor History

Retrieve sensor health and status history.

```http
GET /api/sensors/{sensor_id}/history
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| start_date | string | No | Start date (ISO 8601) |
| end_date | string | No | End date (ISO 8601) |
| event_type | string | No | Filter by event (online, offline, error) |

#### Response

```json
{
  "data": [
    {
      "timestamp": "2025-07-26T09:00:00Z",
      "event_type": "status_change",
      "old_status": "offline",
      "new_status": "online",
      "details": "Sensor came online after maintenance"
    },
    {
      "timestamp": "2025-07-25T14:30:00Z",
      "event_type": "error",
      "error_code": "TIMEOUT",
      "details": "Connection timeout after 30 seconds"
    }
  ]
}
```

## Sensor Types

### Milesight Sensors
- **Models**: WS301, WS302, VS series
- **Protocol**: HTTP API
- **Features**: Battery powered, LoRaWAN support

### Omnia Sensors
- **Models**: OML01-PC through OML04-PC
- **Protocol**: HTTP REST API
- **Features**: 4 configurable regions, real-time counting

## Health Status Definitions

| Status | Description | Criteria |
|--------|-------------|----------|
| `healthy` | Operating normally | Online, data flowing, no errors |
| `warning` | Minor issues | High latency, occasional errors, data delays |
| `critical` | Major issues | Offline, consistent errors, no data |

## Error Codes

| Code | Description |
|------|-------------|
| `SENSOR_NOT_FOUND` | Sensor ID does not exist |
| `SENSOR_OFFLINE` | Sensor is not responding |
| `CONNECTION_TIMEOUT` | Sensor connection timed out |
| `INVALID_CONFIGURATION` | Invalid sensor settings |
| `DUPLICATE_SENSOR` | Sensor ID already exists |
| `INSUFFICIENT_PERMISSIONS` | User cannot manage sensors |

## Best Practices

1. **Polling Intervals**
   - Minimum: 300 seconds (5 minutes)
   - Recommended: 1800 seconds (30 minutes)
   - Maximum: 3600 seconds (1 hour)

2. **Network Configuration**
   - Ensure sensors have static IP addresses
   - Configure firewall rules for API access
   - Use VPN for remote sensor access

3. **Monitoring**
   - Set up alerts for offline sensors
   - Monitor data quality scores
   - Review error logs regularly

## Examples

### cURL

```bash
# List all sensors
curl -X GET https://retail-platform.vercel.app/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get sensor status
curl -X GET https://retail-platform.vercel.app/api/sensors/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test sensor connection
curl -X POST https://retail-platform.vercel.app/api/sensors/OML01-PC/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/TypeScript

```typescript
// Get all sensors
const response = await fetch('/api/sensors', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const sensors = await response.json();

// Update sensor configuration
const updateResponse = await fetch('/api/sensors/OML01-PC', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    configuration: {
      polling_interval: 1800
    }
  })
});
```