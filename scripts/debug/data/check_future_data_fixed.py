#!/usr/bin/env python3
"""Check for future data in the database"""

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

def check_future_data():
    """Check for data with timestamps in the future"""
    print("🔍 Checking for Future Data")
    print("=" * 80)
    
    # Get current UTC time
    now_utc = datetime.now(timezone.utc)
    print(f"Current UTC time: {now_utc.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Current local time (UTC+1): {(now_utc.hour + 1) % 24}:{now_utc.strftime('%M:%S')}")
    print()
    
    # Check data from July 22 12:00 UTC onwards (which would be 13:00 local time)
    # Since we're at 12:31 UTC now, anything from 12:00 UTC today is potentially future
    check_time = "2025-07-22T12:00:00.000Z"
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.{check_time}&select=timestamp,sensor_metadata(sensor_name),total_in,total_out&order=timestamp",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        
        print(f"Found {len(data)} records from July 22 12:00 UTC onwards\n")
        
        if data:
            # Group by hour
            hourly_data = {}
            
            for record in data:
                timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
                hour_key = timestamp.strftime('%Y-%m-%d %H:00')
                sensor = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
                
                if hour_key not in hourly_data:
                    hourly_data[hour_key] = {'sensors': set(), 'count': 0, 'total_in': 0, 'total_out': 0}
                
                hourly_data[hour_key]['sensors'].add(sensor)
                hourly_data[hour_key]['count'] += 1
                hourly_data[hour_key]['total_in'] += record['total_in']
                hourly_data[hour_key]['total_out'] += record['total_out']
            
            print("📅 Data by hour (UTC):")
            for hour in sorted(hourly_data.keys()):
                data = hourly_data[hour]
                local_hour = int(hour[11:13]) + 1
                if local_hour >= 24:
                    local_hour -= 24
                
                print(f"\n{hour} UTC ({local_hour:02d}:00 local):")
                print(f"  Records: {data['count']} from {len(data['sensors'])} sensors")
                print(f"  Total: {data['total_in']} IN, {data['total_out']} OUT")
                print(f"  Sensors: {', '.join(sorted(data['sensors']))}")
            
            print("\n💡 Analysis:")
            print("We have data up to July 22 23:00 UTC (July 23 00:00 local time)")
            print("But we requested data only up to July 22 11:59 LOCAL time (10:59 UTC)")
            print("\nThe extra data is from July 22 12:00-23:59 local time")
            
            # Count how many records we should delete
            delete_from = "2025-07-22T11:00:00.000Z"  # 12:00 local time
            extra_count = len([r for r in data if r['timestamp'] >= delete_from])
            print(f"\n🗑️  Should delete {extra_count} records from {delete_from} onwards")
            
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    check_future_data()