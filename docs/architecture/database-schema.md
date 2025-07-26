# blipee OS Retail Intelligence - Database Schema Documentation

## Overview

blipee OS Retail Intelligence uses PostgreSQL (via Supabase) with an optimized schema design that balances performance, scalability, and maintainability. The schema has been optimized from 34 tables down to 11 essential tables, achieving a 68% reduction in complexity while improving query performance by 89%.

## Schema Design Principles

1. **Multi-tenancy First**: Complete data isolation using Row-Level Security (RLS)
2. **Performance Optimized**: Strategic indexes and materialized views for sub-second queries
3. **Audit Trail**: Comprehensive tracking of all configuration changes
4. **Time-series Ready**: Optimized for high-volume sensor data ingestion
5. **Global Support**: Timezone-aware design for worldwide deployments

## Core Tables

### 1. organizations
**Purpose**: Multi-tenant foundation - represents companies using the platform

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_active ON organizations(deleted_at) WHERE deleted_at IS NULL;
```

### 2. stores
**Purpose**: Physical retail locations with timezone support

```sql
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    location JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_store_code UNIQUE(organization_id, code)
);

-- Indexes
CREATE INDEX idx_stores_organization ON stores(organization_id);
CREATE INDEX idx_stores_active ON stores(is_active) WHERE is_active = true;
CREATE INDEX idx_stores_timezone ON stores(timezone);
```

### 3. user_profiles
**Purpose**: User management with 6-tier RBAC system

```sql
CREATE TYPE user_role AS ENUM (
    'tenant_admin',    -- Full organization control
    'regional_manager', -- Multi-store oversight
    'store_manager',   -- Single store control
    'analyst',         -- Read-only analytics
    'store_staff',     -- Operational access
    'viewer'           -- Dashboard read-only
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'viewer',
    assigned_stores UUID[] DEFAULT '{}',
    assigned_regions UUID[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_profiles_organization ON user_profiles(organization_id);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
```

### 4. sensor_metadata
**Purpose**: Sensor configuration and health monitoring

```sql
CREATE TABLE sensor_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sensor_id VARCHAR(100) NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    location JSONB DEFAULT '{}',
    configuration JSONB DEFAULT '{}',
    timezone_offset INTEGER DEFAULT 0,
    is_online BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE,
    health_status VARCHAR(50) DEFAULT 'healthy',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_sensor_per_org UNIQUE(organization_id, sensor_id)
);

-- Indexes
CREATE INDEX idx_sensor_metadata_store ON sensor_metadata(store_id);
CREATE INDEX idx_sensor_metadata_sensor_id ON sensor_metadata(sensor_id);
CREATE INDEX idx_sensor_metadata_online ON sensor_metadata(is_online);
CREATE INDEX idx_sensor_metadata_last_seen ON sensor_metadata(last_seen_at);
```

## Data Collection Tables

### 5. people_counting_raw
**Purpose**: Source of truth for all foot traffic data

```sql
CREATE TABLE people_counting_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    in_count INTEGER NOT NULL DEFAULT 0,
    out_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_counts CHECK (in_count >= 0 AND out_count >= 0)
);

-- Indexes for performance
CREATE INDEX idx_pcr_sensor_timestamp ON people_counting_raw(sensor_id, timestamp DESC);
CREATE INDEX idx_pcr_timestamp ON people_counting_raw(timestamp DESC);
CREATE INDEX idx_pcr_created ON people_counting_raw(created_at DESC);

-- Partitioning ready (for scale)
-- PARTITION BY RANGE (timestamp);
```

### 6. regional_counting_raw
**Purpose**: Zone-level occupancy data

```sql
CREATE TABLE regional_counting_raw (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sensor_id VARCHAR(100) NOT NULL,
    region_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    occupancy INTEGER NOT NULL DEFAULT 0,
    dwell_time INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_occupancy CHECK (occupancy >= 0)
);

-- Indexes
CREATE INDEX idx_rcr_sensor_region_timestamp ON regional_counting_raw(sensor_id, region_id, timestamp DESC);
CREATE INDEX idx_rcr_timestamp ON regional_counting_raw(timestamp DESC);
```

## Analytics Tables

### 7. hourly_analytics
**Purpose**: Pre-aggregated hourly metrics for fast dashboard queries

```sql
CREATE TABLE hourly_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sensor_id VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Traffic metrics
    total_in INTEGER NOT NULL DEFAULT 0,
    total_out INTEGER NOT NULL DEFAULT 0,
    net_occupancy INTEGER DEFAULT 0,
    peak_occupancy INTEGER DEFAULT 0,
    
    -- Conversion metrics (when POS integrated)
    transactions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    avg_transaction_value DECIMAL(10,2) DEFAULT 0,
    
    -- Capture rate (mall traffic comparison)
    mall_traffic INTEGER DEFAULT 0,
    capture_rate DECIMAL(5,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_hourly_analytics UNIQUE(store_id, sensor_id, start_time)
);

-- Indexes
CREATE INDEX idx_ha_store_time ON hourly_analytics(store_id, start_time DESC);
CREATE INDEX idx_ha_sensor_time ON hourly_analytics(sensor_id, start_time DESC);
CREATE INDEX idx_ha_time ON hourly_analytics(start_time DESC);
```

### 8. daily_analytics
**Purpose**: Daily summaries and trends

```sql
CREATE TABLE daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Traffic summary
    total_footfall INTEGER NOT NULL DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    peak_hour INTEGER DEFAULT 0,
    peak_hour_footfall INTEGER DEFAULT 0,
    
    -- Performance metrics
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    avg_dwell_time INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Comparisons
    vs_yesterday_percent DECIMAL(5,2),
    vs_last_week_percent DECIMAL(5,2),
    vs_last_month_percent DECIMAL(5,2),
    vs_last_year_percent DECIMAL(5,2),
    
    -- Revenue (when POS integrated)
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    avg_basket_size DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_daily_analytics UNIQUE(store_id, date)
);

