# blipee OS Retail Intelligence - Sensor Integration Guide

This guide covers how to integrate people counting sensors with blipee OS Retail Intelligence.

## Supported Sensors

### Milesight Sensors
- **Models**: WS301, WS302, VS series
- **Protocol**: HTTP REST API
- **Connection**: WiFi/Ethernet
- **Power**: Battery or PoE

### Omnia Sensors
- **Models**: OML01-PC through OML04-PC
- **Protocol**: HTTP REST API
- **Connection**: Ethernet
- **Features**: 4 configurable counting regions

## Prerequisites

- Admin access to blipee OS Retail Intelligence
- Network access to sensors
- Sensor IP addresses and credentials
- Store configuration completed in the platform

## Step 1: Network Configuration

### Firewall Rules

Ensure the following ports are open:

| Direction | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| Outbound | 80 | HTTP | Sensor API access |
| Outbound | 443 | HTTPS | Platform API |
| Inbound | 3000 | HTTP | Local development |

### Static IP Assignment

Assign static IP addresses to all sensors:

```bash
# Example DHCP reservation
# Router configuration varies
MAC: AA:BB:CC:DD:EE:FF → 192.168.1.100
```

## Step 2: Sensor Configuration

### Milesight Sensors

1. **Access sensor web interface**:
   ```
   http://[sensor-ip-address]
   ```

2. **Configure API settings**:
   - Enable HTTP API
   - Set authentication credentials
   - Configure counting zones

3. **Set reporting interval**:
   - Recommended: 30 minutes
   - Minimum: 5 minutes

### Omnia Sensors

1. **Access sensor API**:
   ```bash
   curl -X GET http://192.168.1.100/api/status \
     -u admin:password
   ```

2. **Configure regions** (4 zones per sensor):
   - Entry zones
   - Exit zones
   - Dwell zones
   - Queue zones

## Step 3: Platform Configuration

### Add Sensor via UI

1. **Navigate to Dashboard** → Settings → Sensors
2. **Click "Add Sensor"**
3. **Fill in details**:
   - Sensor ID: `OML01-PC`
   - Name: `Main Entrance`
   - Type: `omnia` or `milesight`
   - Store: Select from dropdown
   - IP Address: `192.168.1.100`
   - Username: `admin`
   - Password: `[encrypted]`

### Add Sensor via API

```bash
curl -X POST https://retail-platform.vercel.app/api/sensors \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": "OML01-PC",
    "name": "Main Entrance",
    "sensor_type": "omnia",
    "store_id": "123e4567-e89b-12d3-a456-426614174000",
    "configuration": {
      "ip_address": "192.168.1.100",
      "port": 80,
      "username": "admin",
      "password": "encrypted_password"
    }
  }'
```

## Step 4: Configure Data Collection

### GitHub Actions Setup

1. **Fork the repository** if using custom deployment

2. **Set GitHub Secrets**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-key
   ```

3. **Enable workflows**:
   - Go to Actions tab
   - Enable workflows if disabled

### Manual Collection Test

Test sensor connectivity:

```bash
# Clone the repository
git clone https://github.com/blipee/retail-intelligence.git
cd retail-intelligence

# Install dependencies
npm install

# Test sensor connection
node scripts/test-sensor-connection.js OML01-PC
```

Expected output:
```
Testing sensor: OML01-PC
Connection successful!
Response time: 145ms
Current data: { in: 5, out: 3, timestamp: "2025-07-26T10:00:00Z" }
```

## Step 5: Configure Regions

### Define Counting Zones

For Omnia sensors with 4 regions:

```javascript
// Example region configuration
const regions = [
  {
    region_id: "entrance_in",
    name: "Entrance In",
    type: "entry",
    polygon: [[0,0], [50,0], [50,100], [0,100]]
  },
  {
    region_id: "entrance_out", 
    name: "Entrance Out",
    type: "exit",
    polygon: [[50,0], [100,0], [100,100], [50,100]]
  },
  {
    region_id: "display_area",
    name: "Display Area",
    type: "dwell",
    polygon: [[100,0], [200,0], [200,100], [100,100]]
  },
  {
    region_id: "checkout_queue",
    name: "Checkout Queue",
    type: "queue",
    polygon: [[200,0], [300,0], [300,100], [200,100]]
  }
];
```

### Apply Configuration

```bash
curl -X POST https://retail-platform.vercel.app/api/sensors/OML01-PC/regions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "regions": [...]
  }'
```

## Step 6: Verify Data Collection

### Check Sensor Status

1. **Via Dashboard**:
   - Navigate to Sensors → Status
   - Check green indicators

2. **Via API**:
   ```bash
   curl -X GET https://retail-platform.vercel.app/api/sensors/status \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Monitor Data Flow

Check recent data:

```sql
-- In Supabase SQL editor
SELECT 
    sensor_id,
    COUNT(*) as data_points,
    MAX(timestamp) as last_data,
    SUM(in_count) as total_in,
    SUM(out_count) as total_out
FROM people_counting_raw
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY sensor_id;
```

