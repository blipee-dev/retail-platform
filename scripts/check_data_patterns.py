#!/usr/bin/env python3
"""Check data patterns in the database"""

import requests
from datetime import datetime
from collections import defaultdict

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_patterns():
    """Check data patterns"""
    print("📊 Data Pattern Analysis")
    print("=" * 80)
    
    # Get recent data
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&order=timestamp.desc&limit=100",
        headers=headers
    )
    
    if not response.ok:
        print(f"❌ Failed to get data: {response.status_code}")
        return
        
    data = response.json()
    
    if not data:
        print("No data found")
        return
    
    # Analyze patterns
    sensors = defaultdict(list)
    timestamps = set()
    
    for record in data:
        sensor_id = record['sensor_id'][:8]
        timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
        sensors[sensor_id].append(timestamp)
        timestamps.add(timestamp)
    
    # Show unique timestamps
    print(f"\n📅 Unique timestamps in database (showing last 10):")
    for ts in sorted(timestamps, reverse=True)[:10]:
        print(f"  {ts.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    # Check interval patterns
    print(f"\n⏱️  Data Interval Analysis:")
    for sensor_id, times in sensors.items():
        if len(times) > 1:
            sorted_times = sorted(times)
            intervals = []
            for i in range(1, len(sorted_times)):
                interval = (sorted_times[i] - sorted_times[i-1]).total_seconds() / 3600
                intervals.append(interval)
            
            if intervals:
                avg_interval = sum(intervals) / len(intervals)
                print(f"\n  Sensor {sensor_id}:")
                print(f"    Average interval: {avg_interval:.1f} hours")
                print(f"    Min interval: {min(intervals):.1f} hours")
                print(f"    Max interval: {max(intervals):.1f} hours")
    
    # Show current time
    now = datetime.now(tz=timestamps.pop().tzinfo if timestamps else None)
    print(f"\n⏰ Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print(f"   Next expected data: Around {now.strftime('%Y-%m-%d %H:00:00')} UTC (top of the hour)")

if __name__ == "__main__":
    check_patterns()