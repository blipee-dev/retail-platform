# Daily Store Reports

Automated daily email reports for retail stores with traffic analytics and insights.

## Features

- 📊 Daily traffic summary with key metrics
- 📈 Month-over-month comparisons
- 🎯 Dynamic insights based on performance
- 🌍 Multi-language support (EN, ES, PT)
- 📧 Automated email delivery
- 🕐 Timezone-aware reporting

## Setup

### 1. Environment Variables

Set up the following secrets in GitHub Actions:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Analytics <analytics@yourcompany.com>

# Optional - Slack notifications
SLACK_WEBHOOK_URL=your-slack-webhook
```

### 2. Email Recipients

Update the email recipients in the workflow or store them in your database:

```javascript
// In send-emails.js
recipients = [`${storeCode}@example.com`, 'analytics@example.com'];
```

### 3. Schedule

The workflow runs daily at 6:00 AM UTC. Adjust in `.github/workflows/daily-store-reports.yml`:

```yaml
schedule:
  - cron: '0 6 * * *'  # 6 AM UTC
```

## Manual Execution

### Run Locally

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Generate report for a specific store
STORE_ID=jj-store-001 npm run generate

# Test mode
npm test
```

### Run via GitHub Actions

1. Go to Actions tab
2. Select "Generate and Send Daily Store Reports"
3. Click "Run workflow"
4. Optional: Enter specific store IDs or enable test mode

## Report Contents

Each report includes:

1. **Yesterday's Performance**
   - Total visitors
   - Capture rate
   - Peak hour traffic

2. **Hourly Distribution**
   - Interactive chart with tooltips
   - Visual peak identification

3. **Key Metrics**
   - Passing traffic
   - Performance vs average

4. **Dynamic Insights**
   - AI-generated based on actual data
   - Actionable recommendations

5. **Monthly Summary**
   - MTD totals
   - Projections
   - Comparisons

## Customization

### Add New Insights

Edit `insight-generator.ts` to add new insight types:

```typescript
private static generateCustomInsights(data: DailyData): Insight[] {
  // Add your custom logic
}
```

### Modify Email Template

Edit `jj-store-daily-report-i18n.html` to change the layout or styling.

### Add Languages

Add translations in the HTML template:

```javascript
const translations = {
  fr: {
    // French translations
  }
};
```

## Monitoring

- Reports are saved as GitHub Actions artifacts for 30 days
- Failed reports trigger Slack notifications (if configured)
- Check Actions tab for execution history

## Troubleshooting

### Common Issues

1. **No data for store**
   - Ensure store exists in database
   - Check if sensor data was collected

2. **Email not sending**
   - Verify SMTP credentials
   - Check spam folder
   - Review email logs in Actions

3. **Wrong timezone**
   - Verify store timezone in database
   - Check date calculations in report

### Debug Mode

Run with debug output:

```bash
DEBUG=* node generate-store-report.js store-id
```

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│ GitHub Actions  │────▶│   Supabase   │────▶│   Report    │
│   Scheduler     │     │   Database   │     │  Generator  │
└─────────────────┘     └──────────────┘     └─────────────┘
                                                     │
                                                     ▼
                                             ┌─────────────┐
                                             │    Email    │
                                             │   Sender    │
                                             └─────────────┘
```

## Future Enhancements

- [ ] PDF generation option
- [ ] Weekly/Monthly summary reports
- [ ] Custom report schedules per store
- [ ] WhatsApp delivery option
- [ ] Report analytics tracking