#!/usr/bin/env python3
"""Comprehensive July 2025 data collection"""

import http.client
import base64
import requests
from datetime import datetime, timedelta
import json
import time

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def collect_sensor_data_by_chunks(sensor, start_date, end_date):
    """Collect data in daily chunks to avoid timeouts"""
    all_records = []
    current_date = start_date
    
    while current_date < end_date:
        next_date = min(current_date + timedelta(days=1), end_date)
        
        print(f"    📅 Fetching {current_date.strftime('%Y-%m-%d')}...")
        
        try:
            conn = http.client.HTTPConnection(sensor['sensor_ip'], sensor['sensor_port'], timeout=30)
            
            # Format for sensor API
            start_str = current_date.strftime('%Y-%m-%d-%H:%M:%S')
            end_str = next_date.strftime('%Y-%m-%d-%H:%M:%S')
            
            path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={start_str}&time_end={end_str}"
            
            headers_req = {
                'Authorization': f'Basic {base64.b64encode(b"admin:grnl.2024").decode()}'
            }
            
            conn.request("GET", path, headers=headers_req)
            response = conn.getresponse()
            
            if response.status == 200:
                data = response.read().decode('utf-8')
                lines = data.strip().split('\n')
                
                # Parse records
                day_records = 0
                for i in range(1, len(lines)):
                    parts = lines[i].split(',')
                    if len(parts) >= 17:
                        try:
                            # Parse timestamp (sensor returns local time UTC+1)
                            local_timestamp = datetime.strptime(parts[0].strip(), "%Y/%m/%d %H:%M:%S")
                            
                            # Convert to UTC (subtract 1 hour for Portugal timezone)
                            utc_timestamp = local_timestamp - timedelta(hours=1)
                            utc_end_time = utc_timestamp + timedelta(minutes=59, seconds=59)
                            
                            # Only include data within our date range
                            if utc_timestamp >= (start_date - timedelta(hours=1)) and utc_timestamp < (end_date - timedelta(hours=1)):
                                record = {
                                    "sensor_id": sensor['id'],
                                    "organization_id": sensor['organization_id'],
                                    "store_id": sensor['store_id'],
                                    "timestamp": utc_timestamp.isoformat() + "Z",
                                    "end_time": utc_end_time.isoformat() + "Z",
                                    "line1_in": int(parts[5].strip()) if parts[5].strip() else 0,
                                    "line1_out": int(parts[6].strip()) if parts[6].strip() else 0,
                                    "line2_in": int(parts[8].strip()) if parts[8].strip() else 0,
                                    "line2_out": int(parts[9].strip()) if parts[9].strip() else 0,
                                    "line3_in": int(parts[11].strip()) if parts[11].strip() else 0,
                                    "line3_out": int(parts[12].strip()) if parts[12].strip() else 0,
                                    "line4_in": int(parts[14].strip()) if parts[14].strip() else 0,
                                    "line4_out": int(parts[15].strip()) if parts[15].strip() else 0
                                }
                                
                                all_records.append(record)
                                day_records += 1
                                
                        except Exception as e:
                            pass  # Skip invalid records
                
                print(f"      ✅ Got {day_records} records")
                
            conn.close()
            
        except Exception as e:
            print(f"      ⚠️  Error: {str(e)}")
        
        # Move to next day
        current_date = next_date
        
        # Small delay to avoid overwhelming the sensor
        time.sleep(0.5)
    
    return all_records

