#!/usr/bin/env python3
"""Batch collect July data with progress tracking"""

import http.client
import base64
import requests
from datetime import datetime, timedelta
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def collect_day_data(sensor, date):
    """Collect all 24 hours for a specific day"""
    records = []
    
    try:
        conn = http.client.HTTPConnection(sensor['sensor_ip'], sensor['sensor_port'], timeout=20)
        
        # Query full day
        start = date
        end = date + timedelta(days=1) - timedelta(seconds=1)
        
        path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={start.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={end.strftime('%Y-%m-%d-%H:%M:%S')}"
        
        headers_req = {
            'Authorization': f'Basic {base64.b64encode(b"admin:grnl.2024").decode()}'
        }
        
        conn.request("GET", path, headers=headers_req)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            # Create records for each hour found
            hours_found = set()
            
            for i in range(1, len(lines)):
                parts = lines[i].split(',')
                if len(parts) >= 17:
                    # Parse timestamp
                    local_timestamp = datetime.strptime(parts[0].strip(), "%Y/%m/%d %H:%M:%S")
                    hour_start = local_timestamp.replace(minute=0, second=0, microsecond=0)
                    
                    if hour_start not in hours_found:
                        hours_found.add(hour_start)
                        
                        # Convert to UTC
                        utc_timestamp = hour_start - timedelta(hours=1)
                        utc_end_time = utc_timestamp + timedelta(minutes=59, seconds=59)
                        
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
                        records.append(record)
            
            # Fill in missing hours with zero data
            for hour in range(24):
                hour_time = date + timedelta(hours=hour)
                if hour_time not in hours_found and hour_time <= datetime(2025, 7, 22, 11, 0, 0):
                    utc_timestamp = hour_time - timedelta(hours=1)
                    utc_end_time = utc_timestamp + timedelta(minutes=59, seconds=59)
                    
                    record = {
                        "sensor_id": sensor['id'],
                        "organization_id": sensor['organization_id'],
                        "store_id": sensor['store_id'],
                        "timestamp": utc_timestamp.isoformat() + "Z",
                        "end_time": utc_end_time.isoformat() + "Z",
                        "line1_in": 0,
                        "line1_out": 0,
                        "line2_in": 0,
                        "line2_out": 0,
                        "line3_in": 0,
                        "line3_out": 0,
                        "line4_in": 0,
                        "line4_out": 0
                    }
                    records.append(record)
        
        conn.close()
        
    except Exception as e:
        # Fill day with zero data on error
        for hour in range(24):
            hour_time = date + timedelta(hours=hour)
            if hour_time <= datetime(2025, 7, 22, 11, 0, 0):
                utc_timestamp = hour_time - timedelta(hours=1)
                utc_end_time = utc_timestamp + timedelta(minutes=59, seconds=59)
                
                record = {
                    "sensor_id": sensor['id'],
                    "organization_id": sensor['organization_id'],
                    "store_id": sensor['store_id'],
                    "timestamp": utc_timestamp.isoformat() + "Z",
                    "end_time": utc_end_time.isoformat() + "Z",
                    "line1_in": 0,
                    "line1_out": 0,
                    "line2_in": 0,
                    "line2_out": 0,
                    "line3_in": 0,
                    "line3_out": 0,
                    "line4_in": 0,
                    "line4_out": 0
                }
                records.append(record)
    
    return records

def collect_july_data():
    """Collect all July data efficiently"""
    print("📊 Batch July 2025 Data Collection")
    print("=" * 80)
    
    # Delete existing data
    print("🗑️  Deleting existing July data...")
    delete_response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-06-30T23:00:00.000Z&timestamp=lt.2025-07-22T11:00:00.000Z",
        headers=headers
    )
    print("✅ Existing data deleted")
    
    # Get sensors
    print("\n📡 Getting sensors...")
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*&order=sensor_name",
        headers=headers
    )
    
    sensors = [s for s in sensors_response.json() if "J&J" not in s['sensor_name']]
    print(f"Found {len(sensors)} working sensors")
    
    # Generate dates to collect
    dates = []
    current_date = datetime(2025, 7, 1, 0, 0, 0)
    end_date = datetime(2025, 7, 22, 0, 0, 0)
    
    while current_date <= end_date:
        dates.append(current_date)
        current_date += timedelta(days=1)
    
    print(f"\n📅 Collecting {len(dates)} days of data...")
    
    all_records = []
    
    # Process each sensor
    for sensor in sensors:
        print(f"\n📡 Processing {sensor['sensor_name']}...")
        sensor_records = []
        
        # Collect data for each day
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(collect_day_data, sensor, date): date for date in dates}
            
            completed = 0
            for future in as_completed(futures):
                date = futures[future]
                try:
                    records = future.result()
                    sensor_records.extend(records)
                    completed += 1
                    
                    if completed % 5 == 0:
                        print(f"  Progress: {completed}/{len(dates)} days")
                        
                except Exception as e:
                    print(f"  ⚠️  Error on {date.strftime('%Y-%m-%d')}: {str(e)}")
        
        print(f"  Collected {len(sensor_records)} records")
        all_records.extend(sensor_records)
    
    # Insert all records
    print(f"\n💾 Inserting {len(all_records)} total records...")
    
    # Sort by timestamp to ensure proper order
    all_records.sort(key=lambda x: x['timestamp'])
    
    # Insert in batches
    batch_size = 1000
    total_inserted = 0
    
    for i in range(0, len(all_records), batch_size):
        batch = all_records[i:i + batch_size]
        
        insert_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            json=batch,
            headers={
                **headers,
                'Prefer': 'return=minimal'
            }
        )
        
        if insert_response.ok:
            total_inserted += len(batch)
            print(f"  Batch {i//batch_size + 1}/{(len(all_records) + batch_size - 1)//batch_size}: ✅")
        else:
            print(f"  Batch {i//batch_size + 1}: ❌ {insert_response.text[:100]}")
    
    print(f"\n✅ Inserted {total_inserted} records")
    
    # Verify
    verify_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=count&timestamp=gte.2025-06-30T23:00:00.000Z&timestamp=lt.2025-07-22T11:00:00.000Z",
        headers={
            **headers,
            'Prefer': 'count=exact'
        }
    )
    
    if verify_response.ok:
        count = int(verify_response.headers.get('content-range', '0-0/0').split('/')[-1])
        print(f"\n📊 Total records in database: {count}")
        expected_hours = 22 * 24 + 12  # 22 full days + 12 hours on the 22nd
        expected_records = expected_hours * len(sensors)
        print(f"📊 Expected: {expected_records} ({expected_hours} hours × {len(sensors)} sensors)")

if __name__ == "__main__":
    collect_july_data()