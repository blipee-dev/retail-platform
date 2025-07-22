# Quick Start Analytics Guide

## Overview

This guide provides a practical, step-by-step approach to implementing the unified analytics system for any retail store using Milesight cameras.

## Initial Setup Checklist

### 1. Camera Configuration

#### Line Configuration
Based on your store layout, configure lines for different purposes:

```javascript
// Example: Standard Retail Store
const lineConfiguration = {
  line1: {
    purpose: "Main Entrance",
    direction: "bidirectional",
    counts: "Store entries/exits"
  },
  line2: {
    purpose: "Department Entry", 
    direction: "in",
    counts: "Department interest"
  },
  line3: {
    purpose: "Checkout Exit",
    direction: "out", 
    counts: "Confirmed purchases"
  },
  line4: {
    purpose: "Window/Passing",
    direction: "bidirectional",
    counts: "Passing traffic for capture rate"
  }
}
```

#### Region Configuration (When Available)
Configure regions in camera interface:

```javascript
// Example: 4-Region Layout
const regionConfiguration = {
  region1: {
    name: "Entrance/Decompression",
    type: "transition",
    alerts: { maxOccupancy: 30 }
  },
  region2: {
    name: "Main Shopping Floor",
    type: "browsing",
    alerts: { maxOccupancy: 100 }
  },
  region3: {
    name: "Checkout Queue",
    type: "queue", 
    alerts: { maxQueueLength: 10, maxWaitTime: 600 }
  },
  region4: {
    name: "Premium/Featured",
    type: "high-value",
    alerts: { unattendedTime: 300 }
  }
}
```

### 2. Key Metrics Configuration

Define what matters for your business:

```typescript
interface BusinessMetrics {
  // Traffic Metrics
  traffic: {
    primaryEntrance: 'line1',
    passingTraffic: 'line4',
    captureRateCalculation: true,
    peakHourAnalysis: true
  },
  
  // Conversion Metrics  
  conversion: {
    entryPoint: 'line1_in',
    exitPoint: 'line3_out',
    microConversions: ['region2_entry', 'region4_dwell>60s'],
    conversionWindow: 7200 // 2 hours
  },
  
  // Operational Metrics
  operational: {
    queueRegion: 'region3',
    staffingTriggers: {
      highTraffic: 50, // visitors/hour
      longQueue: 8,    // people
      highValue: 2     // unattended minutes
    }
  }
}
```

### 3. Quick Database Setup

Run these migrations in order:

```sql
-- 1. Basic people counting
CREATE TABLE people_counting_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    line1_in INTEGER DEFAULT 0,
    line1_out INTEGER DEFAULT 0,
    line2_in INTEGER DEFAULT 0,
    line2_out INTEGER DEFAULT 0,
    line3_in INTEGER DEFAULT 0,
    line3_out INTEGER DEFAULT 0,
    line4_in INTEGER DEFAULT 0,
    line4_out INTEGER DEFAULT 0,
    total_in INTEGER GENERATED ALWAYS AS (line1_in + line2_in + line3_in) STORED,
    total_out INTEGER GENERATED ALWAYS AS (line1_out + line2_out + line3_out) STORED,
    passing_traffic INTEGER GENERATED ALWAYS AS (line4_in + line4_out) STORED,
    capture_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN (line4_in + line4_out) > 0 
        THEN ((line1_in + line2_in + line3_in)::DECIMAL / (line4_in + line4_out)) * 100 
        ELSE 0 END
    ) STORED
);

-- 2. Hourly aggregates for performance
CREATE TABLE hourly_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL,
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    total_entries INTEGER,
    total_exits INTEGER,
    peak_occupancy INTEGER,
    avg_capture_rate DECIMAL(5,2),
    conversion_rate DECIMAL(5,2),
    UNIQUE(sensor_id, hour_start)
);

-- 3. Simple alert tracking
CREATE TABLE analytics_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL,
    alert_type VARCHAR(50),
    severity VARCHAR(20),
    triggered_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    resolved BOOLEAN DEFAULT false
);
```

