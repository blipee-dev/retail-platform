#!/usr/bin/env python3
"""Check for future data in the database"""

import requests
from datetime import datetime, timezone

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Zfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_future_data():
    """Check for data with timestamps in the future"""
    print("🔍 Checking for Future Data")
    print("=" * 80)
    
    # Get current UTC time
    now_utc = datetime.now(timezone.utc)
    print(f"Current UTC time: {now_utc.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Current local time (UTC+1): {(now_utc.hour + 1) % 24}:{now_utc.strftime('%M:%S')}")
    print()
    
    # Get data from after current UTC time
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gt.{now_utc.isoformat()}&select=timestamp,sensor_metadata(sensor_name),total_in,total_out&order=timestamp&limit=100",
        headers=headers
    )
    
    if response.ok:
        future_data = response.json()
        
        if future_data:
            print(f"⚠️  Found {len(future_data)} records with future timestamps!\n")
            
            # Group by sensor
            by_sensor = {}
            for record in future_data:
                sensor = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
                if sensor not in by_sensor:
                    by_sensor[sensor] = []
                by_sensor[sensor].append(record)
            
            for sensor, records in by_sensor.items():
                print(f"\n{sensor}: {len(records)} future records")
                
                # Show first few
                for i, record in enumerate(records[:5]):
                    timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
                    hours_ahead = (timestamp - now_utc).total_seconds() / 3600
                    
                    print(f"  {timestamp.strftime('%Y-%m-%d %H:%M')} UTC ({hours_ahead:.1f} hours in future)")
                    print(f"    {record['total_in']} IN, {record['total_out']} OUT")
                
                if len(records) > 5:
                    print(f"  ... and {len(records) - 5} more")
            
            # Get date range of future data
            print(f"\n📅 Future data range:")
            
            first_future = datetime.fromisoformat(future_data[0]['timestamp'].replace('Z', '+00:00'))
            last_future = datetime.fromisoformat(future_data[-1]['timestamp'].replace('Z', '+00:00'))
            
            print(f"  First: {first_future.strftime('%Y-%m-%d %H:%M')} UTC")
            print(f"  Last: {last_future.strftime('%Y-%m-%d %H:%M')} UTC")
            
            # This is the issue - we inserted July 22 12:00-23:59 data
            print("\n💡 Analysis:")
            print("The collection script likely collected data up to July 22 23:59 local time")
            print("instead of stopping at July 22 11:59 as requested.")
            
        else:
            print("✅ No future data found!")
    else:
        print(f"Error: {response.status_code}")

if __name__ == "__main__":
    check_future_data()