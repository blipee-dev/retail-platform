# blipee OS Retail Intelligence - Database Setup Guide

This guide walks you through setting up the database for blipee OS Retail Intelligence using Supabase.

## Prerequisites

- A Supabase account (free tier works for development)
- Access to Supabase SQL editor
- Basic understanding of PostgreSQL

## Step 1: Create Supabase Project

1. **Sign up/Login** to [Supabase](https://supabase.com)

2. **Create a new project**:
   - Click "New Project"
   - Choose your organization
   - Project name: `blipee-retail-[environment]` (e.g., `blipee-retail-dev`)
   - Database password: Generate a strong password and save it
   - Region: Choose closest to your users
   - Pricing plan: Free tier for development, Pro for production

3. **Wait for setup** (usually 2-3 minutes)

4. **Save your credentials**:
   - Go to Settings → API
   - Copy these values:
     - Project URL
     - Anon/Public key
     - Service role key (keep this secret!)

## Step 2: Enable Required Extensions

In the SQL editor, run:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable performance monitoring (optional)
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

## Step 3: Run Migration Scripts

Run these migration files in order from `app/lib/migrations/`:

### 1. Core Schema (20250721_core_schema.sql)

This creates:
- User role enum
- Organizations table
- Stores table

```sql
-- Run the entire contents of 20250721_core_schema.sql
```

### 2. User Profiles (20250721_create_profiles_table.sql)

This creates:
- User profiles table with RBAC
- Trigger for automatic profile creation

```sql
-- Run the entire contents of 20250721_create_profiles_table.sql
```

### 3. Sensor Metadata (20250721_sensor_metadata_schema.sql)

This creates:
- Sensor configuration table
- Health monitoring fields

```sql
-- Run the entire contents of 20250721_sensor_metadata_schema.sql
```

### 4. People Counting (20250721_people_counting_base_schema.sql)

This creates:
- Raw people counting data table
- Indexes for performance

```sql
-- Run the entire contents of 20250721_people_counting_base_schema.sql
```

### 5. Regional Analytics (20250721_regional_analytics_schema.sql)

This creates:
- Regional counting raw data
- Region configurations

```sql
-- Run the entire contents of 20250721_regional_analytics_schema.sql
```

### 6. Analytics Tables (20250722_create_hourly_aggregation.sql)

This creates:
- Hourly analytics aggregation table
- Performance indexes

```sql
-- Run the entire contents of 20250722_create_hourly_aggregation.sql
```

### 7. Daily Analytics (20250722_create_daily_analytics.sql)

This creates:
- Daily analytics summary table
- Comparison fields

```sql
-- Run the entire contents of 20250722_create_daily_analytics.sql
```

## Step 4: Enable Row Level Security (RLS)

Run these commands to enable RLS on all tables:

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE people_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_counting_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE region_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
```

## Step 5: Create RLS Policies

### Organization Access Policy

```sql
-- Users can only see their organization
CREATE POLICY "Users see own organization"
ON organizations FOR ALL
USING (
    id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
);
```

### Store Access Policies

```sql
-- Tenant admins and regional managers see all org stores
CREATE POLICY "Admins see all stores"
ON stores FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid() 
        AND role IN ('tenant_admin', 'regional_manager')
    )
);

-- Store managers see assigned stores
CREATE POLICY "Managers see assigned stores"
ON stores FOR SELECT
USING (
    id = ANY(
        SELECT assigned_stores 
        FROM user_profiles 
        WHERE id = auth.uid()
    )
);
```

### Sensor Data Policies

```sql
-- Users see sensor data for their stores
CREATE POLICY "Users see store sensor data"
ON people_counting_raw FOR SELECT
USING (
    sensor_id IN (
        SELECT sensor_id 
        FROM sensor_metadata sm
        JOIN stores s ON sm.store_id = s.id
        WHERE s.organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    )
);
```

## Step 6: Create Initial Data

### 1. Create Test Organization

```sql
INSERT INTO organizations (name, slug, settings)
VALUES (
    'Demo Retail Company',
    'demo-retail',
    '{"currency": "USD", "language": "en"}'::jsonb
);
```

### 2. Create Test Store

```sql
INSERT INTO stores (organization_id, name, code, timezone)
VALUES (
    (SELECT id FROM organizations WHERE slug = 'demo-retail'),
    'Downtown Store',
    'DT001',
    'America/New_York'
);
```

### 3. Create Admin User

In Supabase Dashboard:
1. Go to Authentication → Users
2. Click "Invite User"
3. Enter email: `admin@demo.com`
4. After user confirms, run:

```sql
UPDATE user_profiles
SET 
    role = 'tenant_admin',
    organization_id = (SELECT id FROM organizations WHERE slug = 'demo-retail'),
    full_name = 'Demo Admin'
