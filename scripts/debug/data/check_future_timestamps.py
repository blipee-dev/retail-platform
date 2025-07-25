#!/usr/bin/env python3
"""Check for future timestamps in the database"""

import requests
from datetime import datetime, timezone

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def check_timestamps():
    """Check for future timestamps"""
    print("🔍 Checking for future timestamps...")
    print(f"Current UTC time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print("=" * 60)
    
    # Get latest records
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp,sensor_id,created_at&order=timestamp.desc&limit=10",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        print("\n📊 Latest 10 timestamps in people_counting_raw:")
        
        now = datetime.now(timezone.utc)
        future_count = 0
        
        for record in data:
            timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
            created = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            
            time_diff = (timestamp - now).total_seconds()
            
            if time_diff > 0:
                print(f"\n⚠️  FUTURE timestamp: {record['timestamp']}")
                print(f"   Created at: {record['created_at']}")
                print(f"   Sensor: {record['sensor_id'][:8]}...")
                print(f"   Hours in future: {time_diff / 3600:.1f}")
                future_count += 1
            else:
                print(f"\n✅ Past timestamp: {record['timestamp']}")
                print(f"   Hours ago: {-time_diff / 3600:.1f}")
        
        print(f"\n\nSummary: {future_count} future timestamps out of {len(data)}")
        
        # Check timezone of sensors
        print("\n\n🌍 Checking sensor timezones...")
        
        # Get unique timestamps by hour
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp&order=timestamp.desc&limit=50",
            headers=headers
        )
        
        if response.ok:
            timestamps = [r['timestamp'] for r in response.json()]
            hours = set()
            
            for ts in timestamps:
                dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
                hours.add(dt.hour)
            
            print(f"Hours found in data: {sorted(hours)}")
            print("\nPossible explanations:")
            print("1. Sensors might be configured with wrong timezone")
            print("2. Sensor internal clock might be wrong")
            print("3. Data might include scheduled/test data")
            
            # Check if timestamps follow a pattern
            print("\n\n📅 Checking timestamp patterns...")
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp,sensor_id&timestamp=gte.{now.isoformat()}&order=timestamp",
                headers=headers
            )
            
            if response.ok and response.json():
                future_data = response.json()
                print(f"\nFound {len(future_data)} records with future timestamps")
                
                # Group by sensor
                by_sensor = {}
                for record in future_data:
                    sensor = record['sensor_id'][:8]
                    if sensor not in by_sensor:
                        by_sensor[sensor] = []
                    by_sensor[sensor].append(record['timestamp'])
                
                for sensor, timestamps in by_sensor.items():
                    print(f"\nSensor {sensor}... has {len(timestamps)} future timestamps")
                    if timestamps:
                        print(f"  Earliest: {timestamps[0]}")
                        print(f"  Latest: {timestamps[-1]}")

if __name__ == "__main__":
    check_timestamps()