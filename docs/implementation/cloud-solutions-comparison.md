# Cloud Solutions Comparison for Sensor Data Collection

## Overview

We need a cloud-based solution to collect data from Milesight sensors every 30 minutes without depending on local machines. Here's a comparison of available options:

## Solution 1: Supabase Edge Functions + pg_cron (Recommended)

### How it works
1. Supabase Edge Function fetches data from sensors
2. pg_cron schedules the function to run every 30 minutes
3. Data is stored directly in Supabase database

### Pros
- ✅ Fully integrated with existing Supabase infrastructure
- ✅ No additional services needed
- ✅ Direct database access (fast writes)
- ✅ Built-in monitoring and logs
- ✅ Free tier covers our needs

### Cons
- ❌ Requires Supabase Pro plan for pg_cron ($25/month)
- ❌ Limited to Supabase's network capabilities

### Implementation
```sql
-- Enable pg_cron and schedule function
SELECT cron.schedule(
  'collect-sensors',
  '*/30 * * * *',
  $$SELECT net.http_post(
    url := 'https://project.supabase.co/functions/v1/collect-sensor-data',
    headers := jsonb_build_object('Authorization', 'Bearer KEY'),
    body := '{}'::jsonb
  )$$
);
```

## Solution 2: Vercel Cron Jobs

### How it works
1. Vercel cron job triggers Next.js API route
2. API route fetches from sensors
3. Data sent to Supabase via API

### Pros
- ✅ Integrated with existing Next.js app
- ✅ Easy deployment with git push
- ✅ Good for Next.js developers
- ✅ Included in Vercel Pro plan

### Cons
- ❌ Network issues reaching sensors from Vercel
- ❌ Requires Vercel Pro plan ($20/month)
- ❌ Additional hop (Vercel → Supabase)

## Solution 3: External Cron Service + Supabase Edge Function

### How it works
1. External service (cron-job.org, EasyCron) triggers webhook
2. Webhook calls Supabase Edge Function
3. Function collects and stores data

### Pros
- ✅ Works with Supabase free tier
- ✅ Many free cron services available
- ✅ Simple to set up
- ✅ Reliable external triggers

### Cons
- ❌ Depends on third-party service
- ❌ May have reliability issues with free tiers
- ❌ Additional service to monitor

### Free Services
- **cron-job.org**: 100% free, unlimited jobs
- **EasyCron**: Free tier with 20 jobs
- **Cronitor**: Free tier with 5 monitors

## Solution 4: Database Webhooks + Triggers

### How it works
1. pg_cron inserts trigger record every 30 minutes
2. Database webhook detects insert
3. Webhook calls Edge Function

### Pros
- ✅ Creative use of existing features
- ✅ All within Supabase ecosystem
- ✅ Good audit trail

### Cons
- ❌ Still requires pg_cron (Pro plan)
- ❌ More complex setup
- ❌ Additional database records

## Solution 5: GitHub Actions

### How it works
1. GitHub Action runs on schedule
2. Action calls Supabase Edge Function
3. Free 2000 minutes/month

### Pros
- ✅ Completely free
- ✅ Version controlled
- ✅ Good logging
- ✅ Can add notifications

### Cons
- ❌ Requires GitHub repository
- ❌ May have occasional delays
- ❌ Separate from main infrastructure

### Implementation
```yaml
name: Collect Sensor Data
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Edge Function
        run: |
          curl -X POST ${{ secrets.SUPABASE_FUNCTION_URL }} \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -d '{}'
```

## Recommendation

### For Production (Budget Available)
**Supabase Edge Functions + pg_cron**
- Most reliable and integrated
- Worth the $25/month for production
- Best monitoring and debugging

### For Development/Testing (Free)
**External Cron Service + Edge Function**
- Use cron-job.org (completely free)
- Easy to set up and test
- Good enough for development

### For Long-term Free Solution
**GitHub Actions + Edge Function**
- Completely free forever
- Version controlled
- Professional solution

## Quick Setup Guide

### Option A: External Cron (Fastest Setup)

1. Deploy Edge Function:
   ```bash
   supabase functions deploy collect-sensor-data
   ```

2. Go to [cron-job.org](https://cron-job.org)

3. Create job:
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/collect-sensor-data`
   - Schedule: Every 30 minutes
   - Method: POST
   - Headers: `Authorization: Bearer YOUR_ANON_KEY`

4. Test and activate

### Option B: GitHub Actions (Most Reliable Free)

1. Create `.github/workflows/collect-sensors.yml`

2. Add secrets to GitHub:
   - `SUPABASE_FUNCTION_URL`
   - `SUPABASE_ANON_KEY`

3. Push to repository

4. Monitor in Actions tab

## Cost Summary

| Solution | Monthly Cost | Reliability | Setup Complexity |
|----------|-------------|-------------|------------------|
| Supabase pg_cron | $25 | ⭐⭐⭐⭐⭐ | Medium |
| Vercel Cron | $20 | ⭐⭐⭐ | Easy |
| External Cron | $0 | ⭐⭐⭐⭐ | Easy |
| GitHub Actions | $0 | ⭐⭐⭐⭐ | Medium |

## Network Considerations

All solutions require sensors to be accessible from the internet. If sensors are behind firewall:

1. **Port Forwarding**: Current setup (works)
2. **VPN Gateway**: More secure but complex
3. **Cloudflare Tunnel**: Best balance of security and simplicity

The current port forwarding setup (176.79.62.167:2102, etc.) should work with all these solutions.