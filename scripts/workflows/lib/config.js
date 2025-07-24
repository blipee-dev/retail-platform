/**
 * Configuration for GitHub Actions workflows
 * Uses environment variables - no hardcoded credentials
 */

module.exports = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  sensors: {
    milesight: {
      auth: process.env.SENSOR_AUTH_MILESIGHT || '',
      timeout: 30000,
      retries: 3
    },
    omnia: {
      auth: process.env.SENSOR_AUTH_OMNIA || '',
      timeout: 30000,
      retries: 3
    }
  },
  
  pipeline: {
    batchSize: 20,
    parallelJobs: 5,
    retryDelay: 1000,
    maxRetries: 3
  },
  
  monitoring: {
    slackWebhook: process.env.SLACK_WEBHOOK_URL,
    alertOnFailure: true,
    metricsEndpoint: process.env.METRICS_ENDPOINT
  }
};