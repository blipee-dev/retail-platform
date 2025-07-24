# Discord Webhook Setup for GitHub Actions

## ⚠️ Security Warning
**NEVER commit webhook URLs to your repository or share them publicly!** Anyone with the URL can send messages to your Discord channel.

## Setup Instructions

1. **Delete the exposed webhook** (if you shared it publicly):
   - Go to your Discord Server Settings → Integrations → Webhooks
   - Find the webhook you created and delete it
   - Create a new one with a fresh URL

2. **Create a new webhook**:
   - Discord Server Settings → Integrations → Webhooks → New Webhook
   - Name it something like "GitHub Actions"
   - Choose the channel for notifications
   - Copy the webhook URL

3. **Add to GitHub Secrets**:
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: Paste your webhook URL
   - Click "Add secret"

4. **Test the webhook**:
   - Go to Actions tab in your repository
   - Find "Test Discord Notification" workflow
   - Click "Run workflow"
   - Check your Discord channel for the test message

## Webhook Format

The pipeline uses Discord's embed format for rich notifications:

```json
{
  "embeds": [{
    "title": "Pipeline Status",
    "color": 15158332,  // Red for failures, green for success
    "fields": [...],
    "timestamp": "2023-07-24T12:00:00.000Z"
  }]
}
```

## Troubleshooting

- If notifications aren't working, check that `DISCORD_WEBHOOK_URL` is set in GitHub Secrets
- The webhook URL should start with `https://discord.com/api/webhooks/` or `https://canary.discord.com/api/webhooks/`
- Check the GitHub Actions logs for any error messages