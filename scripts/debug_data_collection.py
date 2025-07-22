#!/usr/bin/env python3
"""Debug why data isn't being inserted"""

import requests
from datetime import datetime, timedelta
import base64

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def check_sensor_data():
    """Check what's happening with sensor data"""
    print("🔍 Debugging sensor data collection...")
    print("=" * 50)
    
    # 1. Check if we have any data at all
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&limit=1&order=timestamp.desc",
        headers=headers
    )
    
    if response.ok and response.json():
        latest = response.json()[0]
        print(f"\n✅ Latest record in database:")
        print(f"   Timestamp: {latest['timestamp']}")
        print(f"   Sensor: {latest['sensor_id']}")
    else:
        print("\n❌ No data in people_counting_raw table!")
    
    # 2. Test one sensor directly
    print("\n📡 Testing Omnia Guimarães sensor directly...")
    
    now = datetime.now()
    two_hours_ago = now - timedelta(hours=2)
    
    # Format dates
    time_start = two_hours_ago.strftime("%Y-%m-%d-%H:%M:%S")
    time_end = now.strftime("%Y-%m-%d-%H:%M:%S")
    
    url = "http://93.108.96.96:21001/dataloader.cgi"
    params = {
        'dw': 'vcalogcsv',
        'report_type': '0',
        'statistics_type': '3',
        'linetype': '31',
        'time_start': time_start,
        'time_end': time_end
    }
    
    auth_string = base64.b64encode(b"admin:grnl.2024").decode('utf-8')
    sensor_headers = {
        'Authorization': f'Basic {auth_string}'
    }
    
    try:
        response = requests.get(url, params=params, headers=sensor_headers, timeout=30)
        if response.ok:
            lines = response.text.strip().split('\n')
            print(f"   ✅ Got {len(lines)-1} data rows")
            
            # Show sample data
            if len(lines) > 1:
                print("\n   Sample data rows:")
                for line in lines[1:4]:  # Show first 3 data rows
                    parts = line.split(',')
                    if len(parts) >= 17:
                        timestamp = parts[0]
                        total = sum(int(parts[i]) if parts[i].strip().isdigit() else 0 
                                  for i in [5,6,8,9,11,12,14,15])
                        print(f"   - {timestamp}: Total movements = {total}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 3. Check sensor metadata
    print("\n📊 Checking sensor metadata...")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?select=id,sensor_name,organization_id,store_id",
        headers=headers
    )
    
    if response.ok:
        sensors = response.json()
        print(f"   Found {len(sensors)} sensors:")
        for sensor in sensors:
            print(f"   - {sensor['sensor_name']}: ID={sensor['id'][:8]}...")
    
    # 4. Test inserting a single record
    print("\n🧪 Testing data insertion...")
    
    # Get first sensor
    if sensors:
        test_sensor = sensors[0]
        test_time = datetime.now() - timedelta(minutes=5)
        
        test_record = {
            "sensor_id": test_sensor['id'],
            "organization_id": test_sensor['organization_id'],
            "store_id": test_sensor['store_id'],
            "timestamp": test_time.isoformat(),
            "end_time": test_time.isoformat(),
            "line1_in": 5,
            "line1_out": 3,
            "line2_in": 2,
            "line2_out": 1,
            "line3_in": 0,
            "line3_out": 0,
            "line4_in": 10,
            "line4_out": 8
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            headers=headers,
            json=test_record
        )
        
        if response.ok:
            print("   ✅ Test record inserted successfully!")
        else:
            print(f"   ❌ Insert failed: {response.status_code}")
            print(f"   Response: {response.text}")

if __name__ == "__main__":
    check_sensor_data()