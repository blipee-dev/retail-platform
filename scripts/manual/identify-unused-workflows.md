# Unused GitHub Actions Workflows Analysis

## Currently Active Workflows (Keep)
1. **main-pipeline.yml** - Main orchestrator (uses v2 workflows)
2. **collect-sensor-data-v2.yml** - Called by main-pipeline
3. **collect-regional-data-v2.yml** - Called by main-pipeline
4. **run-analytics-aggregation-v2.yml** - Called by main-pipeline
5. **calculate-virtual-regions-v2.yml** - Called by main-pipeline
6. **ci.yml** - Continuous Integration (tests)
7. **deploy.yml** - Deployment workflow
8. **run-daily-aggregation.yml** - Daily aggregation (may be needed)

## Workflows to Remove
1. **collect-sensor-data.yml** - Replaced by v2
2. **collect-regional-data.yml** - Replaced by v2
3. **run-analytics-aggregation.yml** - Replaced by v2
4. **calculate-virtual-regions.yml** - Replaced by v2
5. **data-pipeline-orchestrator.yml** - Replaced by main-pipeline.yml
6. **daily-store-reports.yml** - Check if still needed

## Summary
- Remove all v1 workflows (non-v2 versions)
- Remove old orchestrator
- Check if daily-store-reports is still needed