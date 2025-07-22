# Database Schema Analysis Report

## Overview
This report analyzes the current state of the Supabase database, identifies missing migrations, duplications, and recommendations for cleanup.

## Current Database State

### Tables with Sensor Data

#### 1. **people_counting_raw** (145 records) ✅
- **Purpose**: Raw sensor data directly from sensors
- **Status**: ACTIVE - Receiving data from GitHub Actions every 30 minutes
- **Columns**: sensor_id, store_id, timestamp, line1_in/out, line2_in/out, line3_in/out, line4_in/out, total_in/out

#### 2. **people_counting_data** (137 records) ✅
- **Purpose**: Processed/cleaned sensor data
- **Status**: ACTIVE - Likely populated by trigger or processing job
- **Columns**: Similar to raw but with calculated totals

#### 3. **regional_counting_raw** (96 records) ❓
- **Purpose**: Unclear - has data but purpose not documented
- **Status**: Has data but not actively used

### Empty Tables That Should Have Data

#### 1. **hourly_analytics** (0 records) ⚠️
- **Purpose**: Aggregated hourly statistics
- **Issue**: No aggregation job running
- **Fix Needed**: Create aggregation function/trigger

#### 2. **regions** (0 records) ⚠️
- **Purpose**: Define store zones/areas
- **Issue**: Not configured
- **Fix Needed**: Define regions for stores

#### 3. **regional_analytics** (0 records) ⚠️
- **Purpose**: Analytics by region
- **Issue**: Depends on regions being defined
- **Fix Needed**: Configure regions first

### Missing Tables

#### 1. **profiles** ❌
- **Issue**: Migration exists (20250721_create_profiles_table.sql) but table not created
- **Impact**: Using 'user_profiles' instead - inconsistency

#### 2. **daily_analytics** ❌
- **Issue**: No migration file exists
- **Impact**: Cannot generate daily summaries

#### 3. **entrance_exit_analytics** ❌
- **Issue**: No migration file exists
- **Impact**: Cannot track entrance/exit specific metrics

#### 4. **occupancy_tracking** ❌
- **Issue**: No migration file exists
- **Impact**: Cannot track real-time occupancy

## Identified Issues

### 1. Duplicate/Redundant Tables
- **sensors** (empty) vs **sensor_metadata** (4 records)
  - Recommendation: Remove 'sensors' table, use only 'sensor_metadata'
- **profiles** (missing) vs **user_profiles** (1 record)
  - Recommendation: Use only 'user_profiles', remove profiles migration

### 2. Unused Tables
These tables exist but have no clear purpose or data:
- vca_alarm_status
- heatmap_temporal_raw
- customer_journeys
- queue_analytics
- regional_flow_matrix
- regional_occupancy_snapshots
- region_dwell_times
- region_entrance_exit_events
- region_configurations (except region_type_templates which has 4 records)

### 3. Migration Management
- No migration tracking table (schema_migrations) accessible
- Migrations were run manually via Supabase Dashboard
- Some migrations created duplicate tables

## Recommendations

### Immediate Actions

1. **Create missing migrations for critical tables**:
   ```sql
   -- Create daily_analytics table
   CREATE TABLE IF NOT EXISTS daily_analytics (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     store_id UUID REFERENCES stores(id),
     date DATE NOT NULL,
     total_visitors INTEGER DEFAULT 0,
     peak_hour INTEGER,
     peak_visitors INTEGER,
     avg_dwell_time INTEGER,
     created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
   );
   ```

2. **Create hourly aggregation function**:
   ```sql
   -- Function to aggregate hourly data
   CREATE OR REPLACE FUNCTION aggregate_hourly_analytics() 
   RETURNS void AS $$
   BEGIN
     -- Aggregate logic here
   END;
   $$ LANGUAGE plpgsql;
   ```

3. **Remove duplicate/unused tables**:
   ```sql
   DROP TABLE IF EXISTS sensors;
   -- Drop other unused regional tables if not needed
   ```

### Data Flow Architecture

Current working data flow:
1. GitHub Actions → people_counting_raw (every 30 minutes)
2. people_counting_raw → people_counting_data (processed)
3. people_counting_data → hourly_analytics (NOT WORKING - needs implementation)
4. hourly_analytics → daily_analytics (TABLE MISSING)

### Next Steps

1. **Fix Data Aggregation Pipeline**
   - Create hourly aggregation job
   - Create daily aggregation job
   - Set up PostgreSQL triggers or cron jobs

2. **Clean Up Schema**
   - Remove duplicate tables
   - Remove unused regional analytics tables (or document their purpose)
   - Consolidate sensor tables

3. **Configure Regions** (if needed)
   - Define store regions
   - Enable regional analytics

4. **Documentation**
   - Document each table's purpose
   - Create data flow diagram
   - Update CLAUDE.md with current schema

## Summary

The core data collection is working well with 145 records collected via GitHub Actions. The main issues are:
1. Missing aggregation pipeline (hourly/daily analytics)
2. Schema inconsistencies (duplicate tables)
3. Many unused tables from overly ambitious regional analytics system

Focus should be on getting the basic analytics pipeline working before implementing complex regional features.