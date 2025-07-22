# Quick Cloud Setup for Sensor Data Collection

This guide helps you set up cloud-based sensor data collection without needing Supabase CLI access.

## Step 1: Deploy Edge Function via Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com/project/amqxsmdcvhyaudzbmhaf

2. Navigate to **Edge Functions** in the sidebar

3. Click **Create New Function**

4. Name it: `collect-sensor-data`

5. Copy the entire content of `/supabase/functions/collect-sensor-data/index.ts` into the editor

6. Click **Deploy**

## Step 2: Test the Function

Test directly in your browser or terminal:

```bash
curl -X POST https://amqxsmdcvhyaudzbmhaf.supabase.co/functions/v1/collect-sensor-data \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Step 3: Set Up Automatic Collection (Choose One)

### Option A: Cron-job.org (Recommended - 100% Free)

1. Go to https://cron-job.org and create a free account

2. Click **"Cronjobs"** → **"Create cronjob"**

3. Configure:
   - **Title**: Retail Platform Sensor Collection
   - **URL**: `https://amqxsmdcvhyaudzbmhaf.supabase.co/functions/v1/collect-sensor-data`
   - **Schedule**: 
     - Execution schedule: Every 30 minutes
     - Or use custom: `*/30 * * * *`
   - **Request method**: POST
   - **Request headers**: Add these two headers:
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU
     Content-Type: application/json
     ```
   - **Request body**: `{}`

4. Save and enable the job

5. Click **"Execute now"** to test

### Option B: GitHub Actions (Free with GitHub account)

1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**

2. Add these repository secrets:
   - `SUPABASE_URL`: `https://amqxsmdcvhyaudzbmhaf.supabase.co`
   - `SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU`

3. The workflow file is already created at `.github/workflows/collect-sensor-data.yml`

4. Push to GitHub:
   ```bash
   git add .github/workflows/collect-sensor-data.yml
   git commit -m "Add sensor data collection workflow"
   git push origin main
   ```

5. The workflow will run automatically every 30 minutes

6. To test manually:
   - Go to **Actions** tab in GitHub
   - Select **"Collect Sensor Data"**
   - Click **"Run workflow"**

### Option C: EasyCron (Free tier available)

1. Go to https://www.easycron.com and create account

2. Add new cron job:
   - **URL**: `https://amqxsmdcvhyaudzbmhaf.supabase.co/functions/v1/collect-sensor-data`
   - **Cron Expression**: `*/30 * * * *`
   - **HTTP Method**: POST
   - **HTTP Headers**:
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU
     Content-Type: application/json
     ```
   - **HTTP Body**: `{}`

## Step 4: Monitor Data Collection

1. **Check Edge Function Logs**:
   - Go to Supabase Dashboard → Edge Functions
   - Click on `collect-sensor-data`
   - View logs to see execution history

2. **Check Database**:
   - Go to Table Editor in Supabase
   - Look at `people_counting_raw` table
   - You should see new records every 30 minutes

3. **Set Up Alerts** (Optional):
   - Most cron services offer email alerts on failure
   - Enable notifications in your chosen service

## Troubleshooting

### No data appearing?
1. Check Edge Function logs for errors
2. Verify sensors are accessible from internet
3. Check sensor credentials in `sensor_metadata` table

### Function timing out?
- The function has a 60-second timeout
- If you have many sensors, consider processing them in batches

### Authentication errors?
- Ensure the Authorization header is exactly as shown
- The anon key should work for invoking functions

## Current Sensor IPs

The system is configured to collect from these sensors:

1. **J&J Arrábida**: 176.79.62.167:2102
2. **Omnia Guimarães**: 93.108.96.96:21001
3. **Omnia Almada**: 188.37.175.41:2201
4. **Omnia NorteShopping**: 188.37.124.33:21002

All sensors use credentials: `admin` / `grnl.2024`

## Success!

Once configured, your sensor data will be collected automatically every 30 minutes without any local infrastructure. The data flows directly from sensors → Supabase Edge Function → Database.

You can monitor the collection in real-time through:
- Your cron service dashboard
- Supabase Edge Function logs
- The `people_counting_raw` table