## Implementation Phases

### Phase 1: Basic Tracking (Day 1)

Start collecting and displaying core metrics:

```typescript
// 1. Start data collection
const collector = new DataCollector({
  sensor: sensorConfig,
  interval: 300 // 5 minutes
});

collector.start();

// 2. Basic dashboard
const dashboard = {
  current: {
    occupancy: getCurrentOccupancy(),
    todayTraffic: getTodayTraffic(),
    captureRate: getCurrentCaptureRate()
  },
  charts: {
    hourlyTraffic: getHourlyTrafficChart(),
    occupancyTrend: getOccupancyTrend()
  }
};
```

### Phase 2: Insights & Alerts (Week 1)

Add intelligence to your data:

```typescript
// Alert rules
const alertRules = [
  {
    name: 'HighOccupancy',
    condition: (data) => data.occupancy > 0.8 * STORE_CAPACITY,
    action: 'Notify manager to open additional checkouts'
  },
  {
    name: 'LowCaptureRate',
    condition: (data) => data.captureRate < BASELINE_CAPTURE * 0.7,
    action: 'Check window displays and entrance visibility'
  },
  {
    name: 'QueueForming',
    condition: (data) => data.checkoutQueue > 5,
    action: 'Deploy additional staff to checkout'
  }
];

// Insights engine
const insights = analyzePatterns({
  peakHours: findPeakTrafficHours(),
  conversionByHour: calculateHourlyConversion(),
  captureRateFactors: analyzeCaptureRateVariation()
});
```

### Phase 3: Optimization (Week 2)

Use data to improve operations:

```typescript
// Staff scheduling optimization
const staffingPlan = optimizeStaffing({
  trafficPrediction: predictNextWeekTraffic(),
  conversionGoals: WEEKLY_CONVERSION_TARGET,
  constraints: AVAILABLE_STAFF_HOURS
});

// Layout optimization
const layoutSuggestions = analyzeCustomerFlow({
  commonPaths: findFrequentPaths(),
  bottlenecks: identifyCongestionPoints(),
  deadZones: findUnderutilizedAreas()
});

// Conversion optimization  
const conversionPlan = improveConversion({
  dropOffPoints: findWhereCustomersLeave(),
  highDwellLowConversion: findBrowsingWithoutBuying(),
  successfulPaths: analyzeConvertingJourneys()
});
```

## Practical Examples

### Example 1: Fashion Boutique

```javascript
// Configuration for small fashion store
const boutiqueConfig = {
  lines: {
    line1: "Store entrance",
    line2: "Fitting room entrance", 
    line3: "Checkout counter",
    line4: "Window shopping"
  },
  
  keyMetrics: [
    "Fitting room conversion rate",
    "Window to entrance conversion",
    "Average browsing time",
    "Peak shopping hours"
  ],
  
  alerts: [
    "Fitting room queue > 3",
    "No staff in premium section > 5 min",
    "Capture rate < 20%"
  ],
  
  dashboards: {
    owner: ["Daily revenue", "Conversion trends", "Staff performance"],
    manager: ["Current occupancy", "Staff deployment", "Queue status"],
    staff: ["Customer needs attention", "Queue forming", "Restock alerts"]
  }
};
```

### Example 2: Supermarket

```javascript
// Configuration for supermarket
const supermarketConfig = {
  lines: {
    line1: "Main entrance",
    line2: "Express lane entrance",
    line3: "All checkouts combined",
    line4: "Parking lot entrance"
  },
  
  keyMetrics: [
    "Checkout efficiency",
    "Peak hour management",
    "Express lane usage",
    "Cart abandonment rate"
  ],
  
  zones: {
    region1: "Produce section",
    region2: "Main aisles", 
    region3: "Checkout queues",
    region4: "Promotional displays"
  },
  
  automations: [
    {
      trigger: "Queue length > 5 at any checkout",
      action: "Open additional checkout lane"
    },
    {
      trigger: "Produce section traffic spike",
      action: "Deploy staff for restocking"
    }
  ]
};
```

