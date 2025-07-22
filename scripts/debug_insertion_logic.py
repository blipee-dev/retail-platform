#!/usr/bin/env python3
"""Debug why insertions are failing"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def debug_insertion():
    """Debug why insertions are failing"""
    print("🔍 Debugging Insertion Logic")
    print("=" * 80)
    
    # Get sensors
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers=headers
    )
    
    if not response.ok:
        print(f"❌ Failed to get sensors: {response.status_code}")
        return
        
    sensors = response.json()
    
    for sensor in sensors:
        print(f"\n📡 Sensor: {sensor['sensor_name']} (ID: {sensor['id'][:8]}...)")
        
        # Get last timestamp for this sensor
        last_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&select=timestamp&order=timestamp.desc&limit=1",
            headers=headers
        )
        
        if last_response.ok and last_response.json():
            last_record = last_response.json()[0]
            last_timestamp = datetime.fromisoformat(last_record['timestamp'].replace('Z', '+00:00'))
            print(f"  Last timestamp in DB: {last_timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC")
            
            # Show in Portugal time
            pt_time = last_timestamp + timedelta(hours=1)
            print(f"  Portugal time:       {pt_time.strftime('%Y-%m-%d %H:%M:%S')} WEST")
            
            # Check time since last record
            now = datetime.now(tz=last_timestamp.tzinfo)  # Make timezone-aware
            hours_ago = (now - last_timestamp).total_seconds() / 3600
            print(f"  Hours since last:    {hours_ago:.1f} hours ago")
            
            # Show what would happen with new data
            print(f"\n  GitHub Actions logic:")
            print(f"  - Requests data from: {(now - timedelta(hours=24)).strftime('%Y-%m-%d %H:%M')} UTC")
            print(f"  - Requests data to:   {now.strftime('%Y-%m-%d %H:%M')} UTC")
            print(f"  - But skips all data <= {last_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"  - So it would only insert data from {last_timestamp.strftime('%Y-%m-%d %H:%M:%S')} onwards")
            
            if hours_ago < 1:
                print(f"  ⚠️  Last data is very recent - no new data to insert!")
        else:
            print(f"  ✅ No existing data - would insert all retrieved records")
    
    print("\n\n💡 Solution Options:")
    print("1. Clean the database to start fresh")
    print("2. Modify workflow to re-collect historical data")
    print("3. Wait for new sensor data (unlikely if stores are closed)")

if __name__ == "__main__":
    debug_insertion()