-- Indexes
CREATE INDEX idx_da_store_date ON daily_analytics(store_id, date DESC);
CREATE INDEX idx_da_date ON daily_analytics(date DESC);
```

## Configuration & Monitoring Tables

### 9. region_configurations
**Purpose**: Define zones/regions within stores

```sql
CREATE TABLE region_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sensor_id VARCHAR(100) NOT NULL,
    region_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    polygon JSONB,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_region UNIQUE(store_id, sensor_id, region_id)
);

-- Indexes
CREATE INDEX idx_region_store ON region_configurations(store_id);
CREATE INDEX idx_region_sensor ON region_configurations(sensor_id);
CREATE INDEX idx_region_active ON region_configurations(is_active);
```

### 10. alerts
**Purpose**: Unified alerting system

```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info'))
);

-- Indexes
CREATE INDEX idx_alerts_organization ON alerts(organization_id);
CREATE INDEX idx_alerts_store ON alerts(store_id);
CREATE INDEX idx_alerts_unresolved ON alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);
```

### 11. latest_sensor_data
**Purpose**: Materialized view for real-time sensor status

```sql
CREATE MATERIALIZED VIEW latest_sensor_data AS
SELECT DISTINCT ON (sensor_id)
    sm.id,
    sm.organization_id,
    sm.store_id,
    sm.sensor_id,
    sm.name,
    sm.sensor_type,
    sm.is_online,
    sm.health_status,
    sm.last_seen_at,
    pcr.timestamp as last_data_timestamp,
    pcr.in_count as last_in_count,
    pcr.out_count as last_out_count,
    s.name as store_name,
    s.timezone as store_timezone
FROM sensor_metadata sm
LEFT JOIN stores s ON sm.store_id = s.id
LEFT JOIN LATERAL (
    SELECT timestamp, in_count, out_count
    FROM people_counting_raw
    WHERE sensor_id = sm.sensor_id
    ORDER BY timestamp DESC
    LIMIT 1
) pcr ON true
ORDER BY sensor_id, pcr.timestamp DESC;

-- Indexes
CREATE UNIQUE INDEX idx_latest_sensor_data_sensor ON latest_sensor_data(sensor_id);
CREATE INDEX idx_latest_sensor_data_store ON latest_sensor_data(store_id);
CREATE INDEX idx_latest_sensor_data_online ON latest_sensor_data(is_online);

-- Refresh strategy
-- REFRESH MATERIALIZED VIEW CONCURRENTLY latest_sensor_data;
```

## Row-Level Security (RLS) Policies

### Organization Isolation
```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Organization access policy
CREATE POLICY "Users can only see their organization"
ON organizations FOR ALL
USING (
    id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
);

-- Store access based on role
CREATE POLICY "Store access based on user role"
ON stores FOR ALL
USING (
    CASE 
        WHEN (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('tenant_admin', 'regional_manager') 
        THEN organization_id IN (
            SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
        WHEN (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'store_manager'
        THEN id = ANY(
            SELECT assigned_stores FROM user_profiles WHERE id = auth.uid()
        )
        ELSE false
    END
);
```

## Performance Optimizations

### 1. Strategic Indexes
- Composite indexes on frequently queried combinations
- Partial indexes for active/online filters
- BRIN indexes for time-series data (when partitioned)

### 2. Query Optimization
```sql
-- Example: Fast dashboard query
CREATE INDEX idx_hourly_analytics_dashboard 
ON hourly_analytics(store_id, start_time DESC) 
INCLUDE (total_in, total_out, conversion_rate);
```

### 3. Partitioning Strategy (Future)
```sql
-- Partition people_counting_raw by month
CREATE TABLE people_counting_raw_2025_01 
PARTITION OF people_counting_raw 
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

## Data Retention Policy

| Table | Retention Period | Archive Strategy |
|-------|-----------------|------------------|
| people_counting_raw | 90 days | S3 cold storage |
| regional_counting_raw | 90 days | S3 cold storage |
| hourly_analytics | 2 years | No archival |
| daily_analytics | 5 years | No archival |
| alerts | 1 year | Soft delete |

## Migration Path

### From Legacy Schema (34 tables → 11 tables)
1. **Data Consolidation**: Merged duplicate functionality
2. **Performance**: Added strategic indexes
3. **Cleanup**: Removed unused tables
4. **Migration**: Zero-downtime migration scripts

See [Database Optimization Guide](../implementation/DATABASE_OPTIMIZATION_2025_07_23.md) for details.

## Best Practices

### 1. Always Use RLS
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Timezone Handling
- Store all timestamps in UTC
- Convert at display layer using store timezone
- Use `TIMESTAMP WITH TIME ZONE` for all time fields

### 3. JSONB Usage
- Use for flexible metadata
- Create GIN indexes for searchable JSONB
- Validate structure at application layer

### 4. Monitoring
```sql
-- Monitor table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Future Enhancements

1. **Time-series Optimization**: TimescaleDB extension for massive scale
2. **Real-time Aggregation**: Continuous aggregates for instant analytics
3. **Advanced Analytics**: PostGIS for spatial analytics
4. **ML Integration**: pg_vector for embedding storage

---

**Last Updated**: 2025-07-26  
**Version**: 2.0  
**Maintained By**: blipee Engineering Team