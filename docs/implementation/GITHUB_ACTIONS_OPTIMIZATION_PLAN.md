# GitHub Actions Workflow Optimization Implementation Plan

## Overview

This document outlines the implementation plan for modernizing our GitHub Actions workflows to create a secure, reliable, and performant data collection pipeline.

## Current State Analysis

### Issues Identified
1. **Security**: Hardcoded credentials in workflow files
2. **Reliability**: No retry mechanisms for failed collections
3. **Performance**: Sequential processing of sensors
4. **Maintainability**: 400+ lines of JavaScript embedded in YAML
5. **Orchestration**: Multiple independent cron jobs with timing dependencies
6. **Monitoring**: No visibility into pipeline health

### Current Architecture
```
5 separate workflows with independent cron schedules:
- collect-sensor-data.yml (*/30)
- collect-regional-data.yml (:00)
- run-analytics-aggregation.yml (:05)
- calculate-virtual-regions.yml (:10,:40)
- data-pipeline-orchestrator.yml (:15)
```

## Target Architecture

### Single Entry Point Design
```
main-pipeline.yml (*/30)
  ├─ Parallel Collection
  │   ├─ sensor-data-collection
  │   └─ regional-data-collection
  └─ Sequential Processing (event-driven)
      ├─ analytics-aggregation
      ├─ virtual-regions-calculation
      └─ pipeline-validation
```

## Implementation Phases

### Phase 1: Immediate Security Fixes (Day 1-2)

#### 1.1 Remove Hardcoded Credentials
```bash
# Add to GitHub Secrets:
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SENSOR_AUTH_MILESIGHT
SENSOR_AUTH_OMNIA
```

#### 1.2 Update Workflow Files
```yaml
# Replace hardcoded values with:
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

#### 1.3 Fix Table References
- Update `data-pipeline-orchestrator.yml`: Line 166
- Update `calculate-virtual-regions.yml`: Lines 186, 194, 207

### Phase 2: Extract Inline Code (Day 3-4)

#### 2.1 Create Script Structure
```
scripts/
└── workflows/
    ├── lib/
    │   ├── sensor-client.js
    │   ├── supabase-client.js
    │   ├── retry-handler.js
    │   ├── timezone-utils.js
    │   └── error-handler.js
    ├── collect-sensor-data.js
    ├── collect-regional-data.js
    ├── run-analytics.js
    └── validate-pipeline.js
```

#### 2.2 Example: Extracted Sensor Collection
```javascript
// scripts/workflows/collect-sensor-data.js
#!/usr/bin/env node

const { SensorClient } = require('./lib/sensor-client');
const { SupabaseClient } = require('./lib/supabase-client');
const { RetryHandler } = require('./lib/retry-handler');
const { updateSensorHealth } = require('./lib/sensor-health');

async function main() {
  const supabase = new SupabaseClient({
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  });

  const sensors = await supabase.getActiveSensors();
  const results = await collectAllSensors(sensors);
  
  console.log(JSON.stringify({
    success: results.successful,
    failed: results.failed,
    total: results.total
  }));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}
```

### Phase 3: Implement Single-Cron Architecture (Day 5-7)

#### 3.1 Main Pipeline Controller
```yaml
# .github/workflows/main-pipeline.yml
name: Data Collection Pipeline

on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  controller:
    runs-on: ubuntu-latest
    outputs:
      pipeline_id: ${{ steps.init.outputs.id }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Initialize Pipeline
        id: init
        run: |
          id="pipeline-$(date +%Y%m%d-%H%M%S)"
          echo "id=$id" >> $GITHUB_OUTPUT
          
      - name: Check Conditions
        run: node scripts/workflows/check-conditions.js
```

#### 3.2 Convert to Reusable Workflows
```yaml
# .github/workflows/collect-sensor-data.yml
on:
  workflow_call:
    inputs:
      pipeline_id:
        required: true
        type: string
    outputs:
      records_collected:
        value: ${{ jobs.collect.outputs.records }}

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node scripts/workflows/collect-sensor-data.js
```

### Phase 4: Add Parallel Processing (Day 8-9)

#### 4.1 Batch Processing Strategy
```javascript
// scripts/workflows/lib/parallel-collector.js
class ParallelCollector {
  constructor(options = {}) {
    this.concurrency = options.concurrency || 5;
    this.batchSize = options.batchSize || 20;
  }

  async collectBatch(sensors) {
    const batches = this.createBatches(sensors, this.batchSize);
    const results = await Promise.allSettled(
      batches.map(batch => this.processBatch(batch))
    );
    return this.aggregateResults(results);
  }

  createBatches(items, size) {
    const batches = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }
    return batches;
  }
}
```

#### 4.2 GitHub Actions Matrix
```yaml
prepare:
  outputs:
    matrix: ${{ steps.prepare.outputs.matrix }}
  steps:
    - id: prepare
      run: |
        matrix=$(node scripts/workflows/prepare-matrix.js)
        echo "matrix=$matrix" >> $GITHUB_OUTPUT

