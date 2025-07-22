#!/usr/bin/env python3
"""Check latest data collection after workflow run"""

import requests
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

print("📊 Latest Data Collection Check")
print("=" * 80)

# Get current UTC time
now = datetime.utcnow()
print(f"Current UTC time: {now.strftime('%Y-%m-%d %H:%M:%S')}")

# Check data from 09:00 to 13:00
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-22T09:00:00.000Z&timestamp=lt.2025-07-22T13:00:00.000Z&select=timestamp,sensor_metadata(sensor_name),total_in,total_out,created_at&order=timestamp,sensor_metadata(sensor_name)",
    headers=headers
)

if response.ok:
    data = response.json()
    
    print(f"\nFound {len(data)} records from 09:00 to 13:00:")
    print("\nBy Hour:")
    
    hours = {}
    for record in data:
        hour = record['timestamp'][:13]  # Get hour part
        sensor = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
        
        if hour not in hours:
            hours[hour] = []
        hours[hour].append({
            'sensor': sensor,
            'total_in': record['total_in'],
            'total_out': record['total_out'],
            'created_at': record.get('created_at', 'Unknown')
        })
    
    for hour in sorted(hours.keys()):
        print(f"\n{hour}:00 UTC:")
        for record in hours[hour]:
            print(f"  {record['sensor']}: {record['total_in']} IN, {record['total_out']} OUT (created: {record['created_at'][:19]})")
    
    # Check specifically for 11:00 hour
    print("\n🔍 Checking 11:00 hour specifically:")
    eleven_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=eq.2025-07-22T11:00:00.000Z&select=*,sensor_metadata(sensor_name)",
        headers=headers
    )
    
    if eleven_response.ok:
        eleven_data = eleven_response.json()
        if eleven_data:
            print(f"Found {len(eleven_data)} records for 11:00")
        else:
            print("❌ No data found for 11:00 hour!")
            print("\nThis suggests the workflow might have issues with:")
            print("1. The sensor might not be returning 11:00 data yet")
            print("2. The workflow's time query logic")
            print("3. The parsing of the sensor response")
else:
    print(f"Error: {response.status_code}")
    print(response.text)