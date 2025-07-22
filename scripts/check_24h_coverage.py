#!/usr/bin/env python3
"""Check 24-hour data coverage"""

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

def check_coverage():
    """Check 24-hour data coverage"""
    print("📊 24-Hour Data Coverage Analysis")
    print("=" * 80)
    
    # Get current time and 24 hours ago
    now = datetime.now()
    start_24h = now - timedelta(hours=24)
    
    print(f"\nTime Range: {start_24h.strftime('%Y-%m-%d %H:%M')} to {now.strftime('%Y-%m-%d %H:%M')} UTC")
    print(f"Portugal Time: {(start_24h + timedelta(hours=1)).strftime('%H:%M')} to {(now + timedelta(hours=1)).strftime('%H:%M')} WEST")
    
    # Get all data from last 24 hours
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&timestamp=gte.{start_24h.isoformat()}&order=timestamp",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        print(f"\n✅ Total records in last 24 hours: {len(data)}")
        
        if not data:
            print("\n❌ No data collected yet!")
            print("\nTo collect data:")
            print("1. Go to: https://github.com/blipee-dev/retail-platform/actions")
            print("2. Run the 'Direct Sensor Data Collection' workflow")
            return
        
        # Analyze coverage by hour and sensor
        coverage = defaultdict(lambda: defaultdict(bool))
        sensor_names = {}
        movement_hours = []
        
        for record in data:
            timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
            hour_key = timestamp.strftime('%Y-%m-%d %H:00')
            sensor_id = record['sensor_id'][:8]
            
            coverage[hour_key][sensor_id] = True
            
            # Track sensor names
            if sensor_id not in sensor_names:
                # Get sensor name
                sensor_resp = requests.get(
                    f"{SUPABASE_URL}/rest/v1/sensor_metadata?id=eq.{record['sensor_id']}&select=sensor_name",
                    headers=headers
                )
                if sensor_resp.ok and sensor_resp.json():
                    sensor_names[sensor_id] = sensor_resp.json()[0]['sensor_name']
            
            # Track hours with movement
            total_movement = record.get('total_in', 0) + record.get('total_out', 0)
            if total_movement > 0:
                movement_hours.append((timestamp, total_movement, sensor_id))
        
        # Show hourly coverage grid
        print("\n📅 Hourly Coverage Grid (✓ = data, · = missing):")
        print("\nHour (UTC) | Portugal | " + " | ".join(sensor_names.values()))
        print("-" * 80)
        
        # Generate all hours in range
        current_hour = start_24h.replace(minute=0, second=0, microsecond=0)
        total_hours = 0
        covered_hours = 0
        
        while current_hour <= now:
            hour_key = current_hour.strftime('%Y-%m-%d %H:00')
            portugal_hour = (current_hour + timedelta(hours=1)).strftime('%H:%M')
            
            row = f"{current_hour.strftime('%m-%d %H:00')} | {portugal_hour} |"
            
            hour_has_data = False
            for sensor_id in sensor_names.keys():
                if coverage[hour_key][sensor_id]:
                    row += "   ✓   |"
                    hour_has_data = True
                else:
                    row += "   ·   |"
            
            print(row)
            
            total_hours += 1
            if hour_has_data:
                covered_hours += 1
            
            current_hour += timedelta(hours=1)
        
        # Summary statistics
        print(f"\n📈 Coverage Summary:")
        print(f"Total hours: {total_hours}")
        print(f"Hours with data: {covered_hours}")
        print(f"Coverage: {covered_hours/total_hours*100:.1f}%")
        
        # Movement summary
        if movement_hours:
            print(f"\n🚶 Hours with customer movement:")
            for timestamp, movement, sensor in movement_hours[:10]:  # Show first 10
                pt_time = (timestamp + timedelta(hours=1)).strftime('%H:%M')
                print(f"  {timestamp.strftime('%m-%d %H:%M')} UTC ({pt_time} PT) - {movement} people - {sensor_names.get(sensor, sensor)}")
            
            if len(movement_hours) > 10:
                print(f"  ... and {len(movement_hours) - 10} more hours with movement")
        else:
            print(f"\n⚠️  No customer movement detected in any hour")
            print("This could mean:")
            print("- Stores are closed")
            print("- Very low traffic")
            print("- Sensors need checking")
        
        # Missing data
        if covered_hours < total_hours:
            print(f"\n⚠️  Missing {total_hours - covered_hours} hours of data")
            print("\nTo fill gaps:")
            print("1. Run GitHub Actions workflow again")
            print("2. Wait for automatic collection (every 30 min)")
            
    else:
        print(f"❌ Error fetching data: {response.status_code}")

if __name__ == "__main__":
    check_coverage()