def collect_july_data():
    """Collect all July data"""
    print("📊 Comprehensive July 2025 Data Collection")
    print("=" * 80)
    print("Date range: July 1, 2025 00:00:00 to July 22, 2025 11:59:59 (local time)")
    print("Timezone: UTC+1 (Portugal)")
    print()
    
    # First, delete existing data
    print("🗑️  Step 1: Deleting existing data...")
    
    # Check what we have first
    check_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-01T00:00:00.000Z&timestamp=lt.2025-07-23T00:00:00.000Z&select=timestamp&order=timestamp",
        headers=headers
    )
    
    if check_response.ok:
        existing = check_response.json()
        print(f"  Found {len(existing)} existing records")
        
        if existing:
            # Delete them
            delete_response = requests.delete(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-01T00:00:00.000Z&timestamp=lt.2025-07-23T00:00:00.000Z",
                headers=headers
            )
            
            if delete_response.ok:
                print("  ✅ Deleted existing data")
            else:
                print(f"  ❌ Delete failed: {delete_response.status_code}")
                return
    
    # Get active sensors
    print("\n📡 Step 2: Getting active sensors...")
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*&order=sensor_name",
        headers=headers
    )
    
    if not sensors_response.ok:
        print("❌ Failed to get sensors")
        return
    
    sensors = sensors_response.json()
    print(f"Found {len(sensors)} active sensors")
    
    # Define date range in LOCAL time (Portugal UTC+1)
    start_local = datetime(2025, 7, 1, 0, 0, 0)
    end_local = datetime(2025, 7, 22, 12, 0, 0)  # Up to 12:00 on July 22
    
    # Process each sensor
    total_inserted = 0
    
    for sensor in sensors:
        print(f"\n📡 Processing {sensor['sensor_name']}...")
        
        # Skip J&J sensor if it times out
        if "J&J" in sensor['sensor_name']:
            print("  ⚠️  Skipping (known timeout issue)")
            continue
        
        # Collect data in chunks
        sensor_records = collect_sensor_data_by_chunks(sensor, start_local, end_local)
        
        print(f"  📊 Total records collected: {len(sensor_records)}")
        
        # Insert in batches
        if sensor_records:
            batch_size = 500
            sensor_inserted = 0
            
            for i in range(0, len(sensor_records), batch_size):
                batch = sensor_records[i:i + batch_size]
                
                insert_response = requests.post(
                    f"{SUPABASE_URL}/rest/v1/people_counting_raw",
                    json=batch,
                    headers={
                        **headers,
                        'Prefer': 'return=minimal'
                    }
                )
                
                if insert_response.ok:
                    sensor_inserted += len(batch)
                else:
                    print(f"    ❌ Failed batch: {insert_response.status_code}")
                    print(f"       {insert_response.text[:200]}")
            
            print(f"  ✅ Inserted: {sensor_inserted} records")
            total_inserted += sensor_inserted
    
    # Verify the data
    print("\n📊 Step 3: Verifying collected data...")
    
    # Get summary by day
    verify_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-01T00:00:00.000Z&timestamp=lt.2025-07-23T00:00:00.000Z&select=timestamp,total_in,total_out,sensor_metadata(sensor_name)&order=timestamp",
        headers=headers
    )
    
    if verify_response.ok:
        data = verify_response.json()
        print(f"\n✅ Total records in database: {len(data)}")
        
        # Group by day
        daily_stats = {}
        for record in data:
            day = record['timestamp'][:10]
            sensor = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
            
            if day not in daily_stats:
                daily_stats[day] = {}
            if sensor not in daily_stats[day]:
                daily_stats[day][sensor] = {'count': 0, 'total_in': 0, 'total_out': 0}
            
            daily_stats[day][sensor]['count'] += 1
            daily_stats[day][sensor]['total_in'] += record['total_in']
            daily_stats[day][sensor]['total_out'] += record['total_out']
        
        print("\nDaily summary:")
        for day in sorted(daily_stats.keys())[:5]:  # Show first 5 days
            print(f"\n{day}:")
            for sensor, stats in daily_stats[day].items():
                print(f"  {sensor}: {stats['count']} records, {stats['total_in']} IN, {stats['total_out']} OUT")
    
    print("\n" + "=" * 80)
    print(f"✅ Collection complete! Total inserted: {total_inserted} records")

if __name__ == "__main__":
    collect_july_data()