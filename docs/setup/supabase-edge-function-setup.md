# Supabase Edge Function Setup for Sensor Data Collection

This guide walks you through deploying the sensor data collection system using Supabase Edge Functions.

## Prerequisites

- Supabase CLI installed
- Access to your Supabase project
- Sensor data already configured in your database

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 2: Link Your Project

```bash
cd /workspaces/retail-platform
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 3: Deploy the Edge Function

```bash
# Deploy the collect-sensor-data function
supabase functions deploy collect-sensor-data
```

## Step 4: Set Environment Variables

In your Supabase dashboard:

1. Go to Edge Functions
2. Select `collect-sensor-data`
3. Add these secrets:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Step 5: Schedule the Function

### Option A: Using Supabase Cron (Recommended)

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run this query:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job
SELECT cron.schedule(
  'collect-sensor-data-job',
  '*/30 * * * *',  -- Every 30 minutes
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-sensor-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_ANON_KEY',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

### Option B: External Cron Service

Use a service like [cron-job.org](https://cron-job.org) or [EasyCron](https://www.easycron.com):

1. Create a new cron job
2. Set URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-sensor-data`
3. Set schedule: Every 30 minutes
4. Add header: `Authorization: Bearer YOUR_ANON_KEY`

## Step 6: Test the Function

### Manual Test
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-sensor-data \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Check Logs
```bash
supabase functions logs collect-sensor-data
```

## Step 7: Monitor the Function

1. **Supabase Dashboard**: Check Edge Functions → Logs
2. **Database**: Monitor the `people_counting_raw` table for new records
3. **Alerts**: Set up monitoring using the `sensor_monitoring` table

## Troubleshooting

### Function Times Out
- The function has a 60-second timeout
- If sensors are slow, consider processing them in parallel
- Or split into multiple functions

### Authentication Errors
- Verify sensor credentials in `sensor_metadata` table
- Check that sensor IPs are accessible from Supabase's servers

### No Data Collected
- Check sensor availability
- Verify time ranges in the function
- Look for errors in function logs

## Architecture Benefits

Using Supabase Edge Functions provides:

1. **No Local Infrastructure**: Runs entirely in Supabase's cloud
2. **Automatic Scaling**: Handles load automatically
3. **Built-in Monitoring**: Logs and metrics included
4. **Direct Database Access**: No additional API needed
5. **Cost Effective**: Free tier includes 500K invocations/month

## Cost Analysis

- **Edge Functions**: 500K free invocations/month
- **Cron Jobs**: Runs 48 times/day = ~1,440 times/month
- **Total Cost**: $0 (well within free tier)

## Security Considerations

1. **Network Access**: Sensors must be accessible from Supabase's IP ranges
2. **Credentials**: Stored encrypted in database
3. **RLS Policies**: Ensure proper access control
4. **Function Authentication**: Use service role key for database access

## Next Steps

1. Deploy the function
2. Set up monitoring alerts
3. Configure error notifications
4. Add more sensors as needed