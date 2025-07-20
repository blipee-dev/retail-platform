# Getting Started Guide

Welcome to blipee OS Retail Intelligence! This guide will help you get up and running quickly with our cloud-first platform.

## Prerequisites

**No local installation required!** You only need:
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A GitHub account
- A Supabase account (free tier available)
- A Vercel account (free tier available)

## Quick Start (3 minutes) ⚡

### 1. Open in GitHub Codespaces

```
1. Go to https://github.com/blipee/os-retail-intelligence
2. Click "Code" → "Codespaces" → "Create codespace"
3. Wait 2-3 minutes for automatic setup
4. Development environment ready in your browser!
```

### 2. No Installation Needed!

Everything is automatically configured:
- ✅ Node.js 20 pre-installed
- ✅ Dependencies auto-installed
- ✅ VS Code running in browser
- ✅ Development server ready

### 3. Configure Your Credentials

In your Codespace terminal:
```bash
# Environment file already copied automatically
# Edit .env.local with your Supabase credentials
code .env.local
```

**Required (from https://app.supabase.com):**
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

**Optional (for full features):**
```env
OPENAI_API_KEY=your-openai-key
RESEND_API_KEY=your-resend-key
```

### 4. Start the Platform

```bash
# Start development server
npm run dev
```

**🎉 Your platform is now running!**
- Click the forwarded port link in Codespaces
- Or visit the URL shown in terminal
- No local setup required!

## First Steps

### 1. Create Your Organization

After starting the application:
1. Click "Sign Up" to create an account
2. Verify your email address
3. Create your first organization
4. Configure your organization settings

### 2. Add Your First Site

1. Navigate to Sites → Add Site
2. Enter site details:
   - Name: Your store name
   - Type: Store/Kiosk/Warehouse
   - Address: Physical location
   - Timezone: Local timezone

### 3. Configure Data Sources

#### People Counting Sensors
1. Go to Sites → [Your Site] → Sensors
2. Click "Add Sensor"
3. Enter sensor details:
   - Type: VS133/Axis/Generic
   - IP Address: Sensor IP
   - Credentials: Access credentials

#### POS Integration
1. Go to Settings → Integrations
2. Select your POS system:
   - Shopify
   - Square
   - Custom API
3. Follow the connection wizard

### 4. View Your Dashboard

Once data starts flowing:
1. Navigate to Dashboard
2. Select your site
3. View real-time metrics:
   - Current occupancy
   - Today's footfall
   - Sales performance
   - Conversion rates

## Understanding the Platform

### Core Concepts

#### Organizations
- Top-level account container
- Contains multiple sites/stores
- Manages users and permissions

#### Sites
- Individual physical locations
- Has sensors and POS systems
- Generates metrics and reports

#### Metrics
- **Footfall**: People entering/exiting
- **Occupancy**: Current people count
- **Conversion**: Visitors who purchase
- **Capture Rate**: Store entries vs mall traffic

### User Roles

| Role | Capabilities |
|------|-------------|
| **Owner** | Full access, billing, user management |
| **Admin** | Manage sites, users, view all data |
| **Manager** | Manage assigned sites, create reports |
| **Analyst** | View data, create reports |
| **Viewer** | View reports and dashboards |

## Common Workflows

### Daily Operations Check

1. **Morning Review**
   ```
   Dashboard → Select Date → Yesterday
   - Check previous day's performance
   - Review any alerts
   - Compare to targets
   ```

2. **Real-time Monitoring**
   ```
   Dashboard → Live View
   - Monitor current occupancy
   - Track hourly trends
   - Respond to alerts
   ```

3. **End of Day**
   ```
   Reports → Daily Summary
   - Review day's performance
   - Check target achievement
   - Plan for tomorrow
   ```

### Weekly Analysis

1. **Performance Review**
   - Go to Analytics → Weekly Trends
   - Compare week-over-week
   - Identify patterns

2. **Generate Reports**
   - Reports → Create New
   - Select report type
   - Choose date range
   - Export or share

### Setting Up Alerts

1. **Navigate to Alerts**
2. **Create New Alert**
   ```yaml
   Type: Threshold Alert
   Metric: Occupancy
   Condition: Greater than 80%
   Action: Send email + SMS
   ```

3. **Test Alert**
   - Use "Test" button
   - Verify delivery

## Troubleshooting

### No Data Showing

1. **Check Sensor Status**
   - Sites → [Site] → Sensors
   - Look for "Last Seen" timestamp
   - Test connection

2. **Verify API Keys**
   - Settings → API Keys
   - Ensure keys are active

3. **Check Logs**
   - Settings → System Logs
   - Look for errors

### Login Issues

1. **Password Reset**
   - Click "Forgot Password"
   - Check email
   - Follow reset link

2. **MFA Problems**
   - Use backup codes
   - Contact support

### Performance Issues

1. **Clear Browser Cache**
2. **Check Internet Connection**
3. **Try Different Browser**
4. **Contact Support**

## Next Steps

### Explore Advanced Features

1. **AI Insights**
   - Enable in Settings → Features
   - View AI predictions
   - Get recommendations

2. **Smart Targets**
   - Set KPIs for your stores
   - Configure cascading targets
   - Track achievement

3. **Integrations**
   - Connect Power BI
   - Set up webhooks
   - Export to Excel

### Learn More

- [API Documentation](../api/README.md) - Integrate with your systems
- [Architecture Overview](../architecture/overview.md) - Understand the platform
- [Security Guide](../security/README.md) - Best practices

### Get Help

- 📧 Email: support@blipee.com
- 💬 Discord: [Join Community](https://discord.gg/blipee)
- 📖 Docs: [Full Documentation](../README.md)
- 🎥 Videos: [YouTube Tutorials](https://youtube.com/blipee)

## Frequently Asked Questions

### How much historical data can I import?
You can import up to 2 years of historical data using our import tools.

### Can I white-label the platform?
Yes, enterprise plans include white-labeling options.

### What's the data retention policy?
- Free: 30 days
- Pro: 1 year
- Enterprise: Unlimited

### How often is data updated?
- People counting: Every 5 minutes
- Sales data: Real-time or hourly
- Analytics: Calculated hourly

### Can I export my data?
Yes, you can export data via:
- CSV/Excel downloads
- API access
- Automated reports

---

Congratulations! You're now ready to use the Retail Intelligence Platform. For more detailed information, explore our [full documentation](../README.md).