# GitHub Actions Workflows

This directory contains the automated workflows for the Retail Platform data collection and deployment pipeline.

## Architecture Overview

### Current Architecture (v2)

We use a **single-cron, event-driven architecture** where all workflows are orchestrated by a main pipeline controller:

```
main-pipeline.yml (*/30 * * * *)
├── Parallel Stage
│   ├── collect-sensor-data-v2.yml
│   └── collect-regional-data-v2.yml
└── Sequential Stage
    ├── run-analytics-aggregation-v2.yml
    ├── calculate-virtual-regions-v2.yml
    └── pipeline-validation
```

### Key Features

1. **Single Entry Point**: Only `main-pipeline.yml` has a cron schedule
2. **Event-Driven**: Workflows trigger based on completion events, not timing
3. **Parallel Processing**: Sensor collection runs in parallel batches
4. **Retry Logic**: Automatic retry with exponential backoff
5. **Health Monitoring**: Integrated with sensor health tracking
6. **Secure**: All credentials stored in GitHub Secrets

## Workflows

### Core Pipeline

#### `main-pipeline.yml`
- **Schedule**: Every 30 minutes (`*/30 * * * *`)
- **Purpose**: Orchestrates the entire data collection pipeline
- **Features**:
  - Pipeline ID generation for tracking
  - Conditional stage execution
  - Comprehensive error handling
  - Summary reporting

#### `collect-sensor-data-v2.yml`
- **Trigger**: Called by main-pipeline or manually
- **Purpose**: Collects data from all active sensors
- **Features**:
  - Parallel sensor processing (5x faster)
  - Automatic retry on failures
  - Health status updates
  - Alert creation for offline sensors

#### `collect-regional-data-v2.yml`
- **Trigger**: Called by main-pipeline or manually
- **Purpose**: Collects regional/zone occupancy data
- **Features**:
  - Omnia sensor integration
  - Regional data aggregation

#### `run-analytics-aggregation-v2.yml`
- **Trigger**: After data collection completes
- **Purpose**: Aggregates raw data into hourly/daily analytics
- **Features**:
  - Hourly aggregation
  - Store-level summaries
  - Performance metrics

### CI/CD Workflows

#### `ci.yml`
- **Trigger**: Pull requests and pushes to main/staging
- **Purpose**: Runs tests, linting, and type checking

#### `deploy.yml`
- **Trigger**: Pushes to main, staging, or develop branches
- **Purpose**: Deploys to corresponding Vercel environments

### Legacy Workflows (Being Phased Out)

The following workflows are being replaced by the v2 architecture:
- `collect-sensor-data.yml` → `collect-sensor-data-v2.yml`
- `collect-regional-data.yml` → `collect-regional-data-v2.yml`
- `data-pipeline-orchestrator.yml` → `main-pipeline.yml`

## Configuration

### Required Secrets

Add these to your repository's Settings → Secrets:

```yaml
# Supabase
SUPABASE_URL                    # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY       # Service role key (keep secure!)

# Sensor Authentication
SENSOR_AUTH_MILESIGHT          # Basic auth for Milesight sensors
SENSOR_AUTH_OMNIA              # Basic auth for Omnia sensors

# Notifications (Optional)
SLACK_WEBHOOK_URL              # Slack webhook for alerts
METRICS_ENDPOINT               # Custom metrics endpoint
METRICS_API_KEY                # Metrics authentication
```

### Environment Variables

Workflows use these environment variables:

```yaml
env:
  NODE_VERSION: '20'           # Node.js version
  TZ: 'UTC'                    # Timezone for timestamps
  DEBUG: 'false'               # Enable debug logging
```

## Scripts

The workflows use modular scripts located in `/scripts/workflows/`:

```
scripts/workflows/
├── collect-sensor-data.js     # Main sensor collection
├── collect-regional-data.js   # Regional data collection
├── run-analytics.js           # Analytics aggregation
├── validate-pipeline.js       # Pipeline validation
└── lib/
    ├── config.js              # Configuration management
    ├── supabase-client.js     # Database operations
    ├── sensor-client.js       # Sensor communication
    ├── retry-handler.js       # Retry logic
    └── parallel-collector.js  # Batch processing
```

## Monitoring

### GitHub Actions UI

- View runs: Actions tab in GitHub
- Check logs: Click on any workflow run
- Download artifacts: Available for 7 days

### Slack Notifications

If configured, you'll receive notifications for:
- Pipeline failures
- Sensor offline alerts
- Collection summaries

### Metrics

If metrics endpoint is configured:
- Collection success rates
- Pipeline duration
- Sensor health status
- Error rates

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check secret names match exactly
   - Verify no extra spaces in secret values
   - Ensure secrets are in the correct repository

2. **Timeout Issues**
   - Check sensor connectivity
   - Review timeout settings in scripts
   - Verify network access from GitHub Actions

3. **Module Not Found**
   - Ensure npm install runs in workflow
   - Check file paths are correct
   - Verify scripts exist in repository

### Debug Mode

Enable debug logging by manually triggering with:
```yaml
env:
  DEBUG: 'true'
```

### Manual Testing

Test individual workflows:
```bash
# Test sensor collection
gh workflow run collect-sensor-data-v2.yml

# Test full pipeline
gh workflow run main-pipeline.yml
```

## Migration Guide

See [WORKFLOW_MIGRATION_GUIDE.md](../../docs/implementation/WORKFLOW_MIGRATION_GUIDE.md) for detailed migration instructions from v1 to v2 workflows.

## Performance

### Current Metrics (v2)

- **Sensor Collection**: ~2-3 minutes (vs 8-10 minutes in v1)
- **Full Pipeline**: ~5-7 minutes (vs 15-20 minutes in v1)
- **Success Rate**: 99%+ (vs 95% in v1)
- **Parallel Processing**: 5 concurrent sensors

### Optimization Tips

1. Adjust batch size in `config.js`
2. Tune retry parameters for your network
3. Use conditional execution to skip unnecessary stages
4. Monitor and adjust timeout values

## Security

### Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Rotate credentials** - Update secrets quarterly
3. **Least privilege** - Use minimal permissions
4. **Audit logs** - Review workflow runs regularly

### Security Features

- No hardcoded credentials
- Encrypted secret storage
- Audit trail in workflow logs
- Automatic secret masking

## Contributing

When modifying workflows:

1. Test changes in a feature branch
2. Run manual tests before merging
3. Update this documentation
4. Follow the established patterns
5. Add error handling

## Future Improvements

- [ ] Add workflow metrics dashboards
- [ ] Implement blue-green deployments
- [ ] Add performance benchmarking
- [ ] Create workflow unit tests
- [ ] Add cost monitoring

---

**Last Updated**: 2025-07-23
**Version**: 2.0
**Maintainer**: Platform Engineering Team