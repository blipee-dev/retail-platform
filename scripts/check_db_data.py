#!/usr/bin/env python3
"""Check what data is in the Supabase database"""

import os
import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

def check_database():
    headers = {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
    }
    
    print("🔍 Checking Supabase database...")
    print("=" * 50)
    
    # Check sensor_metadata table
    print("\n📡 Active Sensors:")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers=headers
    )
    
    if response.ok:
        sensors = response.json()
        print(f"Found {len(sensors)} active sensors:")
        for sensor in sensors:
            print(f"  - {sensor['sensor_name']} ({sensor['sensor_ip']}:{sensor['sensor_port']})")
    else:
        print(f"Error fetching sensors: {response.status_code}")
    
    # Check people_counting_raw table
    print("\n📊 Recent Data in people_counting_raw:")
    
    # Get count
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&limit=10&order=timestamp.desc",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        print(f"Found {len(data)} recent records")
        
        if data:
            print("\nLatest records:")
            for record in data[:5]:
                print(f"  - {record['timestamp']}: Sensor {record['sensor_id'][:8]}... - Lines: {record['line1_in']}/{record['line1_out']}")
    else:
        print(f"Error fetching data: {response.status_code}")
    
    # Get total count
    response = requests.head(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    if response.ok:
        count = response.headers.get('content-range', '').split('/')[-1]
        print(f"\nTotal records in database: {count}")
    
    # Check data from last 24 hours
    yesterday = (datetime.now() - timedelta(days=1)).isoformat()
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.{yesterday}&select=sensor_id",
        headers=headers
    )
    
    if response.ok:
        recent_data = response.json()
        print(f"\nRecords from last 24 hours: {len(recent_data)}")
        
        # Count by sensor
        sensor_counts = {}
        for record in recent_data:
            sensor_id = record['sensor_id']
            sensor_counts[sensor_id] = sensor_counts.get(sensor_id, 0) + 1
        
        if sensor_counts:
            print("\nBy sensor:")
            for sensor_id, count in sensor_counts.items():
                print(f"  - {sensor_id[:8]}...: {count} records")

if __name__ == "__main__":
    check_database()