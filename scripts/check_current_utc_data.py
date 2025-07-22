#!/usr/bin/env python3
"""Check the most recent data in the database."""

import os
from datetime import datetime, timezone
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
    """Check latest data timestamps."""
    
    # Get current time
    now_utc = datetime.now(timezone.utc)
    print(f"Current UTC time: {now_utc.strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"Current UTC hour: {now_utc.hour}")
    print(f"Current Portugal time (UTC+1): {now_utc.hour + 1}:00")
    print("-" * 80)
    
    # Get latest records from people_counting_raw
    print("\n=== LATEST PEOPLE_COUNTING_RAW RECORDS ===")
    result = supabase.table('people_counting_raw')\
        .select('*')\
        .order('timestamp', desc=True)\
        .limit(10)\
        .execute()
    
    if result.data:
        for row in result.data:
            total_in = row['line1_in'] + row['line2_in'] + row['line3_in'] + row['line4_in']
            total_out = row['line1_out'] + row['line2_out'] + row['line3_out'] + row['line4_out']
            sensor_name = supabase.table('sensor_metadata')\
                .select('sensor_name')\
                .eq('id', row['sensor_id'])\
                .single()\
                .execute()
            
            print(f"{row['timestamp']} | {sensor_name.data['sensor_name']} | In: {total_in} | Out: {total_out}")
    else:
        print("No data found")
    
    # Check hourly totals for today
    print("\n=== TODAY'S HOURLY TOTALS (UTC) ===")
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get hourly data for all sensors today
    hourly_data = {}
    for hour in range(0, now_utc.hour + 1):
        hour_start = today_start.replace(hour=hour)
        hour_end = hour_start.replace(hour=hour+1) if hour < 23 else today_start.replace(day=today_start.day+1)
        
        result = supabase.table('people_counting_raw')\
            .select('line1_in, line1_out, line2_in, line2_out, line3_in, line3_out, line4_in, line4_out')\
            .gte('timestamp', hour_start.isoformat())\
            .lt('timestamp', hour_end.isoformat())\
            .execute()
        
        if result.data:
            total_in = sum(row['line1_in'] + row['line2_in'] + row['line3_in'] + row['line4_in'] for row in result.data)
            total_out = sum(row['line1_out'] + row['line2_out'] + row['line3_out'] + row['line4_out'] for row in result.data)
            print(f"  {hour:02d}:00 UTC ({hour+1:02d}:00 Portugal): {len(result.data)} records | In: {total_in} | Out: {total_out}")

if __name__ == "__main__":
    check_latest_data()