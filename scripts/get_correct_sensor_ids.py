#!/usr/bin/env python3
"""Get correct sensor IDs from database"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

# Get all sensors
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/sensor_metadata?select=*&order=sensor_name",
    headers=headers
)

if response.ok:
    sensors = response.json()
    print("📡 Sensor IDs in Database:")
    print("=" * 80)
    for sensor in sensors:
        print(f"\n{sensor['sensor_name']}:")
        print(f"  ID: {sensor['id']}")
        print(f"  IP: {sensor['sensor_ip']}:{sensor['sensor_port']}")
        print(f"  Organization ID: {sensor['organization_id']}")
        print(f"  Store ID: {sensor['store_id']}")