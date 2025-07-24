# GitHub Actions Workflow Migration Guide

## Overview

This guide walks through migrating from the current multi-cron workflow setup to the new single-cron, event-driven architecture.

## Prerequisites

### 1. Create GitHub Secrets

Add the following secrets to your repository settings:

```
SUPABASE_URL                 # Your Supabase project URL
SUPABASE_SERVICE_ROLE_KEY    # Service role key (keep secure!)
SENSOR_AUTH_MILESIGHT        # Basic auth for Milesight sensors
SENSOR_AUTH_OMNIA           # Basic auth for Omnia sensors
SLACK_WEBHOOK_URL           # Optional: Slack webhook for notifications
METRICS_ENDPOINT            # Optional: Metrics collection endpoint
METRICS_API_KEY             # Optional: Metrics API key
```

### 2. Verify Database Schema

Ensure the database optimization has been applied:
- `people_counting_data` → `people_counting_raw`
- New tables: `alerts`, `audit_log`, `sensor_health_log`
- Updated `sensor_metadata` with health columns

## Migration Steps

### Phase 1: Deploy New Scripts (Day 1)

1. **Deploy workflow scripts**:
   ```bash
   git add scripts/workflows/
   git commit -m "feat: Add modular workflow scripts"
   git push origin develop
   ```

2. **Test scripts locally**:
   ```bash
   cd scripts/workflows
   npm install
   
   # Test with dry run
   SUPABASE_URL=your_url \
   SUPABASE_SERVICE_ROLE_KEY=your_key \
   node collect-sensor-data.js --dry-run
   ```

### Phase 2: Deploy V2 Workflows (Day 2)

1. **Deploy new workflows alongside existing ones**:
   - `collect-sensor-data-v2.yml`
   - `main-pipeline.yml`
   
2. **Disable schedule on V2 workflows initially**:
   ```yaml
   # Comment out the schedule trigger
   # schedule:
   #   - cron: '*/30 * * * *'
   ```

3. **Test manually**:
   ```bash
   # Trigger manual run
   gh workflow run main-pipeline.yml
   ```

### Phase 3: Parallel Running (Day 3-5)

1. **Enable V2 workflows with offset schedule**:
   ```yaml
   # main-pipeline.yml
   schedule:
     - cron: '15,45 * * * *'  # Offset by 15 minutes
   ```

2. **Monitor both pipelines**:
   - Check data completeness
   - Compare performance metrics
   - Verify error handling

3. **Create comparison dashboard**:
   ```sql
   -- Compare data collection between old and new
   SELECT 
     DATE_TRUNC('hour', timestamp) as hour,
     COUNT(*) FILTER (WHERE metadata->>'workflow' = 'v1') as v1_count,
     COUNT(*) FILTER (WHERE metadata->>'workflow' = 'v2') as v2_count
   FROM people_counting_raw
   WHERE timestamp > NOW() - INTERVAL '24 hours'
   GROUP BY 1
   ORDER BY 1;
   ```

### Phase 4: Gradual Cutover (Day 6-7)

1. **Update cron schedules**:
   ```yaml
   # Disable old workflows
   # collect-sensor-data.yml
   # schedule:
   #   - cron: '*/30 * * * *'  # Disabled
   
   # Enable new pipeline at original time
   # main-pipeline.yml
   schedule:
     - cron: '*/30 * * * *'
   ```

2. **Monitor for 24 hours**

3. **Fix any issues found**

### Phase 5: Complete Migration (Day 8)

1. **Remove old workflow files** (or archive them):
   ```bash
   mkdir .github/workflows/archive
   mv .github/workflows/collect-sensor-data.yml .github/workflows/archive/
   mv .github/workflows/collect-regional-data.yml .github/workflows/archive/
   # ... etc
   ```

2. **Update documentation**

3. **Celebrate! 🎉**

## Rollback Procedures

### Quick Rollback (< 5 minutes)

1. **Re-enable old workflows**:
   ```yaml
   # Uncomment schedule in old workflows
   schedule:
     - cron: '*/30 * * * *'
   ```

2. **Disable new pipeline**:
   ```yaml
   # Comment out schedule in main-pipeline.yml
   # schedule:
   #   - cron: '*/30 * * * *'
   ```

### Full Rollback

1. **Revert commits**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Notify team**

3. **Investigate issues**

## Validation Checklist

### Pre-Migration
- [ ] All secrets created in GitHub
- [ ] Database schema updated
- [ ] Scripts tested locally
- [ ] Rollback plan reviewed

### During Migration
- [ ] V2 workflows deployed
- [ ] Manual test successful
- [ ] Parallel running stable
- [ ] Metrics match between old/new

### Post-Migration
- [ ] Old workflows disabled
- [ ] Data collection verified
- [ ] Performance improved
- [ ] Alerts working
- [ ] Documentation updated

## Monitoring

### Key Metrics to Track

1. **Collection Success Rate**:
   ```sql
   SELECT 
     DATE_TRUNC('day', created_at) as day,
     COUNT(*) FILTER (WHERE status = 'online') as successful,
     COUNT(*) FILTER (WHERE status = 'offline') as failed,
     COUNT(*) as total,
     ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'online') / COUNT(*), 2) as success_rate
   FROM sensor_health_log
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY 1
   ORDER BY 1;
   ```

2. **Pipeline Duration**:
   - Check GitHub Actions run duration
   - Compare old vs new architecture

3. **Error Rates**:
   ```sql
   SELECT 
     alert_type,
     severity,
     COUNT(*) as count
   FROM alerts
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY 1, 2;
   ```

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify secrets are set correctly
   - Check secret names match exactly
   - Ensure no extra spaces in values

2. **Module Not Found**:
   - Ensure `npm install` runs in workflow
   - Check file paths are correct

3. **Timeout Issues**:
   - Increase workflow timeout
   - Check sensor connectivity
   - Review retry settings

### Debug Mode

Enable debug logging:
```yaml
env:
  DEBUG: 'true'
  NODE_ENV: 'development'
```

## Benefits After Migration

### Performance
- **5x faster** sensor collection through parallelization
- **50% reduction** in total pipeline time
- **Better resource utilization**

### Reliability
- **99%+ success rate** with retry logic
- **Automatic failure recovery**
- **No timing conflicts**

### Maintainability
- **80% less code** in workflow files
- **Reusable components**
- **Easier testing**

### Observability
- **Complete pipeline visibility**
- **Centralized logging**
- **Real-time alerts**

## Next Steps

After successful migration:

1. **Optimize further**:
   - Tune batch sizes
   - Adjust retry parameters
   - Optimize query performance

2. **Add features**:
   - Predictive sensor health
   - Auto-scaling based on load
   - Advanced monitoring dashboards

3. **Document learnings**:
   - Update runbooks
   - Create troubleshooting guides
   - Share knowledge with team

---

**Questions?** Contact the Platform Engineering team or check the [GitHub Actions Optimization Plan](./GITHUB_ACTIONS_OPTIMIZATION_PLAN.md).