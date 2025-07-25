#!/usr/bin/env python3
"""Check current data collection status"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Prefer': 'count=exact'
}

def check_data():
    """Check current data status"""
    print("📊 Current Data Collection Status")
    print("=" * 80)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    # Check people counting raw data
    response = requests.head(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*",
        headers=headers
    )
    
    if response.ok:
        count = int(response.headers.get('content-range', '0/0').split('/')[-1])
        print(f"\n✅ People Counting Raw: {count} records")
        
        # Get latest records
        latest_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=sensor_id,timestamp,total_in,total_out&order=timestamp.desc&limit=10",
            headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
        )
        
        if latest_response.ok and latest_response.json():
            print("\nLatest records:")
            for record in latest_response.json()[:5]:
                sensor_id = record['sensor_id'][:8]
                timestamp = record['timestamp'][:19]
                print(f"  {timestamp} - Sensor {sensor_id} - IN: {record['total_in']}, OUT: {record['total_out']}")
                
            # Check time gap
            latest_time = datetime.fromisoformat(latest_response.json()[0]['timestamp'].replace('Z', '+00:00'))
            now = datetime.now(tz=latest_time.tzinfo)
            gap_hours = (now - latest_time).total_seconds() / 3600
            print(f"\nTime since last data: {gap_hours:.1f} hours")
            
            if gap_hours > 1:
                print("⚠️  Data collection might have stopped!")
    else:
        print(f"❌ Error checking data: {response.status_code}")
    
    # Check each sensor
    print("\n📡 Per-sensor status:")
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=id,sensor_name",
        headers={'apikey': SERVICE_ROLE_KEY, 'Authorization': f'Bearer {SERVICE_ROLE_KEY}'}
    )
    
    if sensors_response.ok:
        for sensor in sensors_response.json():
            count_response = requests.head(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&select=*",
                headers=headers
            )
            if count_response.ok:
                count = int(count_response.headers.get('content-range', '0/0').split('/')[-1])
                print(f"  {sensor['sensor_name']}: {count} records")
    
    # Check GitHub Actions last run
    print("\n🤖 To check GitHub Actions status:")
    print("1. Go to: https://github.com/blipee-dev/retail-platform/actions")
    print("2. Check 'Direct Sensor Data Collection' workflow")
    print("3. Look for any errors in the logs")

if __name__ == "__main__":
    check_data()