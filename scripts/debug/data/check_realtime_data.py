#!/usr/bin/env python3
"""Check real-time data availability"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Ffcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_realtime():
    """Check what data should be available now"""
    print("⏰ Real-Time Data Availability Check")
    print("=" * 80)
    
    now = datetime.utcnow()
    print(f"Current UTC time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Portugal time: {(now + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')} (UTC+1)")
    
    # Calculate what data should be available
    current_hour_start = now.replace(minute=0, second=0, microsecond=0)
    previous_hour = current_hour_start - timedelta(hours=1)
    two_hours_ago = current_hour_start - timedelta(hours=2)
    
    print(f"\n📊 Data Availability (based on current time):")
    print(f"Should have complete data for: {two_hours_ago.strftime('%H:00')} - {previous_hour.strftime('%H:00')} UTC")
    print(f"Should have partial data for:  {previous_hour.strftime('%H:00')} - {current_hour_start.strftime('%H:00')} UTC")
    print(f"Currently collecting:          {current_hour_start.strftime('%H:00')} - {(current_hour_start + timedelta(hours=1)).strftime('%H:00')} UTC")
    
    # Check actual data in database
    print(f"\n📈 Actual Data in Database:")
    
    # Get data from last 3 hours
    three_hours_ago = now - timedelta(hours=3)
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp,sensor_id,total_in,total_out&timestamp=gte.{three_hours_ago.isoformat()}&order=timestamp.desc",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        
        # Group by hour
        hourly_data = {}
        for record in data:
            timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
            hour_key = timestamp.strftime('%Y-%m-%d %H:00')
            
            if hour_key not in hourly_data:
                hourly_data[hour_key] = {'count': 0, 'sensors': set()}
            
            hourly_data[hour_key]['count'] += 1
            hourly_data[hour_key]['sensors'].add(record['sensor_id'][:8])
        
        # Show hourly summary
        for hour in sorted(hourly_data.keys(), reverse=True):
            sensor_count = len(hourly_data[hour]['sensors'])
            record_count = hourly_data[hour]['count']
            print(f"\n{hour} UTC:")
            print(f"  Records: {record_count} from {sensor_count} sensors")
            print(f"  Sensors: {', '.join(sorted(hourly_data[hour]['sensors']))}")
    
    # Check GitHub Actions schedule
    print(f"\n🤖 GitHub Actions Schedule:")
    print(f"Runs at: :00 and :30 past each hour")
    
    last_run_minute = 30 if now.minute >= 30 else 0
    last_run = now.replace(minute=last_run_minute, second=0, microsecond=0)
    next_run = last_run + timedelta(minutes=30)
    
    print(f"Last run: {last_run.strftime('%H:%M')} UTC")
    print(f"Next run: {next_run.strftime('%H:%M')} UTC")
    
    print(f"\n❓ Why might data be missing?")
    print(f"1. Sensors report data at the END of each hour")
    print(f"2. 10:00-11:00 data becomes available at 11:00")
    print(f"3. 11:00-12:00 data becomes available at 12:00")
    print(f"4. GitHub Actions needs to run AFTER the hour to collect it")
    
    print(f"\n💡 Current situation at {now.strftime('%H:%M')}:")
    if now.hour == 10:
        print(f"- 09:00-10:00 data: ✅ Should be in database")
        print(f"- 10:00-11:00 data: ⏳ Being collected by sensors, available at 11:00")
    elif now.hour == 11:
        print(f"- 10:00-11:00 data: ✅ Should be in database (if workflow ran at 11:00)")
        print(f"- 11:00-12:00 data: ⏳ Being collected by sensors, available at 12:00")

if __name__ == "__main__":
    check_realtime()