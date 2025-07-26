# Adaptive Scheduling for Data Pipeline

## Overview

The blipee OS Retail Intelligence platform now uses an adaptive scheduling system that adjusts data collection frequency based on expected traffic patterns. This reduces API calls by ~29% while maintaining data freshness during business hours.

## Schedule Pattern

| Time Period | UTC Hours | Frequency | Runs per Day |
|------------|-----------|-----------|--------------|
| 🌙 **Late Night** | 2-6 AM | Every 2 hours | 2 runs |
| 🌅 **Off-Peak** | 6-9 AM, 9 PM-2 AM | Every hour | 8 runs |
| ☀️ **Business Hours** | 9 AM-9 PM | Every 30 minutes | 24 runs |

**Total**: 34 runs/day (vs 48 with fixed 30-minute schedule)

## Implementation

### 1. Enable Adaptive Scheduling

The adaptive scheduler is implemented as a separate workflow that triggers the main pipeline:

```yaml
# .github/workflows/adaptive-scheduler.yml
on:
  schedule:
    - cron: '0 * * * *'  # Runs every hour to check schedule
```

### 2. Disable Fixed Schedule

The main pipeline no longer has a fixed schedule:

```yaml
# .github/workflows/main-pipeline.yml
on:
  workflow_dispatch:  # Only manual or triggered by adaptive scheduler
```

## Monitoring

Use the monitoring script to check the schedule:

```bash
node scripts/monitor-adaptive-schedule.js
```

This shows:
- Current schedule period
- Next scheduled run
- Daily run statistics
- Complete hourly breakdown

## Benefits

1. **Cost Reduction**: 29% fewer API calls to sensor endpoints
2. **Resource Optimization**: Less compute usage during low-traffic hours
3. **Data Freshness**: Maintains 30-minute updates during business hours
4. **Flexibility**: Easy to adjust schedule patterns based on your needs

## Customization

To adjust the schedule for your region:

1. Edit `.github/workflows/adaptive-scheduler.yml`
2. Modify the hour ranges in the case statement
3. Consider your stores' peak hours (may vary by timezone)

### Example: US East Coast Focus

```bash
# Business hours (9 AM - 9 PM EST = 2 PM - 2 AM UTC)
14|15|16|17|18|19|20|21|22|23|0|1)
  # Run every 30 minutes
  ;;
```

## Rollback

To revert to fixed 30-minute scheduling:

1. Disable the adaptive scheduler workflow
2. Re-add the schedule to main-pipeline.yml:
   ```yaml
   on:
     schedule:
       - cron: '*/30 * * * *'
   ```

## FAQ

**Q: What happens during holidays or special events?**
A: You can manually trigger the pipeline more frequently using the workflow_dispatch option.

**Q: Can I have different schedules for different stores?**
A: Currently, the schedule is global. Per-store scheduling would require separate workflows.

**Q: How do I verify the schedule is working?**
A: Check the Actions tab in GitHub - you should see the adaptive-scheduler running hourly and triggering the main pipeline according to the schedule.