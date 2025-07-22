#!/usr/bin/env python3
"""Debug why workflow isn't adding new data"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def debug_issue():
    """Debug why no new data is being added"""
    print("🔍 Debugging Data Collection Issue")
    print("=" * 80)
    
    now = datetime.utcnow()
    print(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC\n")
    
    # Check last data for each sensor
    print("📊 Last data timestamp for each sensor:")
    
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=id,sensor_name",
        headers=headers
    )
    
    if sensors_response.ok:
        sensors = sensors_response.json()
        
        for sensor in sensors:
            # Get last timestamp
            last_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&select=timestamp,total_in,total_out&order=timestamp.desc&limit=1",
                headers=headers
            )
            
            if last_response.ok and last_response.json():
                last_data = last_response.json()[0]
                last_time = datetime.fromisoformat(last_data['timestamp'].replace('Z', '+00:00'))
                hours_ago = (datetime.now(tz=last_time.tzinfo) - last_time).total_seconds() / 3600
                
                print(f"\n{sensor['sensor_name']}:")
                print(f"  Last timestamp: {last_time.strftime('%Y-%m-%d %H:%M:%S')} UTC ({hours_ago:.1f} hours ago)")
                print(f"  Last data: {last_data['total_in']} IN, {last_data['total_out']} OUT")
            else:
                print(f"\n{sensor['sensor_name']}: No data")
    
    print("\n\n🤔 Workflow behavior analysis:")
    print("The workflow ran at: 10:30, 11:00, 11:30 (presumably)")
    print("But no new data was inserted.\n")
    
    print("This happens because:")
    print("1. The workflow checks: Is timestamp > last timestamp?")
    print("2. For 10:00 data: 10:00 is NOT > 10:00, so SKIP")
    print("3. For 11:00 data: 11:00 is NOT > 10:00, so INSERT (first time only)")
    print("4. But on subsequent runs: 11:00 is NOT > 11:00, so SKIP")
    
    print("\n❌ The workflow NEVER updates existing timestamps!")
    print("It only inserts NEW timestamps that don't exist yet.")
    
    print("\n📊 What SHOULD happen:")
    print("- 11:00 UTC: Insert 11:00 timestamp with initial counts")
    print("- 11:30 UTC: UPDATE 11:00 timestamp with new cumulative counts")
    print("- 12:00 UTC: UPDATE 11:00 timestamp with final counts")
    
    print("\n🔧 To fix this, the workflow needs one of:")
    print("1. UPSERT logic (INSERT ... ON CONFLICT UPDATE)")
    print("2. Separate logic for current hour vs past hours")
    print("3. Always update records from the last 2 hours")

if __name__ == "__main__":
    debug_issue()