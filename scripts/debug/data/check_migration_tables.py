#!/usr/bin/env python3
"""Check all tables mentioned in migrations"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def check_table(table_name):
    """Check if table exists and get row count"""
    response = requests.head(
        f"{SUPABASE_URL}/rest/v1/{table_name}?select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    if response.ok:
        count = response.headers.get('content-range', '').split('/')[-1]
        return True, count
    return False, 0

def main():
    print("🔍 Checking all tables from migration files...")
    print("=" * 60)
    
    # All tables mentioned in migrations
    migration_tables = [
        # From core_schema.sql
        "organizations", "stores", "profiles",
        
        # From sensor_metadata_schema.sql
        "sensor_metadata", "regions",
        
        # From people_counting_base_schema.sql
        "people_counting_raw", "people_counting_data", "hourly_analytics",
        "regional_counts", "regional_counting_raw", "heatmap_temporal_raw",
        "vca_alarm_status", "analytics_alerts",
        
        # From regional_analytics_schema.sql
        "region_configurations", "region_type_templates", 
        "region_entrance_exit_events", "regional_occupancy_snapshots",
        "region_dwell_times", "customer_journeys", "queue_analytics",
        "regional_flow_matrix", "regional_alerts", "regional_analytics",
        
        # From add_missing_tables.sql
        # (duplicates already listed above)
        
        # Other tables we've seen
        "user_profiles", "sensors", "alert_rules"
    ]
    
    # Remove duplicates and sort
    migration_tables = sorted(set(migration_tables))
    
    existing_tables = []
    missing_tables = []
    empty_tables = []
    
    for table in migration_tables:
        exists, count = check_table(table)
        if exists:
            existing_tables.append(table)
            status = f"✅ {table:<30} ({count:>6} records)"
            if count == "0":
                empty_tables.append(table)
                status += " ⚠️  EMPTY"
            print(status)
        else:
            missing_tables.append(table)
            print(f"❌ {table:<30} NOT FOUND")
    
    # Summary
    print("\n" + "=" * 60)
    print(f"\n📊 SUMMARY:")
    print(f"✅ Existing tables: {len(existing_tables)}")
    print(f"❌ Missing tables: {len(missing_tables)}")
    print(f"⚠️  Empty tables: {len(empty_tables)}")
    
    if missing_tables:
        print(f"\n❌ Missing tables that should be created:")
        for table in missing_tables:
            print(f"   - {table}")
    
    if empty_tables:
        print(f"\n⚠️  Empty tables that might need configuration or data:")
        for table in empty_tables:
            if table not in ["analytics_alerts", "alert_rules", "regional_alerts", "vca_alarm_status"]:
                print(f"   - {table}")
    
    # Check for potential issues
    print(f"\n🔍 POTENTIAL ISSUES:")
    
    # Duplicate concepts
    if "sensors" in existing_tables and "sensor_metadata" in existing_tables:
        print("⚠️  Both 'sensors' and 'sensor_metadata' tables exist - possible duplication")
    
    if "profiles" in missing_tables and "user_profiles" in existing_tables:
        print("⚠️  'profiles' table missing but 'user_profiles' exists - possible naming inconsistency")
    
    # Missing critical tables
    critical_missing = ["profiles", "daily_analytics"]
    for table in critical_missing:
        if table in missing_tables:
            print(f"❌ Critical table '{table}' is missing")

if __name__ == "__main__":
    main()