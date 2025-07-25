#!/usr/bin/env python3
"""Check Supabase schema_migrations table"""

import requests
import json

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def check_table(table_name):
    """Get all records from a table"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&order=version.desc",
        headers=headers
    )
    
    if response.ok:
        return response.json()
    else:
        print(f"Error accessing {table_name}: {response.status_code}")
        return None

def main():
    print("🔍 Checking Supabase Migration History...")
    print("=" * 60)
    
    # Check schema_migrations table
    print("\n📋 schema_migrations table:")
    migrations = check_table("schema_migrations")
    if migrations:
        for m in migrations:
            print(f"   Version {m.get('version', '?')} - {m.get('inserted_at', '?')}")
    else:
        print("   ❌ Could not access schema_migrations table")
    
    # Check supabase_migrations table
    print("\n📋 supabase_migrations table:")
    migrations = check_table("supabase_migrations") 
    if migrations:
        for m in migrations:
            print(f"   {m.get('name', '?')} - {m.get('executed_at', '?')}")
    else:
        print("   ❌ Could not access supabase_migrations table")
    
    # Check if profiles table issue is due to auth schema
    print("\n🔍 Checking auth schema for profiles:")
    auth_profiles = check_table("auth.users")
    if auth_profiles is None:
        print("   ℹ️  Cannot access auth.users directly")
    
    # Check regional_counting_raw which has data
    print("\n📊 regional_counting_raw (96 records) - Sample data:")
    regional_data = check_table("regional_counting_raw")
    if regional_data and len(regional_data) > 0:
        sample = regional_data[0]
        print(f"   Columns: {', '.join(sample.keys())}")
        print(f"   Sample: sensor_id={sample.get('sensor_id', '?')[:8]}..., timestamp={sample.get('timestamp', '?')}")
    
    # Summary of findings
    print("\n" + "=" * 60)
    print("\n📊 KEY FINDINGS:")
    print("\n1. DUPLICATIONS:")
    print("   ⚠️  'sensors' vs 'sensor_metadata' - both exist, sensor_metadata is used")
    print("   ⚠️  'profiles' vs 'user_profiles' - profiles missing, user_profiles is used")
    
    print("\n2. MISSING TABLES:")
    print("   ❌ 'profiles' - migration exists but table not created")
    print("   ❌ 'daily_analytics' - no migration file exists")
    print("   ❌ 'entrance_exit_analytics' - no migration file exists") 
    print("   ❌ 'occupancy_tracking' - no migration file exists")
    
    print("\n3. EMPTY BUT IMPORTANT TABLES:")
    print("   ⚠️  'hourly_analytics' - needs aggregation job")
    print("   ⚠️  'regions' - needs to be configured for regional analytics")
    print("   ⚠️  'sensors' - redundant with sensor_metadata")
    
    print("\n4. TABLES WITH DATA:")
    print("   ✅ 'people_counting_raw' (145) - receiving data from GitHub Actions")
    print("   ✅ 'people_counting_data' (137) - processed version")
    print("   ✅ 'regional_counting_raw' (96) - has data but purpose unclear")
    print("   ✅ 'region_type_templates' (4) - has templates")

if __name__ == "__main__":
    main()