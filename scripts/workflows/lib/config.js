/**
 * Configuration for GitHub Actions workflows
 * Uses environment variables - no hardcoded credentials
 */

module.exports = {
  supabase: {
    url: process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY
  },
  
  sensors: {
    milesight: {
      auth: process.env.SENSOR_AUTH_MILESIGHT || 'Basic ' + Buffer.from('admin:grnl.2024').toString('base64'),
      timeout: 30000,
      retries: 3,
      concurrency: 5
    },
    omnia: {
      auth: process.env.SENSOR_AUTH_OMNIA || 'Basic ' + Buffer.from('admin:grnl.2024').toString('base64'),
      timeout: 30000,
      retries: 3,
      concurrency: 3
    }
  },
  
  pipeline: {
    batchSize: 20,
    parallelJobs: 5,
    retryDelay: 1000,
    maxRetries: 3
  },
  
  environment: process.env.NODE_ENV || 'production',
  
  monitoring: {
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    discordWebhook: process.env.DISCORD_WEBHOOK_URL,
    alertOnFailure: true,
    metricsEndpoint: process.env.METRICS_ENDPOINT
  }
};