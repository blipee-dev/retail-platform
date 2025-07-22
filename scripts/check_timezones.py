#!/usr/bin/env python3
"""Check timezone usage across the system"""

import requests
from datetime import datetime
import pytz

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_timezones():
    """Check timezone information"""
    print("🌍 Timezone Analysis")
    print("=" * 60)
    
    # Current time in different zones
    now_utc = datetime.now(pytz.UTC)
    now_lisbon = now_utc.astimezone(pytz.timezone('Europe/Lisbon'))
    now_local = datetime.now()
    
    print(f"\n⏰ Current Times:")
    print(f"UTC:              {now_utc.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"Portugal (Lisbon): {now_lisbon.strftime('%Y-%m-%d %H:%M:%S %Z')}")
    print(f"Codespaces Local: {now_local.strftime('%Y-%m-%d %H:%M:%S')} (no TZ)")
    
    # Check store locations
    print(f"\n🏪 Store Locations:")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/stores?select=name,timezone,location",
        headers=headers
    )
    
    if response.ok:
        stores = response.json()
        for store in stores:
            location = store.get('location', {})
            print(f"\n{store['name']}:")
            print(f"  Location: {location.get('city', 'Unknown')}, {location.get('country', 'Unknown')}")
            print(f"  Timezone in DB: {store.get('timezone', 'Not set')}")
    
    # Check actual data timestamps
    print(f"\n📊 Data Timestamps in Database:")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp,created_at&order=timestamp.desc&limit=5",
        headers=headers
    )
    
    if response.ok and response.json():
        data = response.json()
        for record in data:
            ts = record['timestamp']
            created = record['created_at']
            print(f"\nData timestamp: {ts}")
            print(f"Created at:     {created}")
            
            # Parse and show offset
            if ts.endswith('+00:00') or ts.endswith('Z'):
                print(f"Timezone:       UTC")
            else:
                print(f"Timezone:       {ts[-6:]}")
    
    # GitHub Actions timezone
    print(f"\n🤖 GitHub Actions:")
    print(f"GitHub Actions runs in UTC by default")
    print(f"Cron schedule: '*/30 * * * *' (every 30 minutes UTC)")
    
    # Sensor timezone
    print(f"\n📡 Sensor Configuration:")
    print(f"Milesight sensors typically use local time")
    print(f"Portugal is UTC+0 (WET) or UTC+1 (WEST in summer)")
    
    # Analysis
    print(f"\n📋 Analysis:")
    print(f"1. Database stores all timestamps in UTC (with +00:00)")
    print(f"2. Stores are in Portugal (Porto, Guimarães, Almada)")
    print(f"3. Current offset: Portugal is {'UTC+1 (Summer Time)' if now_lisbon.utcoffset().seconds == 3600 else 'UTC+0 (Winter Time)'}")
    print(f"4. This means store times are {1 if now_lisbon.utcoffset().seconds == 3600 else 0} hour(s) ahead of UTC")

if __name__ == "__main__":
    check_timezones()