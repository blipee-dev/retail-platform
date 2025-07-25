#!/usr/bin/env python3
"""Collect current hour data with upsert"""

import requests
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Ffcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal,resolution=merge-duplicates'  # This enables UPSERT
}

def collect_current_hour():
    """Collect current hour data"""
    print("🔄 Collecting Current Hour Data")
    print("=" * 80)
    
    now = datetime.utcnow()
    current_hour = now.replace(minute=0, second=0, microsecond=0)
    
    print(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print(f"Collecting data for: {current_hour.strftime('%Y-%m-%d %H:00')} hour")
    
    # Get sensors
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
    )
    
    if not response.ok:
        print(f"❌ Failed to get sensors: {response.status_code}")
        return
        
    sensors = response.json()
    omnia_sensors = [s for s in sensors if 'OML' in s['sensor_name']]
    
    # For demonstration, manually insert current hour data
    # In production, this would come from the sensor API
    test_data = {
        "OML01-PC": {"in": 306, "out": 96},
        "OML02-PC": {"in": 250, "out": 80},
        "OML03-PC": {"in": 180, "out": 60}
    }
    
    for sensor in omnia_sensors:
        if sensor['sensor_name'] in test_data:
            counts = test_data[sensor['sensor_name']]
            
            record = {
                "sensor_id": sensor['id'],
                "organization_id": sensor['organization_id'],
                "store_id": sensor['store_id'],
                "timestamp": current_hour.isoformat() + "Z",
                "end_time": now.isoformat() + "Z",  # Current time as end
                "line1_in": counts["in"],
                "line1_out": counts["out"],
                "line2_in": 0,
                "line2_out": 0,
                "line3_in": 0,
                "line3_out": 0,
                "line4_in": 0,
                "line4_out": 0
            }
            
            print(f"\n📡 {sensor['sensor_name']}:")
            print(f"  Upserting: {counts['in']} IN, {counts['out']} OUT")
            
            # UPSERT - will insert or update
            upsert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw",
                json=record,
                headers=headers
            )
            
            if upsert_response.ok:
                print(f"  ✅ Success!")
            else:
                print(f"  ❌ Failed: {upsert_response.status_code}")
                print(f"     {upsert_response.text}")
    
    # Show current data
    print("\n\n📊 Current Hour Data:")
    current_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=eq.{current_hour.isoformat()}Z&select=sensor_id,timestamp,total_in,total_out,updated_at",
        headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
    )
    
    if current_response.ok:
        data = current_response.json()
        for record in data:
            print(f"  {record['sensor_id'][:8]}: {record['total_in']} IN, {record['total_out']} OUT (updated: {record.get('updated_at', 'N/A')})")

if __name__ == "__main__":
    collect_current_hour()