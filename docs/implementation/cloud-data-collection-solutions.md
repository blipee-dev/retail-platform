# Cloud-Based Data Collection Solutions

Since Milesight sensors use private IPs that aren't directly accessible from the cloud, here are proven cloud-based solutions:

## Option 1: Cloudflare Tunnel (Recommended)
**Cost: Free for basic use**

Cloudflare Tunnel creates a secure connection between your network and Cloudflare's edge, making your sensors accessible from anywhere.

### Setup Steps:
```bash
# 1. Install cloudflared on a machine in your network
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared

# 2. Login to Cloudflare
./cloudflared tunnel login

# 3. Create a tunnel
./cloudflared tunnel create retail-sensors

# 4. Create config file (~/.cloudflared/config.yml)
tunnel: <TUNNEL_ID>
credentials-file: /home/user/.cloudflared/<TUNNEL_ID>.json

ingress:
  # J&J Sensor
  - hostname: jj-sensor.yourdomain.com
    service: http://176.79.62.167:2102
  # Omnia Sensors  
  - hostname: omnia1.yourdomain.com
    service: http://93.108.96.96:21001
  - hostname: omnia2.yourdomain.com
    service: http://188.37.175.41:2201
  - hostname: omnia3.yourdomain.com
    service: http://188.37.124.33:21002
  - service: http_status:404

# 5. Run the tunnel
./cloudflared tunnel run

# 6. Update your Vercel/Supabase code to use public URLs
# Instead of: http://176.79.62.167:2102
# Use: https://jj-sensor.yourdomain.com
```

## Option 2: Tailscale (Business-Ready)
**Cost: Free for personal use, $6/user/month for business**

Tailscale creates a secure mesh network that makes your sensors accessible from cloud services.

### Setup:
1. Install Tailscale on a bridge machine in your network
2. Install Tailscale on your cloud server (or use Tailscale's Funnel feature)
3. Sensors become accessible via Tailscale IPs (100.x.x.x)

## Option 3: ngrok (Quick Solution)
**Cost: $8/month for basic plan**

ngrok provides instant public URLs for your private services.

```bash
# Install ngrok
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Configure
ngrok config add-authtoken YOUR_AUTH_TOKEN

# Create tunnel configuration (ngrok.yml)
version: "2"
tunnels:
  jj-sensor:
    addr: 176.79.62.167:2102
    proto: http
  omnia-1:
    addr: 93.108.96.96:21001
    proto: http

# Start tunnels
ngrok start --all
```

## Option 4: AWS IoT Greengrass
**Cost: ~$50/month for small deployment**

Deploy AWS IoT Greengrass on a local device to bridge sensors to AWS.

## Recommended Architecture with Cloudflare Tunnel

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Milesight       │────▶│ Cloudflare       │────▶│ Vercel Function │
│ Sensors         │     │ Tunnel           │     │ (Cron Job)      │
│ (Private IPs)   │     │ (Bridge Machine) │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                           │
                                                    ┌──────▼──────┐
                                                    │  Supabase   │
                                                    │  Database   │
                                                    └─────────────┘
```

## Implementation with Cloudflare Tunnel

### 1. Update Sensor Configuration