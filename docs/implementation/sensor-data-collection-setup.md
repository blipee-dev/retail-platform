# Sensor Data Collection Setup

## Overview

Since Milesight sensors use private IP addresses that aren't accessible from Vercel's cloud infrastructure, we need a hybrid approach for reliable data collection.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Milesight       │────▶│ Local Bridge     │────▶│ Vercel API      │
│ Sensors         │     │ (Python Script)  │     │ (Next.js)       │
│ (Private IPs)   │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                           │
                                └──────────────────────────▶│
                                                           │
                                                    ┌──────▼──────┐
                                                    │  Supabase   │
                                                    │  Database   │
                                                    └─────────────┘
```

## Implementation Options

### Option 1: Local Bridge Server (Recommended)
Run the Python data collection bridge on a local server that can reach the sensors.

**Pros:**
- Can access private sensor IPs
- Reliable and proven to work
- Easy to monitor and debug

**Cons:**
- Requires a always-on local machine
- Need to ensure it restarts on failure

**Setup:**
```bash
# 1. Install as a system service (Linux/Mac)
sudo cp scripts/sensor-bridge.service /etc/systemd/system/
sudo systemctl enable sensor-bridge
sudo systemctl start sensor-bridge

# 2. Or use a process manager
pip install supervisor
supervisord -c sensor-bridge.conf
```

### Option 2: VPN Bridge
Set up a VPN connection between Vercel and your local network.

**Pros:**
- Allows Vercel to access sensors directly
- Fully cloud-based solution

**Cons:**
- Complex setup
- Additional infrastructure cost
- Security considerations

### Option 3: Edge Device
Deploy a Raspberry Pi or similar device on your network.

**Pros:**
- Dedicated hardware for data collection
- Low power consumption
- Can run 24/7 reliably

**Cons:**
- Additional hardware cost
- Initial setup required

## Recommended Setup: Local Bridge with Monitoring

### 1. Create System Service

Create `/etc/systemd/system/sensor-bridge.service`:
```ini
[Unit]
Description=Retail Platform Sensor Data Bridge
After=network.target

[Service]
Type=simple
User=retail
WorkingDirectory=/home/retail/retail-platform
Environment="API_BASE_URL=https://your-app.vercel.app"
Environment="PYTHONUNBUFFERED=1"
ExecStart=/usr/bin/python3 /home/retail/retail-platform/scripts/sensor_data_bridge_v2.py
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

### 2. Set Up Monitoring

Create a health check endpoint:
```python
# In sensor_data_bridge_v2.py, add:
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'uptime': time.time() - start_time,
        'last_collection': last_collection_time
    })
```

### 3. Configure Alerts

Use a monitoring service to check the health endpoint:
- UptimeRobot (free tier available)
- Pingdom
- Custom Telegram alerts

### 4. Backup Collection

The Vercel cron job can still be used as a fallback to:
- Monitor sensor availability
- Send alerts if data is stale
- Provide a management interface

## Production Deployment Checklist

- [ ] Set up dedicated machine for bridge (VM, Raspberry Pi, etc.)
- [ ] Install Python dependencies
- [ ] Configure environment variables
- [ ] Set up system service for auto-start
- [ ] Configure monitoring and alerts
- [ ] Test failover scenarios
- [ ] Document recovery procedures
- [ ] Set up log rotation
- [ ] Configure firewall rules

## Alternative: Sensor Gateway

If you have multiple locations, consider using a gateway approach:

1. Deploy a small gateway device at each location
2. Gateways collect data locally and buffer it
3. Gateways push data to Vercel API when internet is available
4. Provides resilience against network outages

## Security Considerations

1. **API Authentication**: Use strong API keys for bridge-to-Vercel communication
2. **Network Isolation**: Keep sensors on isolated VLAN
3. **Data Encryption**: Use HTTPS for all API calls
4. **Access Control**: Limit sensor access to bridge only
5. **Audit Logging**: Log all data collection activities

## Maintenance

### Daily Tasks
- Check monitoring dashboard
- Verify data freshness

### Weekly Tasks
- Review error logs
- Check disk space
- Verify all sensors reporting

### Monthly Tasks
- Update bridge software
- Review and optimize queries
- Clean old log files
- Test disaster recovery

## Troubleshooting

### Bridge Not Collecting Data
1. Check network connectivity to sensors
2. Verify sensor credentials
3. Check API endpoint availability
4. Review error logs

### Data Gaps
1. Check bridge uptime
2. Verify sensor availability during gap
3. Check for network issues
4. Review Supabase connection

### Performance Issues
1. Check CPU/memory usage
2. Optimize collection frequency
3. Review database indexes
4. Consider adding more workers