#!/usr/bin/env python3
"""Check if we're getting regional counting data"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_regional_data():
    """Check regional data collection status"""
    print("🗺️  Regional Counting Data Investigation")
    print("=" * 80)
    
    # 1. Check if regional tables exist
    print("\n1️⃣  Checking Regional Analytics Tables:")
    regional_tables = [
        'region_configurations',
        'region_entrance_exit_events', 
        'regional_occupancy_snapshots',
        'regional_analytics',
        'customer_journeys'
    ]
    
    existing_tables = []
    for table in regional_tables:
        response = requests.head(
            f"{SUPABASE_URL}/rest/v1/{table}?select=*",
            headers={**headers, 'Prefer': 'count=exact'}
        )
        
        if response.ok:
            count = int(response.headers.get('content-range', '0/0').split('/')[-1])
            print(f"  ✅ {table}: {count} records")
            existing_tables.append(table)
        else:
            print(f"  ❌ {table}: Table not found or error")
    
    # 2. Check raw sensor data for regional fields
    print("\n2️⃣  Checking Raw Sensor Data for Regional Fields:")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&limit=5&order=timestamp.desc",
        headers=headers
    )
    
    if response.ok and response.json():
        sample = response.json()[0]
        print("\n  Sample record fields:")
        regional_fields = ['region1_count', 'region2_count', 'region3_count', 'region4_count',
                          'region1_in', 'region1_out', 'region2_in', 'region2_out',
                          'region3_in', 'region3_out', 'region4_in', 'region4_out']
        
        found_regional = False
        for field in regional_fields:
            if field in sample:
                found_regional = True
                print(f"    ✅ {field}: {sample[field]}")
        
        if not found_regional:
            print("    ❌ No regional fields found in raw data")
            print("\n  Available fields:")
            for key in sorted(sample.keys()):
                if key not in ['id', 'created_at', 'updated_at']:
                    print(f"    - {key}")
    
    # 3. Check region configurations
    if 'region_configurations' in existing_tables:
        print("\n3️⃣  Checking Region Configurations:")
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/region_configurations?select=*",
            headers=headers
        )
        
        if response.ok:
            configs = response.json()
            if configs:
                print(f"  Found {len(configs)} region configurations")
                for config in configs[:3]:  # Show first 3
                    print(f"\n  Store: {config.get('store_id', 'Unknown')}")
                    print(f"  Region: {config.get('region_name', 'Unknown')}")
                    print(f"  Type: {config.get('region_type', 'Unknown')}")
            else:
                print("  ❌ No region configurations found")
    
    # 4. Check sensor configuration files
    print("\n4️⃣  Checking Sensor Configuration Files:")
    print("  Looking for regional configuration...")
    
    # 5. Analysis
    print("\n📋 Analysis:")
    if not existing_tables:
        print("  ❌ Regional analytics tables don't exist - need to run migrations")
    elif 'region_configurations' in existing_tables:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/region_configurations?select=*&limit=1",
            headers=headers
        )
        if not response.json():
            print("  ⚠️  Tables exist but no region configurations set up")
            print("  → Need to configure regions for stores")
    else:
        print("  ⚠️  Some tables missing - check migrations")
    
    print("\n💡 Possible Issues:")
    print("  1. Regional analytics tables might not be created")
    print("  2. Region configurations might not be set up")
    print("  3. Sensors might not be sending regional data")
    print("  4. Data collection might not be processing regional fields")
    
    # 6. Check what Milesight API actually returns
    print("\n5️⃣  Sensor API Format Check:")
    print("  Milesight sensors can provide:")
    print("  - Line counting (line1_in, line1_out, etc.) ✅ Currently collected")
    print("  - Regional counting (region1_count, etc.) ❓ Need to check if enabled")
    print("  - Heat map data ❓ Need to check if available")

if __name__ == "__main__":
    check_regional_data()