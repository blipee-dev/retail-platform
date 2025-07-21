# Sensor Integration Guide

This guide explains how to integrate sensor data from Milesight (and other) people counting sensors into the Retail Platform.

## Overview

The sensor integration architecture consists of:

1. **Python Connectors** - Extract data from sensors (Milesight, Omnia, etc.)
2. **API Endpoints** - Next.js API routes for data ingestion
3. **Data Bridge** - Python script that connects sensors to the API
4. **Database** - PostgreSQL tables for storing sensor data
5. **Analytics** - Pre-calculated metrics for dashboard performance

## API Endpoints

### Sensor Management

- `GET /api/sensors` - List all sensors
- `POST /api/sensors` - Register a new sensor
- `PATCH /api/sensors` - Update sensor configuration
- `DELETE /api/sensors` - Remove a sensor

### Data Ingestion

- `POST /api/sensors/data` - Ingest individual data records
- `POST /api/sensors/bulk-ingest` - Bulk ingest from Python connectors
- `GET /api/sensors/data` - Query historical sensor data

### Real-time Status

- `GET /api/sensors/status` - Get real-time sensor health and data

### Analytics

- `GET /api/analytics` - Query pre-calculated analytics
  - `type=hourly` - Hourly traffic and occupancy
  - `type=daily` - Daily summaries and trends
  - `type=comparison` - Multi-store comparisons

## Authentication

All API endpoints require Bearer token authentication:

```bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \
  https://your-domain.com/api/sensors
```

## Setting Up Sensor Integration

### 1. Register Your Sensor

```bash
curl -X POST https://your-domain.com/api/sensors \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_name": "Main Entrance Camera",
    "sensor_ip": "192.168.1.100",
    "sensor_port": 80,
    "sensor_type": "milesight_people_counter",
    "location": "Main Entrance",
    "timezone": "America/New_York",
    "store_id": "YOUR_STORE_ID"
  }'
```

### 2. Configure the Data Bridge

Create a sensor configuration file:

```json
{
  "sensor_id": "milesight_001",
  "sensor_name": "Main Entrance Camera",
  "connection": {
    "host": "192.168.1.100",
    "port": 80,
    "auth": {
      "type": "basic",
      "username": "admin",
      "password": "your_password"
    }
  },
  "data_mapping": {
    "supports_regional_counting": true,
    "supports_real_time_status": true,
    "line_count": 4,
    "region_count": 4
  },
  "location": "Main Entrance",
  "timezone": "America/New_York"
}
```

### 3. Run the Data Bridge

#### One-time collection:
```bash
python scripts/sensor_data_bridge.py \
  --config config/sensors/milesight_main_entrance.json \
  --api-url https://your-domain.com \
  --api-token YOUR_API_TOKEN \
  --store-id YOUR_STORE_ID \
  --once
```

#### Continuous collection:
```bash
python scripts/sensor_data_bridge.py \
  --config config/sensors/milesight_main_entrance.json \
  --api-url https://your-domain.com \
  --api-token YOUR_API_TOKEN \
  --store-id YOUR_STORE_ID \
  --interval 300 \
  --backfill-hours 24
```

### 4. Set Up Systemd Service (Linux)

1. Copy the service file:
```bash
sudo cp scripts/sensor-bridge.service /etc/systemd/system/
```

2. Edit the service file with your configuration:
```bash
sudo nano /etc/systemd/system/sensor-bridge.service
```

3. Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable sensor-bridge.service
sudo systemctl start sensor-bridge.service
```

4. Check status:
```bash
sudo systemctl status sensor-bridge.service
journalctl -u sensor-bridge.service -f
```

## Data Types

### People Counting Data
```json
{
  "sensor_id": "uuid",
  "timestamp": "2024-01-20T10:00:00Z",
  "end_time": "2024-01-20T10:05:00Z",
  "line1_in": 10,
  "line1_out": 8,
  "line2_in": 5,
  "line2_out": 6,
  "line3_in": 0,
  "line3_out": 0,
  "line4_in": 0,
  "line4_out": 0
}
```

### Regional Counting Data
```json
{
  "sensor_id": "uuid",
  "timestamp": "2024-01-20T10:00:00Z",
  "end_time": "2024-01-20T10:05:00Z",
  "region1_count": 15,
  "region2_count": 8,
  "region3_count": 3,
  "region4_count": 0
}
```

### Heatmap Data
```json
{
  "sensor_id": "uuid",
  "timestamp": "2024-01-20T10:00:00Z",
  "heat_value": 0.75
}
```

### VCA Alarm Status
```json
{
  "sensor_id": "uuid",
  "timestamp": "2024-01-20T10:00:00Z",
  "counter_alarm_status": 0,
  "region1_in_alarm": 0,
  "region1_out_alarm": 0,
  "region2_in_alarm": 1,
  "region2_out_alarm": 0
}
```

## Analytics and Dashboards

The system automatically calculates:

- **Hourly Analytics** - Traffic patterns, occupancy, line distribution
- **Daily Summaries** - Total visitors, peak hours, conversion rates
- **Real-time Metrics** - Current occupancy, active alerts, sensor health

Access analytics via:

```bash
# Hourly data for a date range
GET /api/analytics?type=hourly&start_date=2024-01-20&end_date=2024-01-21

# Daily summaries
GET /api/analytics?type=daily&start_date=2024-01-01&end_date=2024-01-31

# Store comparison
GET /api/analytics?type=comparison&stores=store1,store2&start_date=2024-01-01&end_date=2024-01-31
```

## Monitoring and Alerts

The system monitors:

- Sensor connectivity (last_seen_at)
- Data freshness
- Threshold violations
- System health

Configure alerts in the dashboard or via API.

## Troubleshooting

### Sensor Not Connecting
1. Check network connectivity
2. Verify credentials in config file
3. Test with curl: `curl -u admin:password http://SENSOR_IP/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus`

### No Data Appearing
1. Check API token is valid
2. Verify sensor is registered
3. Check systemd service logs: `journalctl -u sensor-bridge.service`
4. Verify time synchronization between sensor and server

### Performance Issues
1. Adjust collection interval (default 5 minutes)
2. Enable database indexes (already created in migrations)
3. Use bulk ingestion for historical data
4. Monitor API response times

## Security Considerations

1. Use HTTPS for API endpoints
2. Keep API tokens secure (use environment variables)
3. Implement IP whitelisting for sensors if possible
4. Regular token rotation
5. Monitor for unusual data patterns

## Next Steps

1. Connect dashboards to live data
2. Implement WebSocket for real-time updates
3. Add more sensor types (Omnia, Axis, etc.)
4. Create mobile app integration
5. Add machine learning for predictive analytics