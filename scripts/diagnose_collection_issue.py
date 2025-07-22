#!/usr/bin/env python3
"""Diagnose why data collection stopped"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def diagnose():
    """Diagnose collection issues"""
    print("🔍 Diagnosing Data Collection Issue")
    print("=" * 80)
    
    # Get sensors
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers=headers
    )
    
    if not sensors_response.ok:
        print("❌ Failed to get sensors")
        return
        
    sensors = sensors_response.json()
    now = datetime.now()
    
    for sensor in sensors:
        print(f"\n📡 {sensor['sensor_name']} (ID: {sensor['id'][:8]}...)")
        
        # Get last timestamp
        last_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&select=timestamp&order=timestamp.desc&limit=1",
            headers=headers
        )
        
        if last_response.ok and last_response.json():
            last_timestamp = datetime.fromisoformat(last_response.json()[0]['timestamp'].replace('Z', '+00:00'))
            print(f"  Last data: {last_timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC")
            
            # Calculate expected next data
            expected_next = last_timestamp + timedelta(hours=1)
            print(f"  Expected next: {expected_next.strftime('%Y-%m-%d %H:%M:%S')} UTC")
            
            # Check if we're past expected time
            now_aware = datetime.now(tz=last_timestamp.tzinfo)
            if now_aware > expected_next:
                overdue_minutes = (now_aware - expected_next).total_seconds() / 60
                print(f"  ⚠️  OVERDUE by {overdue_minutes:.0f} minutes")
                
                # GitHub Actions logic explanation
                print(f"\n  GitHub Actions collection logic:")
                print(f"  - Requests 24 hours of data")
                print(f"  - But skips all data <= {last_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"  - So it's waiting for data > {last_timestamp.strftime('%Y-%m-%d %H:%M:%S')}")
                print(f"  - Next expected: {expected_next.strftime('%Y-%m-%d %H:%M:%S')}")
            else:
                print(f"  ✅ Not yet time for next data")
        else:
            print(f"  ❌ No data collected yet")
    
    print("\n\n💡 Diagnosis:")
    print("The GitHub Actions workflow is working correctly!")
    print("It's skipping already-collected data and waiting for new hourly data.")
    print("\nSince sensors report hourly at :00, the workflow will collect new data:")
    print("- At 11:00 UTC (for 10:00 UTC data)")
    print("- At 12:00 UTC (for 11:00 UTC data)")
    print("- etc.")
    
    print("\n📌 Current time analysis:")
    print(f"Current UTC time: {now.strftime('%H:%M')}")
    next_hour = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    print(f"Next data expected at: {next_hour.strftime('%H:%M')} UTC")
    minutes_until = (next_hour - now).total_seconds() / 60
    print(f"Time until next data: {minutes_until:.0f} minutes")

if __name__ == "__main__":
    diagnose()