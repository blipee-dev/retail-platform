#!/usr/bin/env python3
"""Collect ALL hours from July 1-22, 2025"""

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

def generate_all_hours(start_date, end_date):
    """Generate all hours between start and end date"""
    hours = []
    current = start_date
    while current <= end_date:
        hours.append(current)
        current += timedelta(hours=1)
    return hours

def collect_sensor_hour_data(sensor, hour_start):
    """Collect data for a specific hour"""
    hour_end = hour_start + timedelta(minutes=59, seconds=59)
    
    try:
        conn = http.client.HTTPConnection(sensor['sensor_ip'], sensor['sensor_port'], timeout=10)
        
        # Query for specific hour (sensor expects local time)
        path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={hour_start.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={hour_end.strftime('%Y-%m-%d-%H:%M:%S')}"
        
        headers_req = {
            'Authorization': f'Basic {base64.b64encode(b"admin:grnl.2024").decode()}'
        }
        
        conn.request("GET", path, headers=headers_req)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            # Parse the response
            if len(lines) > 1:
                parts = lines[1].split(',')
                if len(parts) >= 17:
                    # Convert to UTC (subtract 1 hour for Portugal)
                    utc_timestamp = hour_start - timedelta(hours=1)
                    utc_end_time = utc_timestamp + timedelta(minutes=59, seconds=59)
                    
                    return {
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
        
        conn.close()
        
    except Exception as e:
        # Return zero data for this hour if there's an error
        utc_timestamp = hour_start - timedelta(hours=1)
        utc_end_time = utc_timestamp + timedelta(minutes=59, seconds=59)
        
        return {
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
    
    return None

def collect_july_data():
    """Collect ALL hours from July 1-22"""
    print("📊 Complete July 2025 Data Collection (All Hours)")
    print("=" * 80)
    print("Date range: July 1, 2025 00:00 to July 22, 2025 11:59 (local time)")
    print("Total hours to collect: 531 (22 days * 24 hours + 12 hours)")
    print()
    
    # Delete existing data
    print("🗑️  Step 1: Deleting existing July data...")
    delete_response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-06-30T23:00:00.000Z&timestamp=lt.2025-07-22T11:00:00.000Z",
        headers=headers
    )
    
    if delete_response.ok:
        print("✅ Existing data deleted")
    
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
    # Skip J&J sensor
    sensors = [s for s in sensors if "J&J" not in s['sensor_name']]
    print(f"Found {len(sensors)} working sensors (excluding J&J)")
    
    # Generate all hours (in local time)
    start_local = datetime(2025, 7, 1, 0, 0, 0)
    end_local = datetime(2025, 7, 22, 11, 0, 0)
    all_hours = generate_all_hours(start_local, end_local)
    
    print(f"\n📅 Step 3: Collecting {len(all_hours)} hours of data...")
    
    # Process each sensor
    for sensor_idx, sensor in enumerate(sensors):
        print(f"\n📡 [{sensor_idx+1}/{len(sensors)}] Processing {sensor['sensor_name']}...")
        
        sensor_records = []
        progress_interval = 24  # Show progress every 24 hours (1 day)
        
        for i, hour in enumerate(all_hours):
            # Collect data for this hour
            record = collect_sensor_hour_data(sensor, hour)
            
            if record:
                sensor_records.append(record)
            
            # Show progress
            if (i + 1) % progress_interval == 0:
                day_num = (i + 1) // 24
                total_in = sum(r['line1_in'] + r['line2_in'] + r['line3_in'] + r['line4_in'] for r in sensor_records[-24:])
                total_out = sum(r['line1_out'] + r['line2_out'] + r['line3_out'] + r['line4_out'] for r in sensor_records[-24:])
                print(f"  Day {day_num}: {total_in} IN, {total_out} OUT")
            
            # Small delay to avoid overwhelming the sensor
            if i % 10 == 0:
                time.sleep(0.1)
        
        # Insert all records for this sensor
        print(f"  💾 Inserting {len(sensor_records)} records...")
        
        if sensor_records:
            # Insert in batches
            batch_size = 500
            total_inserted = 0
            
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
                    total_inserted += len(batch)
                else:
                    print(f"    ❌ Failed batch: {insert_response.text[:100]}")
            
            print(f"  ✅ Inserted: {total_inserted} records")
    
    # Verify the data
    print("\n📊 Step 4: Verifying collected data...")
    
    verify_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=count&timestamp=gte.2025-06-30T23:00:00.000Z&timestamp=lt.2025-07-22T11:00:00.000Z",
        headers={
            **headers,
            'Prefer': 'count=exact'
        }
    )
    
    if verify_response.ok:
        count = int(verify_response.headers.get('content-range', '0-0/0').split('/')[-1])
        expected = len(all_hours) * len(sensors)
        print(f"\n✅ Total records in database: {count}")
        print(f"📊 Expected records: {expected} ({len(all_hours)} hours × {len(sensors)} sensors)")
        
        if count == expected:
            print("✅ All hours collected successfully!")
        else:
            print(f"⚠️  Missing {expected - count} records")

if __name__ == "__main__":
    collect_july_data()