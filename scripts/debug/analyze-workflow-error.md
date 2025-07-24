# Workflow Error Analysis

## Current Status

The sensor data collection workflow is failing with HTTP 502: Bad Gateway errors when trying to reach sensors. Based on our testing:

### Issues Found:

1. **Invalid URL Error** - Fixed: Was using wrong environment variable names
2. **Missing Service Role Key** - In production env files (expected for security)
3. **HTTP 502 Errors** - Sensors not accessible from GitHub Actions cloud runners

### Root Cause: Network Accessibility

The sensors (IP addresses like 10.0.30.240, 10.0.50.51) are on private networks that are NOT accessible from GitHub Actions cloud runners. This is why you're seeing 502 errors in the workflow logs.

## Solutions

### Option 1: Self-Hosted Runner (Recommended)
Set up a GitHub Actions self-hosted runner on a machine within your network that can access the sensors.

```bash
# On a machine with sensor network access:
# 1. Download runner from GitHub repo settings
# 2. Configure and run:
./config.sh --url https://github.com/YOUR_REPO --token YOUR_TOKEN
./run.sh
```

Then update workflow to use self-hosted runner:
```yaml
runs-on: self-hosted  # Instead of ubuntu-latest
```

### Option 2: VPN/Tunnel Solution
Use a service like Tailscale, WireGuard, or ngrok to create secure tunnel from GitHub Actions to your sensor network.

### Option 3: Local Collection with Push
Run collection script locally and push data to Supabase:

```bash
# Create local .env file with all secrets
cat > .env << EOF
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
SENSOR_AUTH_MILESIGHT=your_auth
SENSOR_AUTH_OMNIA=your_auth
EOF

# Run collection manually or via cron
node scripts/workflows/collect-sensor-data.js
```

### Option 4: API Gateway/Proxy
Set up a public API gateway that proxies requests to internal sensors with proper authentication.

## Next Steps

1. **Immediate**: Run collection script locally to verify it works with proper network access
2. **Short-term**: Set up self-hosted runner for automated collection
3. **Long-term**: Consider API gateway for better security and scalability

## Testing Locally

To test if the script works from a machine with sensor access:

```bash
# Clone repo on machine with sensor network access
git clone https://github.com/your-repo.git
cd retail-platform

# Install dependencies
npm install

# Create .env with production values
# Add SUPABASE_SERVICE_ROLE_KEY from GitHub secrets

# Test collection
node scripts/debug/test-sensor-collection.js
```

If this works, it confirms the issue is network accessibility, not the code.