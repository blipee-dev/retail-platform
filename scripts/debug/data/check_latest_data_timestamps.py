#!/usr/bin/env python3
"""Check latest sensor data timestamps in database."""

import os
from datetime import datetime, timezone, timedelta
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env')

# Initialize Supabase client
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: Supabase credentials not set")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def check_latest_data():
    """Check latest data timestamps in all sensor tables."""
    
    # Get current time
    now_utc = datetime.now(timezone.utc)
    print(f"Current UTC time: {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"Current UTC hour: {now_utc.hour}")
    print("-" * 80)
    
    # Check sensor_data table
    print("\n=== SENSOR_DATA TABLE ===")
    
    # Get latest records
    result = supabase.table('sensor_data')\
        .select('*')\
        .order('timestamp', desc=True)\
        .limit(10)\
        .execute()
    
    if result.data:
        latest = result.data[0]
        print(f"Latest timestamp: {latest['timestamp']}")
        print(f"\nLast 10 records:")
        for row in result.data:
            print(f"  {row['timestamp']} | Sensor: {row['sensor_id']} | In: {row['people_in']} | Out: {row['people_out']}")
    else:
        print("No data found in sensor_data table")
    
    # Get data count for today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = supabase.table('sensor_data')\
        .select('*', count='exact')\
        .gte('timestamp', today_start.isoformat())\
        .execute()
    print(f"\nTotal records today: {today_count.count}")
    
    # Check data for each hour today
    print("\n=== TODAY'S DATA BY HOUR (UTC) ===")
    for hour in range(0, now_utc.hour + 1):
        hour_start = today_start.replace(hour=hour)
        hour_end = hour_start + timedelta(hours=1)
        
        result = supabase.table('sensor_data')\
            .select('*', count='exact')\
            .gte('timestamp', hour_start.isoformat())\
            .lt('timestamp', hour_end.isoformat())\
            .execute()
        
        if result.count > 0:
            # Get sum of people_in and people_out
            data_result = supabase.table('sensor_data')\
                .select('people_in, people_out')\
                .gte('timestamp', hour_start.isoformat())\
                .lt('timestamp', hour_end.isoformat())\
                .execute()
            
            total_in = sum(row['people_in'] for row in data_result.data)
            total_out = sum(row['people_out'] for row in data_result.data)
            
            print(f"  {hour:02d}:00 UTC: {result.count} records | In: {total_in} | Out: {total_out}")
    
    # Check sensor_data_hourly
    print("\n=== SENSOR_DATA_HOURLY TABLE ===")
    
    hourly_result = supabase.table('sensor_data_hourly')\
        .select('*')\
        .order('hour', desc=True)\
        .limit(10)\
        .execute()
    
    if hourly_result.data:
        latest_hourly = hourly_result.data[0]
        print(f"Latest hour: {latest_hourly['hour']}")
        print(f"\nLast 10 hourly records:")
        for row in hourly_result.data:
            print(f"  {row['hour']} | Sensor: {row['sensor_id']} | In: {row['total_in']} | Out: {row['total_out']}")
    else:
        print("No data found in sensor_data_hourly table")
    
    # Check for gaps in recent hours
    print("\n=== CHECKING FOR GAPS IN RECENT DATA ===")
    print("Missing hours in the last 24 hours:")
    
    for i in range(24, -1, -1):
        check_time = now_utc - timedelta(hours=i)
        hour_start = check_time.replace(minute=0, second=0, microsecond=0)
        hour_end = hour_start + timedelta(hours=1)
        
        result = supabase.table('sensor_data')\
            .select('*', count='exact')\
            .gte('timestamp', hour_start.isoformat())\
            .lt('timestamp', hour_end.isoformat())\
            .execute()
        
        if result.count == 0:
            print(f"  Missing: {hour_start.strftime('%Y-%m-%d %H:00 UTC')}")

if __name__ == "__main__":
    check_latest_data()