WHERE email = 'admin@demo.com';
```

## Step 7: Create Views and Functions

### Latest Sensor Data View

```sql
CREATE OR REPLACE VIEW latest_sensor_data AS
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
```

### Helper Functions

```sql
-- Get user's organization
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can access store
CREATE OR REPLACE FUNCTION can_access_store(store_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    user_org UUID;
    store_org UUID;
BEGIN
    -- Get user info
    SELECT role, organization_id INTO user_role, user_org
    FROM user_profiles
    WHERE id = auth.uid();
    
    -- Get store org
    SELECT organization_id INTO store_org
    FROM stores
    WHERE id = store_id;
    
    -- Check access
    IF user_org != store_org THEN
        RETURN FALSE;
    END IF;
    
    IF user_role IN ('tenant_admin', 'regional_manager', 'analyst') THEN
        RETURN TRUE;
    END IF;
    
    -- Check if store is assigned
    RETURN store_id = ANY(
        SELECT assigned_stores 
        FROM user_profiles 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 8: Configure Realtime (Optional)

Enable realtime for specific tables:

```sql
-- Enable realtime for sensor status updates
ALTER PUBLICATION supabase_realtime ADD TABLE sensor_metadata;

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
```

## Step 9: Set Up Backups

In Supabase Dashboard:
1. Go to Settings → Backups
2. Enable Point-in-Time Recovery (Pro plan)
3. Configure backup retention (7-30 days)

## Step 10: Performance Optimization

### Create Indexes

```sql
-- Optimize people counting queries
CREATE INDEX idx_pcr_sensor_date 
ON people_counting_raw(sensor_id, timestamp DESC);

-- Optimize analytics queries
CREATE INDEX idx_ha_store_date 
ON hourly_analytics(store_id, start_time DESC);

CREATE INDEX idx_da_store_date 
ON daily_analytics(store_id, date DESC);

-- Optimize sensor status queries
CREATE INDEX idx_sm_org_online 
ON sensor_metadata(organization_id, is_online);
```

### Analyze Tables

```sql
-- Update table statistics
ANALYZE people_counting_raw;
ANALYZE hourly_analytics;
ANALYZE daily_analytics;
```

## Verification Steps

Run these queries to verify your setup:

### 1. Check Tables

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: 11 tables

### 2. Check RLS Status

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT LIKE 'pg_%';
```

Expected: All tables show `rowsecurity = true`

### 3. Check Extensions

```sql
SELECT extname 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');
```

Expected: Both extensions listed

## Troubleshooting

### Common Issues

1. **"permission denied for schema public"**
   - Run as postgres user in Supabase SQL editor
   - Check you're in the correct project

2. **"relation does not exist"**
   - Ensure migrations run in correct order
   - Check for typos in table names

3. **RLS blocking access**
   - Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```
   - Remember to re-enable after testing!

4. **Slow queries**
   - Run `EXPLAIN ANALYZE` on slow queries
   - Check indexes are being used
   - Consider adding more specific indexes

## Next Steps

1. **Configure environment variables** in your application
2. **Test authentication** with the created admin user
3. **Set up sensor configurations** for your devices
4. **Configure GitHub Actions** for automated data collection

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Database Schema**: [Database Schema Documentation](../architecture/database-schema.md)
- **Discord**: Join our Discord for help
- **Email**: support@blipee.com

---

**Last Updated**: 2025-07-26  
**Version**: 1.0  
**Maintained By**: blipee Engineering Team