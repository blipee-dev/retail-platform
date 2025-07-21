# Deployment & Testing Plan

## 🚀 Step-by-Step Deployment Guide

### Phase 1: Database Setup (Day 1)

#### 1.1 Run Auth Migrations
```bash
# Order matters! Run in sequence:
1. 20240120000001_create_user_roles_enum.sql
2. 20240120000002_create_organizations_table.sql
3. 20240120000003_create_user_profiles_table.sql
4. 20240120000004_create_store_hierarchy_tables.sql
5. 20240120000005_create_helper_functions.sql
6. 20240120000006_create_rls_policies.sql
```

#### 1.2 Run Sensor Migrations
```bash
7. 20240120000007_create_sensor_tables.sql
```

#### 1.3 Load Test Data (Optional)
```bash
# Run seed.sql for demo organizations and stores
```

### Phase 2: Authentication Testing (Day 1-2)

#### 2.1 Test Organization Creation
1. **Navigate to**: `/auth/signup`
2. **Test cases**:
   - ✅ Create new organization "Test Retail Co" 
   - ✅ Auto-generate slug "test-retail-co"
   - ✅ Verify tenant admin role assigned
   - ✅ Check organization isolation

#### 2.2 Test Role-Based Access
Create test users for each role:

| Email | Password | Role | Expected Dashboard |
|-------|----------|------|-------------------|
| admin@test.com | Test123! | Tenant Admin | /dashboard/admin |
| regional@test.com | Test123! | Regional Manager | /dashboard/regional |
| store@test.com | Test123! | Store Manager | /dashboard/store |
| analyst@test.com | Test123! | Analyst | /dashboard/analytics |
| staff@test.com | Test123! | Store Staff | /dashboard/staff |
| viewer@test.com | Test123! | Viewer | /dashboard/view |

#### 2.3 Test Multi-Tenancy
1. Create second organization "Demo Corp"
2. Verify complete data isolation
3. Test cross-tenant access (should fail)

### Phase 3: Sensor Integration (Day 2-3)

#### 3.1 Connect Milesight Sensor
```javascript
// Test sensor configuration
{
  sensor_name: "TEST-MS-001",
  sensor_ip: "93.108.96.96",
  sensor_port: 21001,
  store_id: "[store-uuid]",
  config: {
    username: "root",
    password: "[encrypted]",
    endpoints: {
      people_counting: "/dataloader.cgi?dw=vcalogcsv",
      regional_counting: "/dataloader.cgi?dw=regionalcountlogcsv",
      heatmap: "/dataloader.cgi?dw=heatmapcsv"
    }
  }
}
```

#### 3.2 Test Data Collection
1. **Manual API Test**:
   ```bash
   curl -u root:password \
     "http://93.108.96.96:21001/dataloader.cgi?dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3&time_start=2025-07-20-00:00:00&time_end=2025-07-20-01:00:00"
   ```

2. **Verify Database Storage**:
   ```sql
   SELECT * FROM people_counting_raw 
   WHERE sensor_id = '[sensor-uuid]' 
   ORDER BY timestamp DESC 
   LIMIT 10;
   ```

### Phase 4: Dashboard Integration (Day 3-4)

#### 4.1 Real-Time Data Display
- [ ] Test WebSocket connection
- [ ] Verify live count updates
- [ ] Check occupancy calculations
- [ ] Test alert triggering

#### 4.2 Analytics Features
- [ ] Hourly aggregations working
- [ ] Daily summaries generating
- [ ] Heat maps rendering
- [ ] Export functionality

### Phase 5: Performance Testing (Day 4)

#### 5.1 Load Testing
```javascript
// Simulate high-volume sensor data
- 100 sensors
- 1 data point per minute
- 144,000 records per day
```

#### 5.2 Query Performance
- [ ] Dashboard load time < 2s
- [ ] Real-time updates < 100ms
- [ ] Report generation < 5s

## 🧪 Test Checklist

### Authentication & Multi-Tenancy
- [ ] Organization signup flow
- [ ] User invitation system
- [ ] Role-based redirects
- [ ] Protected routes
- [ ] Data isolation (RLS)
- [ ] Session management
- [ ] Password reset flow

### Sensor Integration
- [ ] Milesight API connectivity
- [ ] Data collection pipeline
- [ ] Error handling
- [ ] Retry mechanism
- [ ] Data validation
- [ ] Timezone handling

### Dashboard Features
- [ ] Role-specific views
- [ ] Real-time updates
- [ ] Historical data
- [ ] Charts and graphs
- [ ] Heat map visualization
- [ ] Export functionality
- [ ] Mobile responsiveness

### Internationalization
- [ ] Language switching
- [ ] Translation completeness
- [ ] Date/time formatting
- [ ] Number formatting

### Security
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] API rate limiting
- [ ] Audit logging

## 🚨 Common Issues & Solutions

### Issue 1: RLS Policies Blocking Access
```sql
-- Debug RLS issues
SET ROLE postgres; -- Bypass RLS for debugging
SELECT * FROM organizations;
```

### Issue 2: Sensor Connection Timeout
```javascript
// Add timeout and retry
const fetchWithRetry = async (url, options, retries = 3) => {
  // Implementation
}
```

### Issue 3: Performance Degradation
```sql
-- Check missing indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## 📊 Success Metrics

1. **Authentication**: 100% role-based access working
2. **Multi-tenancy**: Zero data leakage between tenants
3. **Sensor Data**: 99%+ data collection success rate
4. **Performance**: <2s page load, <100ms real-time updates
5. **Uptime**: 99.9% availability

## 🎯 Go-Live Checklist

- [ ] All migrations run successfully
- [ ] Test users created and verified
- [ ] Sensor connections established
- [ ] Data flowing into dashboards
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Team training done

## Next Steps

1. **Monitor**: Set up monitoring for errors and performance
2. **Iterate**: Gather user feedback and improve
3. **Scale**: Add more sensors and stores
4. **Enhance**: Build advanced analytics features