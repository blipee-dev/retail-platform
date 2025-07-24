# Workflow Setup Verification

## Current Status

✅ **Sensors are accessible** - We can reach the sensors from this network
✅ **Correct endpoints** - Using `/dataloader.cgi` for Omnia sensors  
❌ **Authentication required** - Getting 401 Unauthorized (need proper credentials)

## GitHub Actions Secrets Required

Based on the workflow configuration, you need these secrets in your GitHub repository:

1. **SUPABASE_URL** - Your Supabase project URL
2. **SUPABASE_SERVICE_ROLE_KEY** - Service role key for Supabase
3. **SENSOR_AUTH_MILESIGHT** - Basic auth for Milesight sensors
4. **SENSOR_AUTH_OMNIA** - Basic auth for Omnia sensors

## Verify Secrets are Set

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Ensure all 4 secrets above are configured

## Test the Workflow

Once secrets are confirmed:

```bash
# Trigger the workflow manually
gh workflow run main-pipeline.yml

# Watch the logs
gh run watch
```

## Local Testing (if you have the auth credentials)

Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=https://amqxsmdcvhyaudzbmhaf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SENSOR_AUTH_MILESIGHT=<your-milesight-auth>
SENSOR_AUTH_OMNIA=<your-omnia-auth>
```

Then run:
```bash
# Load local env
require('dotenv').config({ path: '.env.local' });

# Set for workflow scripts
process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

# Run collection
node scripts/workflows/collect-sensor-data.js
```

## The Real Issue

The 502 errors in your GitHub Actions logs suggest that GitHub's cloud runners might be blocked by your sensor network's firewall. Even though we can access the sensors from this Codespace, GitHub Actions runs from different IP ranges.

### Solutions:

1. **Whitelist GitHub Actions IPs** - Not recommended as they change
2. **Use self-hosted runner** - Run on your infrastructure
3. **VPN/Tunnel solution** - Connect GitHub to your network
4. **API Gateway** - Public endpoint that proxies to sensors

Would you like me to help implement one of these solutions?