collect:
  needs: prepare
  strategy:
    matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
    max-parallel: 5
```

### Phase 5: Implement Monitoring (Day 10-11)

#### 5.1 Metrics Collection
```javascript
// scripts/workflows/lib/metrics.js
class WorkflowMetrics {
  async record(data) {
    const metrics = {
      workflow: process.env.GITHUB_WORKFLOW,
      run_id: process.env.GITHUB_RUN_ID,
      timestamp: new Date().toISOString(),
      duration_ms: data.duration,
      records_processed: data.records,
      errors: data.errors,
      retry_count: data.retries
    };
    
    await this.sendToMonitoring(metrics);
  }
}
```

#### 5.2 Alert Configuration
```yaml
- name: Send Failure Alert
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
    status: ${{ job.status }}
    text: |
      Pipeline Failed!
      Workflow: ${{ github.workflow }}
      Run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

### Phase 6: Add Sensor Health Monitoring (Day 12)

#### 6.1 Update Collection Script
```javascript
// Add to sensor collection
async function updateSensorHealth(sensor, result) {
  const update = {
    last_data_received: new Date().toISOString(),
    status: result.success ? 'online' : 'offline',
    consecutive_failures: result.success ? 0 : sensor.consecutive_failures + 1
  };
  
  await supabase
    .from('sensor_metadata')
    .update(update)
    .eq('sensor_id', sensor.sensor_id);
    
  // Create alert if needed
  if (update.consecutive_failures >= 3) {
    await createSensorAlert(sensor);
  }
}
```

## Migration Strategy

### Week 1: Preparation
1. Create all GitHub Secrets
2. Extract inline scripts
3. Create test suite
4. Document rollback procedures

### Week 2: Gradual Rollout
1. **Monday**: Deploy security fixes to all workflows
2. **Tuesday**: Test extracted scripts in development
3. **Wednesday**: Deploy single workflow with new architecture
4. **Thursday**: Monitor and validate results
5. **Friday**: Roll out to remaining workflows

### Week 3: Optimization
1. Implement parallel processing
2. Add monitoring and alerting
3. Performance testing
4. Documentation updates

## Testing Strategy

### Unit Tests
```javascript
// __tests__/workflows/sensor-client.test.js
describe('SensorClient', () => {
  it('should retry on failure', async () => {
    const client = new SensorClient({ retries: 3 });
    // Test retry logic
  });
});
```

### Integration Tests
```yaml
# .github/workflows/test-pipeline.yml
name: Test Pipeline
on: pull_request

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm test -- workflows/
```

## Success Metrics

### Performance
- **Collection Time**: Reduce from 8-10 minutes to 2-3 minutes
- **Success Rate**: Increase from ~95% to 99%+
- **Parallel Processing**: 5x improvement in throughput

### Reliability
- **Retry Success**: 90% of transient failures recovered
- **Alert Response**: < 5 minutes for critical failures
- **Data Completeness**: 99.9% data capture rate

### Security
- **Zero** hardcoded credentials
- **All** secrets rotated quarterly
- **Audit trail** for all operations

## Rollback Plan

### Immediate Rollback
```bash
# Revert to previous workflow version
git revert <commit-hash>
git push origin main
```

### Gradual Rollback
1. Disable new pipeline in workflow file
2. Re-enable individual cron jobs
3. Monitor for 24 hours
4. Remove new code if stable

## Documentation Requirements

### Update Required
1. `docs/CHANGELOG.md` - Add workflow optimization entry
2. `CLAUDE.md` - Update current state section
3. `.github/workflows/README.md` - New architecture documentation
4. `docs/operations/runbooks/` - Add failure response procedures

### New Documentation
1. Workflow architecture diagram
2. Troubleshooting guide
3. Performance benchmarks
4. Security audit checklist

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2 days | Security fixes deployed |
| Phase 2 | 2 days | Scripts extracted |
| Phase 3 | 3 days | Single-cron architecture |
| Phase 4 | 2 days | Parallel processing |
| Phase 5 | 2 days | Monitoring deployed |
| Phase 6 | 1 day | Health monitoring |
| **Total** | **12 days** | **Complete optimization** |

## Next Steps

1. Review and approve this plan
2. Create GitHub Secrets
3. Begin Phase 1 implementation
4. Schedule daily standup for progress tracking

---

**Document Version**: 1.0  
**Created**: 2025-07-23  
**Author**: Platform Engineering Team