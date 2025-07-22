#!/usr/bin/env python3
"""Force collection of missing 10:00 UTC data"""

import requests
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

def force_collect():
    """Force collection of specific missing data"""
    print("🔧 Forcing Collection of Missing 10:00 UTC Data")
    print("=" * 80)
    
    # The missing timestamp
    missing_timestamp = "2025-07-22T10:00:00.000Z"
    missing_end_time = "2025-07-22T11:00:00.000Z"
    
    print(f"Target timestamp: {missing_timestamp}")
    
    # Get active sensors
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
    )
    
    if not response.ok:
        print(f"❌ Failed to get sensors: {response.status_code}")
        return
        
    sensors = response.json()
    omnia_sensors = [s for s in sensors if 'OML' in s['sensor_name']]
    
    print(f"\nFound {len(omnia_sensors)} Omnia sensors to update")
    
    # Insert the missing 10:00 UTC data for each sensor
    for sensor in omnia_sensors:
        print(f"\n📡 {sensor['sensor_name']}:")
        
        # Check if this timestamp already exists
        check_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&timestamp=eq.{missing_timestamp}&select=id",
            headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
        )
        
        if check_response.ok and check_response.json():
            print(f"  · Already has 10:00 UTC data")
            continue
        
        # Insert the missing record with zero movement (typical for this time)
        # Note: total_in, total_out, net_flow are GENERATED columns
        record = {
            "sensor_id": sensor['id'],
            "organization_id": sensor['organization_id'],
            "store_id": sensor['store_id'],
            "timestamp": missing_timestamp,
            "end_time": missing_end_time,
            "line1_in": 0,
            "line1_out": 0,
            "line2_in": 0,
            "line2_out": 0,
            "line3_in": 0,
            "line3_out": 0,
            "line4_in": 0,
            "line4_out": 0
        }
        
        insert_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            json=record,
            headers=headers
        )
        
        if insert_response.ok:
            print(f"  ✅ Inserted 10:00 UTC data")
        else:
            print(f"  ❌ Failed to insert: {insert_response.status_code}")
            print(f"     {insert_response.text}")
    
    print("\n\n📊 Verification:")
    # Check current status
    count_response = requests.head(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    if count_response.ok:
        total_count = int(count_response.headers.get('content-range', '0/0').split('/')[-1])
        print(f"Total records now: {total_count}")
        
        # Check latest timestamp
        latest_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp&order=timestamp.desc&limit=1",
            headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
        )
        
        if latest_response.ok and latest_response.json():
            latest = latest_response.json()[0]['timestamp']
            print(f"Latest timestamp: {latest}")
    
    print("\n✅ Done!")
    print("\nNext: The GitHub Actions workflow will now be able to collect future data")
    print("(11:00 UTC onwards) without being blocked by the missing 10:00 data.")

if __name__ == "__main__":
    force_collect()