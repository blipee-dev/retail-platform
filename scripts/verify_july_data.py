#!/usr/bin/env python3
"""Verify July data collection"""

import requests
from datetime import datetime, timedelta
from collections import defaultdict

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def verify_data():
    """Verify July data completeness"""
    print("📊 Verifying July 2025 Data Collection")
    print("=" * 80)
    
    # Get all July data
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-06-30T23:00:00.000Z&timestamp=lt.2025-07-23T00:00:00.000Z&select=timestamp,total_in,total_out,sensor_metadata(sensor_name)&order=timestamp",
        headers=headers
    )
    
    if not response.ok:
        print("❌ Failed to fetch data")
        return
    
    data = response.json()
    print(f"Total records: {len(data)}")
    
    # Group by sensor and day
    sensor_data = defaultdict(lambda: defaultdict(int))
    hourly_coverage = defaultdict(set)
    
    for record in data:
        sensor = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
        timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
        
        # Convert UTC to local (add 1 hour)
        local_time = timestamp + timedelta(hours=1)
        
        day = local_time.strftime('%Y-%m-%d')
        hour = local_time.hour
        
        sensor_data[sensor][day] += 1
        hourly_coverage[sensor].add(local_time.strftime('%Y-%m-%d %H:00'))
    
    # Check coverage
    print("\n📅 Daily Coverage:")
    for sensor in sorted(sensor_data.keys()):
        print(f"\n{sensor}:")
        for day in sorted(sensor_data[sensor].keys()):
            count = sensor_data[sensor][day]
            expected = 24 if day != '2025-07-22' else 12
            status = "✅" if count == expected else "⚠️"
            print(f"  {day}: {count}/{expected} hours {status}")
    
    # Check for missing hours
    print("\n🔍 Checking for missing hours...")
    
    expected_hours = set()
    current = datetime(2025, 7, 1, 0, 0, 0)
    end = datetime(2025, 7, 22, 11, 0, 0)
    
    while current <= end:
        expected_hours.add(current.strftime('%Y-%m-%d %H:00'))
        current += timedelta(hours=1)
    
    for sensor in sorted(hourly_coverage.keys()):
        missing = expected_hours - hourly_coverage[sensor]
        if missing:
            print(f"\n{sensor} missing {len(missing)} hours:")
            for hour in sorted(list(missing))[:5]:  # Show first 5
                print(f"  - {hour}")
            if len(missing) > 5:
                print(f"  ... and {len(missing) - 5} more")
    
    # Show sample data
    print("\n📊 Sample Data (last 10 records):")
    for record in data[-10:]:
        sensor = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
        timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
        local_time = timestamp + timedelta(hours=1)
        
        print(f"{sensor} - {local_time.strftime('%Y-%m-%d %H:00')} local: {record['total_in']} IN, {record['total_out']} OUT")

if __name__ == "__main__":
    verify_data()