#!/usr/bin/env python3
"""Check latest people counting data"""

import requests
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

print("📊 Latest People Counting Data")
print("=" * 80)

# Get latest data for each sensor
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*,sensor_metadata(sensor_name)&order=timestamp.desc&limit=10",
    headers=headers
)

if response.ok:
    data = response.json()
    
    current_time = datetime.utcnow()
    print(f"\nCurrent UTC time: {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("\nLatest records:")
    
    for record in data:
        timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
        sensor_name = record['sensor_metadata']['sensor_name'] if record['sensor_metadata'] else 'Unknown'
        
        print(f"\n{sensor_name} - {timestamp.strftime('%Y-%m-%d %H:%M')}:")
        print(f"  Total IN: {record['total_in']}, Total OUT: {record['total_out']}")
        print(f"  Line breakdown: L1({record['line1_in']}/{record['line1_out']}), L2({record['line2_in']}/{record['line2_out']}), L3({record['line3_in']}/{record['line3_out']}), L4({record['line4_in']}/{record['line4_out']})")
        
        # Calculate hours ago
        hours_ago = (current_time - timestamp).total_seconds() / 3600
        print(f"  ⏰ {hours_ago:.1f} hours ago")
else:
    print(f"Error: {response.status_code}")
    print(response.text)