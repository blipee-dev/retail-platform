# Analytics System Deployment Checklist

## Immediate Actions Required

### 1. Database Setup (Priority: HIGH)
**Time: 30 minutes**

Run the migrations in this order:

```bash
# 1. Run capture rate migration (adds passing traffic fields)
psql $DATABASE_URL < app/lib/migrations/20250721_add_capture_rate_fields.sql

# 2. Run regional analytics migration (complete schema)
psql $DATABASE_URL < app/lib/migrations/20250721_regional_analytics_schema.sql

# 3. Verify tables were created
psql $DATABASE_URL -c "\dt"
```

### 2. Update API Endpoints (Priority: HIGH)
**Time: 2 hours**

Create/update these API endpoints:

#### A. Region Configuration API
```typescript
// app/api/stores/[storeId]/regions/route.ts
POST   /api/stores/{storeId}/regions - Configure regions
GET    /api/stores/{storeId}/regions - Get current config
PUT    /api/stores/{storeId}/regions/{regionId} - Update region
```

#### B. Enhanced Analytics API
```typescript
// app/api/analytics/unified/route.ts
GET    /api/analytics/unified/realtime - Real-time metrics
GET    /api/analytics/unified/occupancy - Current occupancy
GET    /api/analytics/unified/journeys - Customer journeys
GET    /api/analytics/unified/predictions - ML predictions
```

#### C. WebSocket for Live Data
```typescript
// app/api/analytics/stream/route.ts
WS     /api/analytics/stream - Real-time updates
```

### 3. Update Data Ingestion (Priority: HIGH)
**Time: 1 hour**

Modify the bulk ingestion to handle new fields:

```typescript
// app/api/sensors/bulk-ingest/route.ts
// Already has capture rate fields, need to add:
- Region entrance/exit events
- Journey tracking
- Real-time occupancy updates
```

### 4. Create Analytics Dashboard Pages (Priority: HIGH)
**Time: 4 hours**

Build these dashboard pages:

```typescript
// app/dashboard/analytics/page.tsx - Main analytics dashboard
// app/dashboard/analytics/realtime/page.tsx - Real-time view
// app/dashboard/analytics/reports/page.tsx - Historical reports
// app/dashboard/analytics/predictions/page.tsx - Predictive insights
```

### 5. Configure J&J Sensor (Priority: MEDIUM)
**Time: 1 hour**

```bash
# 1. Register the sensor
python scripts/register_jj_sensor.py

# 2. Configure regions (in camera web interface)
- Region 1: Entrance area
- Region 2: Main shopping floor  
- Region 3: Checkout queue
- Region 4: Premium section

# 3. Start data collection
python scripts/sensor_data_bridge.py \
  --config config/sensors/jj_01_arrábida.json \
  --api-url https://retail-platform-git-develop-blipee.vercel.app \
  --api-token $API_TOKEN \
  --store-id $STORE_ID \
  --interval 300
```

### 6. Set Up Real-time Processing (Priority: HIGH)
**Time: 3 hours**

Create the real-time processing pipeline:

```typescript
// app/lib/analytics/processor.ts
export class AnalyticsProcessor {
  processLineCrossing(data: LineCrossingData)
  processRegionalCount(data: RegionalCountData)
  processEntranceExit(data: EntranceExitData)
  calculateMetrics()
  checkAlerts()
  updateDashboard()
}
```

### 7. Implement Basic Alerts (Priority: MEDIUM)
**Time: 2 hours**

Set up essential alerts:

```typescript
const alerts = [
  {
    name: 'StoreCapacity',
    condition: occupancy > capacity * 0.9,
    action: 'Notify manager'
  },
  {
    name: 'LongQueue',
    condition: queueLength > 10 || waitTime > 600,
    action: 'Open more checkouts'
  },
  {
    name: 'LowCaptureRate',
    condition: captureRate < baseline * 0.7,
    action: 'Check storefront'
  }
]
```

## Week 1 Development Plan

### Day 1-2: Foundation
- [ ] Run all database migrations
- [ ] Update API endpoints for new schema
- [ ] Test data ingestion with new fields
- [ ] Create basic analytics service

### Day 3-4: Dashboard
- [ ] Build real-time dashboard component
- [ ] Create occupancy visualization
- [ ] Implement traffic flow display
- [ ] Add alert notifications

### Day 5: Integration
- [ ] Connect Python bridge to new APIs
- [ ] Test end-to-end data flow
- [ ] Verify analytics calculations
- [ ] Deploy to staging environment

## Quick Implementation Code

### 1. Analytics Service
```typescript
// app/lib/services/analytics.service.ts
import { createClient } from '@/lib/supabase'

export class AnalyticsService {
  async getCurrentOccupancy(storeId: string) {
    const { data } = await supabase
      .rpc('calculate_current_occupancy', { store_id: storeId })
    
    return {
      total: data.total_occupancy,
      byZone: data.zone_occupancy,
      trend: data.occupancy_trend,
      alerts: data.occupancy_alerts
    }
  }
  
  async getCaptureRate(storeId: string, timeRange: TimeRange) {
    const { data } = await supabase
      .from('people_counting_data')
      .select('capture_rate, passing_traffic, total_in')
      .eq('store_id', storeId)
      .gte('timestamp', timeRange.start)
      .lte('timestamp', timeRange.end)
    
    return {
      current: data[0]?.capture_rate || 0,
      average: avg(data.map(d => d.capture_rate)),
      trend: calculateTrend(data)
    }
  }
  
  async getJourneyAnalytics(storeId: string) {
    const { data } = await supabase
      .from('customer_journeys')
      .select('*')
      .eq('store_id', storeId)
      .gte('start_time', new Date(Date.now() - 24*60*60*1000))
    
    return {
      totalJourneys: data.length,
      avgDuration: avg(data.map(j => j.total_duration_seconds)),
      conversionRate: data.filter(j => j.conversion).length / data.length,
      commonPaths: extractCommonPaths(data)
    }
  }
}
```

