# GitHub Actions Workflow Cleanup Log

## Date: 2025-07-22

### Workflows Removed (8 total):

1. **collect-sensor-data-fixed-timezone.yml** - Old version with timezone fixes (merged into main workflow)
2. **collect-sensor-data-fixed.yml** - Duplicate/test version
3. **collect-sensor-data-old.yml** - Outdated version
4. **collect-sensor-data-smart.yml** - Test version with experimental features
5. **collect-sensor-data-timezone-aware.yml** - Merged into main workflow
6. **test-regional-data.yml** - Test workflow
7. **test-regional-simple.yml** - Test workflow
8. **collect-regional-data-clean.yml** - Duplicate of collect-regional-data.yml

### Production Workflows Kept (7 total):

1. **collect-sensor-data.yml** - Main sensor data collection (runs every 30 min)
2. **run-analytics-aggregation.yml** - Analytics calculation (runs hourly at :05)
3. **calculate-virtual-regions.yml** - Virtual region calculation (runs at :10 and :40)
4. **collect-regional-data.yml** - Regional data collection (runs hourly)
5. **data-pipeline-orchestrator.yml** - Pipeline validation (runs hourly at :15)
6. **deploy.yml** - Vercel deployment (on push)
7. **ci.yml** - CI/CD pipeline (on pull requests)

### Notes:
- All test and duplicate workflows have been removed
- The 5 data collection workflows form the complete data pipeline
- Deploy and CI workflows handle code deployment and testing
- All removed workflows were either test versions or outdated implementations