#!/usr/bin/env python3
"""Check sensor authentication from database"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_auth():
    """Check sensor authentication details"""
    print("🔐 Sensor Authentication Check")
    print("=" * 60)
    
    # Get all sensors
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?select=*&order=sensor_name",
        headers=headers
    )
    
    if response.ok:
        sensors = response.json()
        
        print(f"\nFound {len(sensors)} sensors:\n")
        
        for sensor in sensors:
            print(f"📡 {sensor['sensor_name']}")
            print(f"   IP: {sensor['sensor_ip']}:{sensor['sensor_port']}")
            print(f"   API Endpoint: {sensor.get('api_endpoint', '/dataloader.cgi')}")
            
            # Check if auth info is stored
            config = sensor.get('sensor_config', {})
            if isinstance(config, dict):
                auth = config.get('auth', {})
                if auth:
                    print(f"   Auth in config: {auth}")
            
            print(f"   Active: {sensor['is_active']}")
            print()

if __name__ == "__main__":
    check_auth()