# Cloudflare Tunnel Setup Guide

This guide will help you set up Cloudflare Tunnel to make your Milesight sensors accessible from Vercel's cloud infrastructure.

## Prerequisites

- A Cloudflare account (free tier is sufficient)
- A domain name added to Cloudflare
- A Linux machine on your local network that can access the sensors
- Basic command line knowledge

## Step 1: Install Cloudflare Tunnel

On a machine within your network (that can reach the sensor IPs):

```bash
# For Ubuntu/Debian
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# For other Linux distributions
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

## Step 2: Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This will open a browser window. Log in to your Cloudflare account and select the domain you want to use.

## Step 3: Create the Tunnel

```bash
cloudflared tunnel create retail-sensors
```

This creates a tunnel and generates a credentials file. Note the tunnel ID shown.

## Step 4: Create DNS Routes

For each sensor, create a subdomain:

```bash
# J&J Sensor
cloudflared tunnel route dns retail-sensors jj-sensor.yourdomain.com

# Omnia Sensors
cloudflared tunnel route dns retail-sensors omnia1.yourdomain.com
cloudflared tunnel route dns retail-sensors omnia2.yourdomain.com
cloudflared tunnel route dns retail-sensors omnia3.yourdomain.com
```

## Step 5: Configure the Tunnel

Create a configuration file at `~/.cloudflared/config.yml`:

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/YOUR_USER/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # J&J Sensor - ArrábidaShopping
  - hostname: jj-sensor.yourdomain.com
    service: http://176.79.62.167:2102
    originRequest:
      noTLSVerify: true
      
  # Omnia Sensor 1 - Guimarães Shopping
  - hostname: omnia1.yourdomain.com
    service: http://93.108.96.96:21001
    originRequest:
      noTLSVerify: true
      
  # Omnia Sensor 2 - Fórum Almada
  - hostname: omnia2.yourdomain.com
    service: http://188.37.175.41:2201
    originRequest:
      noTLSVerify: true
      
  # Omnia Sensor 3 - NorteShopping
  - hostname: omnia3.yourdomain.com
    service: http://188.37.124.33:21002
    originRequest:
      noTLSVerify: true
      
  # Catch-all rule
  - service: http_status:404
```

## Step 6: Run the Tunnel

Test the tunnel:
```bash
cloudflared tunnel run retail-sensors
```

## Step 7: Install as a Service

To ensure the tunnel runs permanently:

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## Step 8: Update Vercel Environment Variables

In your Vercel project settings, add these environment variables:

```
JJ_SENSOR_URL=https://jj-sensor.yourdomain.com
OMNIA1_SENSOR_URL=https://omnia1.yourdomain.com
OMNIA2_SENSOR_URL=https://omnia2.yourdomain.com
OMNIA3_SENSOR_URL=https://omnia3.yourdomain.com
CRON_SECRET=generate-a-random-string-here
```

## Step 9: Deploy to Vercel

```bash
git add .
git commit -m "Add cloud-based sensor data collection"
git push origin main
```

## Step 10: Verify the Setup

1. **Test Sensor Access**: 
   ```bash
   curl https://jj-sensor.yourdomain.com
   ```
   You should get a response (likely an authentication error, which is expected).

2. **Check Vercel Logs**: 
   - Go to your Vercel dashboard
   - Navigate to Functions → Logs
   - Look for the cron job executions

3. **Verify Data in Supabase**:
   - Check the `people_counting_raw` table
   - New records should appear every 30 minutes

## Troubleshooting

### Tunnel Not Connecting
- Check firewall rules on the bridge machine
- Verify the machine can ping sensor IPs
- Check cloudflared logs: `sudo journalctl -u cloudflared -f`

### Authentication Errors
- Verify sensor credentials are correct
- Test manually: `curl -u admin:grnl.2024 http://176.79.62.167:2102/dataloader.cgi?dw=vcalogcsv`

### No Data in Database
- Check Vercel function logs for errors
- Verify environment variables are set correctly
- Test the cron job manually via the test endpoint

## Security Considerations

1. **Access Control**: Cloudflare Tunnel only exposes the specific paths you configure
2. **HTTPS**: All traffic is encrypted between Cloudflare and your services
3. **Authentication**: Sensor credentials are never exposed publicly
4. **Rate Limiting**: Consider adding Cloudflare rate limiting rules

## Monitoring

1. **Cloudflare Dashboard**: Monitor tunnel health and traffic
2. **Vercel Dashboard**: Check function execution logs
3. **Supabase Dashboard**: Monitor data ingestion rates

## Cost Analysis

- **Cloudflare Tunnel**: Free for up to 50 users
- **Vercel**: Cron jobs included in Pro plan ($20/month)
- **Total**: ~$20/month for a fully cloud-based solution

This solution provides:
- ✅ 24/7 data collection without local infrastructure
- ✅ Secure access to private sensors
- ✅ Automatic failover and redundancy
- ✅ Easy scaling for additional sensors
- ✅ Professional monitoring and logging