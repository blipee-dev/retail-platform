#!/usr/bin/env python3
"""Collect missing July data (July 14 21:00 to July 22 11:59)"""

import http.client
import base64
import requests
from datetime import datetime, timedelta
import time

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def collect_sensor_batch(sensor, start_date, end_date):
    """Collect data for date range"""
    records = []
    
    try:
        conn = http.client.HTTPConnection(sensor['sensor_ip'], sensor['sensor_port'], timeout=30)
        
        path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={start_date.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={end_date.strftime('%Y-%m-%d-%H:%M:%S')}"
        
        headers_req = {
            'Authorization': f'Basic {base64.b64encode(b"admin:grnl.2024").decode()}'
        }
        
        conn.request("GET", path, headers=headers_req)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            for i in range(1, len(lines)):
                parts = lines[i].split(',')
                if len(parts) >= 17:
                    # Parse timestamp
                    local_timestamp = datetime.strptime(parts[0].strip(), "%Y/%m/%d %H:%M:%S")
                    
                    # Only include data within our target range
                    if start_date <= local_timestamp <= end_date:
                        # Convert to UTC
                        utc_timestamp = local_timestamp - timedelta(hours=1)
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
        
        conn.close()
        
    except Exception as e:
        print(f"    ⚠️  Error: {str(e)}")
    
    return records

def collect_missing_data():
    """Collect missing July data"""
    print("📊 Collecting Missing July 2025 Data")
    print("=" * 80)
    print("Period: July 14 21:00 to July 22 11:59 (local time)")
    
    # Get sensors
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*&order=sensor_name",
        headers=headers
    )
    
    sensors = [s for s in sensors_response.json() if "J&J" not in s['sensor_name']]
    print(f"Found {len(sensors)} sensors")
    
    # Define missing period (local time)
    start_local = datetime(2025, 7, 14, 21, 0, 0)
    end_local = datetime(2025, 7, 22, 11, 59, 59)
    
    all_records = []
    
    for sensor in sensors:
        print(f"\n📡 Processing {sensor['sensor_name']}...")
        
        # Collect in smaller batches to avoid timeouts
        current = start_local
        sensor_records = []
        
        while current < end_local:
            batch_end = min(current + timedelta(days=2), end_local)
            print(f"  Collecting {current.strftime('%Y-%m-%d %H:%M')} to {batch_end.strftime('%Y-%m-%d %H:%M')}...")
            
            records = collect_sensor_batch(sensor, current, batch_end)
            sensor_records.extend(records)
            print(f"    Got {len(records)} records")
            
            current = batch_end + timedelta(seconds=1)
            time.sleep(0.5)  # Avoid overwhelming sensor
        
        print(f"  Total: {len(sensor_records)} records")
        all_records.extend(sensor_records)
    
    # Insert all records
    print(f"\n💾 Inserting {len(all_records)} records...")
    
    if all_records:
        # Sort by timestamp
        all_records.sort(key=lambda x: x['timestamp'])
        
        # Insert in batches
        batch_size = 500
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
                print(f"  Batch {i//batch_size + 1}: ✅ ({len(batch)} records)")
            else:
                print(f"  Batch {i//batch_size + 1}: ❌")
                print(f"    {insert_response.text[:200]}")
        
        print(f"\n✅ Inserted {total_inserted} records")
    
    # Final verification
    print("\n📊 Final verification...")
    verify_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=count&timestamp=gte.2025-06-30T23:00:00.000Z&timestamp=lt.2025-07-22T11:00:00.000Z",
        headers={
            **headers,
            'Prefer': 'count=exact'
        }
    )
    
    if verify_response.ok:
        count = int(verify_response.headers.get('content-range', '0-0/0').split('/')[-1])
        expected_hours = 21 * 24 + 12  # 21 full days + 12 hours on the 22nd = 516 hours
        expected_records = expected_hours * len(sensors)  # 516 * 3 = 1548
        
        print(f"Total records: {count}")
        print(f"Expected: {expected_records} ({expected_hours} hours × {len(sensors)} sensors)")
        
        if count >= expected_records:
            print("✅ All July data collected successfully!")
        else:
            print(f"⚠️  Still missing {expected_records - count} records")

if __name__ == "__main__":
    collect_missing_data()