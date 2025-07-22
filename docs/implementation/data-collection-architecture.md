# Data Collection Architecture

## The Challenge

Milesight sensors use private IP addresses (e.g., 176.79.62.167) that are only accessible from within your local network. Cloud services like Vercel and Supabase Edge Functions cannot reach these IPs directly.

## Solution Architecture

We use a **hybrid approach** that combines local data collection with cloud monitoring:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Milesight       │────▶│ Local Bridge     │────▶│ Supabase DB     │
│ Sensors         │     │ (Python/Node)    │     │                 │
│ (Private IPs)   │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                              ┌────────────────────────────┼────────┐
                              │                            │        │
                        ┌─────▼──────┐            ┌────────▼────────▼─┐
                        │ Monitoring │            │ Analytics        │
                        │ Functions  │            │ Dashboard        │
                        │ (Supabase) │            │ (Vercel)         │
                        └────────────┘            └──────────────────┘
```

## Implementation Components

### 1. Local Data Bridge (Required)
The Python script `sensor_data_bridge_v2.py` runs on a machine within your network that can access the sensors.

**Key Features:**
- Collects data every 30 minutes
- Filters out future/duplicate data
- Stores directly in Supabase
- Handles authentication and retries

### 2. Supabase Database
Stores all sensor data with proper schema:
- `sensor_metadata` - Sensor configurations
- `people_counting_raw` - Hourly data
- `sensor_alerts` - Monitoring alerts
- `v_sensor_status` - Real-time status view

### 3. Monitoring System (Supabase Edge Functions)
Cloud-based monitoring that runs every hour to:
- Check data freshness
- Generate alerts for stale data
- Track collection statistics
- Provide health dashboard

### 4. Analytics Dashboard (Vercel)
User-facing application for:
- Viewing real-time analytics
- Historical reports
- Alert management
- Sensor configuration

## Deployment Options

### Option 1: Dedicated Server (Recommended)
Run the bridge on a dedicated server or VM that's always on.

**Setup:**
```bash
# 1. Clone the repository
git clone https://github.com/your-repo/retail-platform.git
cd retail-platform

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
export API_BASE_URL=https://your-supabase-project.supabase.co
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-key

# 4. Run the bridge
python scripts/sensor_data_bridge_v2.py
```

### Option 2: Docker Container
Containerize the bridge for easier deployment:

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY scripts/ scripts/
COPY src/ src/
CMD ["python", "scripts/sensor_data_bridge_v2.py"]
```

### Option 3: Kubernetes CronJob
For cloud-native deployments:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: sensor-data-collector
spec:
  schedule: "0,30 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: collector
            image: your-registry/sensor-collector:latest
            env:
            - name: SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: supabase-config
                  key: url
```

## Monitoring Setup

### 1. Deploy Supabase Edge Function
```bash
# Deploy the monitoring function
supabase functions deploy monitor-sensor-data

# Set up cron schedule (in Supabase dashboard)
# Schedule: 0 * * * * (every hour)
```

### 2. Configure Alerts
Set up alerts in the monitoring function for:
- No data received for > 1 hour
- Connection failures
- Abnormal traffic patterns

### 3. Dashboard Integration
The Vercel dashboard automatically shows:
- Sensor status from `v_sensor_status` view
- Recent alerts
- Collection statistics

## Troubleshooting

### No Data Being Collected
1. **Check Network Access**: Ensure the bridge machine can ping sensor IPs
2. **Verify Credentials**: Test sensor authentication manually
3. **Check Logs**: Review bridge logs for errors
4. **Test Manually**: Run `test_sensor_params.py` to debug

### Data Gaps
1. **Check Bridge Uptime**: Ensure the bridge didn't crash
2. **Review Sensor Logs**: Sensors might have been offline
3. **Check Timestamps**: Verify system time is correct

### High Latency
1. **Optimize Queries**: Add database indexes if needed
2. **Adjust Frequency**: Collect less frequently if network is slow
3. **Batch Inserts**: Modify bridge to batch multiple records

## Security Best Practices

1. **Use Service Role Key**: Never expose this key in client code
2. **Network Isolation**: Keep sensors on separate VLAN
3. **API Rate Limiting**: Implement rate limits on data ingestion
4. **Audit Logging**: Log all data collection activities
5. **Encrypted Storage**: Ensure database encryption is enabled

## Scaling Considerations

As you add more sensors:

1. **Parallel Collection**: Bridge already collects from sensors in parallel
2. **Multiple Bridges**: Deploy regional bridges for different locations
3. **Queue System**: Consider adding Redis/RabbitMQ for large deployments
4. **Data Archival**: Move old data to cold storage

## Cost Optimization

1. **Supabase**: 
   - Free tier: 500MB database, 2GB bandwidth
   - Pro tier: $25/month for 8GB database
   
2. **Monitoring Frequency**:
   - Hourly checks are usually sufficient
   - Reduce frequency during off-hours

3. **Data Retention**:
   - Keep detailed data for 30 days
   - Aggregate older data to hourly/daily summaries