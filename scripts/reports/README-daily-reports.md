# Daily Traffic Reports

This system automatically sends daily traffic reports to store managers at 8:00 AM in their local timezone.

## Features

- **Timezone-aware scheduling**: Reports are sent at 8 AM in each store's local timezone
- **Multi-language support**: Automatically detects and uses the appropriate language (EN/ES/PT)
- **Previous day data**: Reports contain complete data from the previous day
- **Email delivery**: Professional HTML emails with charts and insights
- **Failure notifications**: Discord alerts on workflow failures

## How it Works

1. **GitHub Actions workflow** runs every hour
2. **Checks which stores** have reached 8:00 AM (±30 minutes) in their timezone
3. **Fetches yesterday's data** from Supabase for those stores
4. **Generates HTML report** in the appropriate language
5. **Sends email** to configured recipients

## Configuration

### Required GitHub Secrets

```bash
# Supabase
SUPABASE_URL
SUPABASE_SERVICE_KEY

# Email (SMTP)
EMAIL_HOST
EMAIL_PORT
EMAIL_USER
EMAIL_PASS
EMAIL_FROM  # Optional, defaults to 'analytics@blipee.com'

# Notifications
DISCORD_WEBHOOK_URL  # Optional, for failure alerts
```

### Store Configuration

Each store needs:
- `timezone`: Valid timezone (e.g., 'Europe/Lisbon')
- `contact_email` or `report_emails`: Email recipients
- `country`: For language detection (ES/PT/EN)

## Testing

### Manual Trigger

You can manually trigger the workflow from GitHub Actions with options:
- **test_mode**: Send to test email instead of real recipients
- **specific_store**: Send report for a specific store only

### Local Testing

```bash
cd scripts/reports
npm install
node daily-report-sender.js
```

## Email Templates

Templates are available in three languages:
- `daily-report-template-en.html` - English
- `daily-report-template-es.html` - Spanish
- `daily-report-template-pt.html` - Portuguese (European)

## Report Contents

Each report includes:

### Executive Summary
- Total visitors with day-over-day change
- Capture rate and passerby count
- Peak hour and traffic
- Average hourly traffic
- Busiest period

### Hourly Traffic Pattern
- Visual bar chart showing hourly traffic
- Color-coded bars (blue/orange/red) for traffic levels
- Key insights for morning/afternoon/evening periods

## Troubleshooting

### Reports not sending
1. Check store has valid timezone configured
2. Verify email recipients are set
3. Check GitHub Actions logs for errors

### Wrong timezone
1. Verify store timezone in database
2. Check it matches standard timezone names

### Email delivery issues
1. Verify SMTP credentials
2. Check spam folders
3. Ensure EMAIL_FROM is authorized sender

## Adding New Languages

1. Add translations to `generate-i18n-templates.js`
2. Run `node generate-i18n-templates.js`
3. Update language detection logic in `daily-report-sender.js`