### 2. Real-time Dashboard Component
```typescript
// app/components/analytics/RealTimeDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { AnalyticsService } from '@/lib/services/analytics.service'

export function RealTimeDashboard({ storeId }: { storeId: string }) {
  const [metrics, setMetrics] = useState<Metrics>()
  const analytics = new AnalyticsService()
  
  useEffect(() => {
    // Initial load
    loadMetrics()
    
    // Set up real-time updates
    const ws = new WebSocket(`/api/analytics/stream?storeId=${storeId}`)
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data)
      setMetrics(prev => ({ ...prev, ...update }))
    }
    
    return () => ws.close()
  }, [storeId])
  
  const loadMetrics = async () => {
    const [occupancy, captureRate, journeys] = await Promise.all([
      analytics.getCurrentOccupancy(storeId),
      analytics.getCaptureRate(storeId, { start: today(), end: now() }),
      analytics.getJourneyAnalytics(storeId)
    ])
    
    setMetrics({ occupancy, captureRate, journeys })
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <OccupancyWidget data={metrics?.occupancy} />
      <CaptureRateWidget data={metrics?.captureRate} />
      <ConversionWidget data={metrics?.journeys} />
    </div>
  )
}
```

### 3. Alert Handler
```typescript
// app/lib/alerts/handler.ts
export class AlertHandler {
  async checkAndTrigger(metrics: Metrics) {
    const alerts = []
    
    // Occupancy alerts
    if (metrics.occupancy.total > CAPACITY * 0.9) {
      alerts.push({
        type: 'capacity',
        severity: 'high',
        message: `Store at ${Math.round(metrics.occupancy.rate * 100)}% capacity`,
        actions: ['Implement crowd control', 'Monitor exits']
      })
    }
    
    // Capture rate alerts
    if (metrics.captureRate.current < BASELINE_CAPTURE * 0.7) {
      alerts.push({
        type: 'capture',
        severity: 'medium',
        message: `Low capture rate: ${metrics.captureRate.current.toFixed(1)}%`,
        actions: ['Check window displays', 'Review entrance visibility']
      })
    }
    
    // Queue alerts
    if (metrics.queues.maxLength > 10) {
      alerts.push({
        type: 'queue',
        severity: 'high',
        message: `Long queue detected: ${metrics.queues.maxLength} people`,
        actions: ['Open additional checkouts', 'Deploy queue management']
      })
    }
    
    // Send notifications
    for (const alert of alerts) {
      await this.notify(alert)
    }
  }
}
```

## Testing Plan

### 1. Unit Tests
```typescript
// tests/analytics.test.ts
describe('Analytics System', () => {
  test('calculates occupancy correctly', async () => {
    const occupancy = await calculateOccupancy(testData)
    expect(occupancy).toBe(expectedOccupancy)
  })
  
  test('tracks journeys accurately', async () => {
    const journey = await extractJourney(events)
    expect(journey.path).toEqual(expectedPath)
  })
  
  test('triggers alerts appropriately', async () => {
    const alerts = await checkAlerts(highOccupancyData)
    expect(alerts).toContainEqual(
      expect.objectContaining({ type: 'capacity' })
    )
  })
})
```

### 2. Integration Tests
- Test sensor → API → database flow
- Verify real-time updates work
- Check alert delivery
- Validate analytics calculations

### 3. Load Tests
- Simulate high-traffic scenarios
- Test with multiple sensors
- Verify performance at scale

## Deployment Steps

### 1. Staging Deployment
```bash
# 1. Deploy to staging branch
git checkout staging
git merge develop
git push origin staging

# 2. Run migrations on staging DB
./scripts/run-migrations.sh staging

# 3. Test with J&J sensor
# 4. Verify dashboards load
# 5. Check real-time updates
```

### 2. Production Deployment
```bash
# 1. After staging validation
git checkout main
git merge staging
git push origin main

# 2. Run migrations on production
./scripts/run-migrations.sh production

# 3. Monitor for 24 hours
# 4. Gather feedback
```

## Support Resources

### Documentation
- Unified Analytics System: `/docs/implementation/unified-analytics-system.md`
- Quick Start Guide: `/docs/implementation/quick-start-analytics-guide.md`
- API Reference: `/docs/api/analytics-endpoints.md`

### Monitoring
- System Health: `/dashboard/admin/system`
- Analytics Performance: `/dashboard/admin/analytics`
- Error Logs: Vercel Dashboard

### Troubleshooting
- No data showing: Check sensor connection and API auth
- Wrong occupancy: Verify line configuration
- Missing alerts: Check alert thresholds and notification settings

## Success Criteria

### Week 1
- [ ] All migrations deployed successfully
- [ ] Basic dashboard showing real data
- [ ] Occupancy tracking working
- [ ] Capture rate calculating correctly
- [ ] Basic alerts functioning

### Month 1
- [ ] Full analytics dashboard operational
- [ ] Journey tracking implemented
- [ ] Predictive analytics in beta
- [ ] Staff using system daily
- [ ] Measurable improvements in operations

### Quarter 1
- [ ] 15% improvement in capture rate
- [ ] 20% reduction in queue times
- [ ] 10% increase in conversion rate
- [ ] Full ROI documentation
- [ ] System expansion planning