### Example 3: Service Business

```javascript
// Configuration for service-oriented business
const serviceConfig = {
  lines: {
    line1: "Reception entrance",
    line2: "Service area entrance",
    line3: "Exit after service",
    line4: "Waiting area monitor"
  },
  
  keyMetrics: [
    "Wait time",
    "Service duration",
    "No-show rate",
    "Customer throughput"
  ],
  
  customerExperience: {
    waitTimeTarget: 600, // 10 minutes
    serviceTimeTarget: 1800, // 30 minutes
    satisfactionTracking: true
  }
};
```

## Common Patterns & Solutions

### Pattern 1: Morning Rush
```typescript
if (timeIs('09:00-10:00') && dayIs('weekday')) {
  recommendations.push({
    issue: "Morning rush congestion",
    solutions: [
      "Pre-open staff meeting at 8:45",
      "All checkouts operational by 9:00",
      "Express lane for <10 items",
      "Coffee station to slow entry flow"
    ]
  });
}
```

### Pattern 2: Lunch Hour Spike
```typescript
if (timeIs('12:00-13:00')) {
  recommendations.push({
    issue: "Lunch hour overcrowding",
    solutions: [
      "Staggered staff lunches",
      "Mobile checkout units",
      "Pre-order system promotion",
      "Queue entertainment"
    ]
  });
}
```

### Pattern 3: Weekend Patterns
```typescript
if (dayIs('weekend')) {
  patterns.push({
    characteristic: "Family shopping",
    implications: [
      "Longer dwell times",
      "Larger basket sizes",
      "Need for family facilities",
      "Different product focus"
    ],
    optimizations: [
      "Family parking priority",
      "Kids' activity zones",
      "Bulk purchase promotions",
      "Extended staff coverage"
    ]
  });
}
```

## Quick Wins

### Week 1 Achievements
1. **Know Your Peak Hours**: Identify exactly when you need more staff
2. **Understand Capture Rate**: See how effective your storefront is
3. **Monitor Real Occupancy**: Never guess how many people are in store
4. **Queue Alerts**: Get notified before customers get frustrated

### Month 1 Improvements
1. **Optimize Staff Schedule**: Right people at right time
2. **Improve Conversion**: Understand why browsers don't buy
3. **Reduce Queues**: Proactive checkout management
4. **Increase Capture**: Better window displays based on data

### Quarter 1 Transformations
1. **Predictive Operations**: Know what's coming before it happens
2. **Layout Optimization**: Data-driven merchandising
3. **Customer Journey**: Understand complete shopping patterns
4. **Revenue Growth**: Measurable improvement in key metrics

## Troubleshooting

### Common Issues

1. **Zero Counts on Lines**
   - Check camera angle covers full width
   - Verify line direction settings
   - Ensure proper lighting
   - Test with single person crossing

2. **Inaccurate Occupancy**
   - Calibrate entry/exit lines
   - Check for secondary entrances
   - Account for staff entries
   - Reset at store opening

3. **Missing Peak Traffic**
   - Increase data collection frequency
   - Check camera processing capacity
   - Verify network connectivity
   - Review timestamp settings

## Maintenance Schedule

### Daily
- Check dashboard for anomalies
- Verify all cameras online
- Review and acknowledge alerts
- Quick staff briefing on insights

### Weekly  
- Analyze conversion trends
- Review capture rate patterns
- Optimize staff schedule
- Update window displays based on data

### Monthly
- Deep dive analytics review
- Refine alert thresholds
- Update business rules
- ROI assessment

## Next Steps

1. **Start Simple**: Get basic counting working first
2. **Add Intelligence**: Layer on alerts and insights
3. **Drive Action**: Use data for daily decisions
4. **Measure Impact**: Track business improvements
5. **Expand Gradually**: Add more sophisticated analytics

Remember: The goal is not perfect data, but actionable insights that improve your business every day.