## Step 7: Troubleshooting

### Common Issues

#### Sensor Offline

1. **Check network connectivity**:
   ```bash
   ping 192.168.1.100
   ```

2. **Verify credentials**:
   ```bash
   curl -X GET http://192.168.1.100/api/status \
     -u admin:password
   ```

3. **Check firewall rules**

#### No Data Collection

1. **Check GitHub Actions**:
   - Go to Actions tab
   - Look for failed workflows
   - Check logs for errors

2. **Verify sensor configuration**:
   ```bash
   node scripts/debug/test-sensor-api.js OML01-PC
   ```

3. **Check timezone settings**:
   - Ensure sensor timezone is correctly configured
   - Data collection runs based on sensor local time

#### Data Quality Issues

1. **Calibrate sensors**:
   - Adjust detection sensitivity
   - Update counting line positions
   - Test with known traffic patterns

2. **Monitor accuracy**:
   ```sql
   -- Check for anomalies
   SELECT 
       DATE(timestamp) as date,
       HOUR(timestamp) as hour,
       SUM(in_count) as ins,
       SUM(out_count) as outs,
       ABS(SUM(in_count) - SUM(out_count)) as diff
   FROM people_counting_raw
   WHERE sensor_id = 'OML01-PC'
   GROUP BY DATE(timestamp), HOUR(timestamp)
   HAVING ABS(SUM(in_count) - SUM(out_count)) > 100;
   ```

## Step 8: Best Practices

### Sensor Placement

1. **Height**: 2.5-3.5 meters
2. **Angle**: Perpendicular to traffic flow
3. **Coverage**: Entire entrance width
4. **Lighting**: Avoid direct sunlight
5. **Obstructions**: Clear field of view

### Maintenance Schedule

| Task | Frequency | Description |
|------|-----------|-------------|
| Clean lens | Monthly | Remove dust/debris |
| Check mounting | Quarterly | Ensure secure installation |
| Verify accuracy | Monthly | Manual count comparison |
| Update firmware | Quarterly | Apply security patches |
| Battery check | Monthly | For battery-powered units |

### Data Validation

Implement validation rules:

```javascript
// Example validation
function validateSensorData(data) {
  // Check reasonable counts
  if (data.in_count > 1000 || data.out_count > 1000) {
    return { valid: false, reason: "Abnormally high count" };
  }
  
  // Check timestamp
  const age = Date.now() - new Date(data.timestamp).getTime();
  if (age > 3600000) { // 1 hour
    return { valid: false, reason: "Stale data" };
  }
  
  return { valid: true };
}
```

## Step 9: Advanced Configuration

### Multi-Store Setup

For regional deployments:

1. **Organize sensors by store**
2. **Configure timezone per store**
3. **Set collection schedules based on store hours**
4. **Implement store-specific validation rules**

### High-Traffic Optimization

For busy locations:

1. **Reduce polling interval** to 5 minutes
2. **Implement queue management**
3. **Add redundant sensors**
4. **Enable real-time alerts**

### Integration with POS

Future capability:

```javascript
// Example POS integration
async function correlateWithSales(footfallData, salesData) {
  const conversionRate = (salesData.transactions / footfallData.visitors) * 100;
  return {
    visitors: footfallData.visitors,
    transactions: salesData.transactions,
    conversionRate: conversionRate.toFixed(2)
  };
}
```

## Step 10: Monitoring & Alerts

### Set Up Alerts

1. **Sensor offline** > 30 minutes
2. **No data received** > 1 hour
3. **Abnormal traffic patterns**
4. **Low battery** (if applicable)

### Create Alert Rules

```bash
curl -X POST https://retail-platform.vercel.app/api/alerts/rules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sensor Offline Alert",
    "condition": "sensor.offline",
    "threshold": 30,
    "severity": "warning",
    "notifications": ["email", "dashboard"]
  }'
```

## Appendix: Sensor APIs

### Milesight API Reference

```bash
# Get current count
GET /api/counting/current
Authorization: Basic base64(username:password)

# Response
{
  "in": 145,
  "out": 132,
  "timestamp": "2025-07-26T10:00:00Z"
}
```

### Omnia API Reference

```bash
# Get regional data
GET /api/regions/data
Authorization: Basic base64(username:password)

# Response
{
  "regions": [
    {
      "id": "entrance_in",
      "count": 45,
      "occupancy": 3
    }
  ],
  "timestamp": "2025-07-26T10:00:00Z"
}
```

## Support

- **Documentation**: [API Documentation](../api/sensors.md)
- **Community**: Discord channel #sensor-integration
- **Email**: sensors@blipee.com
- **Emergency**: For critical sensor issues, use priority support

---

**Last Updated**: 2025-07-26  
**Version**: 1.0  
**Maintained By**: blipee Engineering Team