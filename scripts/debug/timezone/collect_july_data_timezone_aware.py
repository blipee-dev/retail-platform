#!/usr/bin/env python3
"""Collect all July 2025 data with timezone awareness"""

import http.client
import base64
import requests
from datetime import datetime, timedelta, timezone
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

def detect_sensor_timezone(sensor):
    """Detect sensor timezone by analyzing its data"""
    print(f"  🕐 Detecting timezone for {sensor['sensor_name']}...")
    
    try:
        # Get current UTC time
        now_utc = datetime.now(timezone.utc)
        one_hour_ago = now_utc - timedelta(hours=1)
        
        # Query sensor
        conn = http.client.HTTPConnection(sensor['sensor_ip'], sensor['sensor_port'], timeout=10)
        
        # Format for sensor query
        path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={one_hour_ago.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={now_utc.strftime('%Y-%m-%d-%H:%M:%S')}"
        
        headers_req = {
            'Authorization': f'Basic {base64.b64encode(b"admin:grnl.2024").decode()}'
        }
        
        conn.request("GET", path, headers=headers_req)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            # Look for recent data with activity
            for i in range(1, len(lines)):
                parts = lines[i].split(',')
                if len(parts) >= 17:
                    total_in = sum(int(parts[j].strip()) if parts[j].strip() else 0 for j in [5, 8, 11, 14])
                    if total_in > 0:
                        # Parse sensor timestamp
                        sensor_time_str = parts[0].strip()
                        sensor_time = datetime.strptime(sensor_time_str, "%Y/%m/%d %H:%M:%S")
                        
                        # Compare hours to estimate offset
                        hour_diff = sensor_time.hour - now_utc.hour
                        
                        # Handle day boundary
                        if hour_diff > 12:
                            hour_diff -= 24
                        elif hour_diff < -12:
                            hour_diff += 24
                        
                        print(f"    Detected offset: {hour_diff} hours (sensor shows {sensor_time.hour}:00, UTC is {now_utc.hour}:00)")
                        return hour_diff
        
        conn.close()
    except Exception as e:
        print(f"    ⚠️  Could not detect timezone: {str(e)}")
    
    # Default to UTC+1 (Portugal)
    print("    Using default: UTC+1 (Portugal timezone)")
    return 1

def collect_july_data():
    """Collect all July data with timezone awareness"""
    print("📊 July 2025 Data Collection with Timezone Awareness")
    print("=" * 80)
    
    # First, let's delete existing July data
    print("\n🗑️  Step 1: Deleting existing July 2025 data...")
    
    delete_response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-01T00:00:00.000Z&timestamp=lt.2025-08-01T00:00:00.000Z",
        headers=headers
    )
    
    if delete_response.ok:
        print("✅ Existing July data deleted")
    else:
        print(f"⚠️  Delete failed: {delete_response.status_code}")
    
    # Get active sensors
    print("\n📡 Step 2: Getting active sensors...")
    sensors_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers=headers
    )
    
    if not sensors_response.ok:
        print("❌ Failed to get sensors")
        return
    
    sensors = sensors_response.json()
    print(f"Found {len(sensors)} active sensors")
    
    # Process each sensor
    all_records = []
    
    for sensor in sensors:
        print(f"\n📡 Processing {sensor['sensor_name']}...")
        
        # Detect timezone
        tz_offset = detect_sensor_timezone(sensor)
        
        # Define date range in LOCAL time
        # Start: July 1, 2025 00:00:00 local time
        # End: July 22, 2025 11:59:59 local time
        
        # Convert to sensor's expected format by adjusting for timezone
        # If sensor is UTC+1, and we want July 1 00:00 local, we query July 1 00:00
        start_local = datetime(2025, 7, 1, 0, 0, 0)
        end_local = datetime(2025, 7, 22, 11, 59, 59)
        
        print(f"  📅 Querying from {start_local} to {end_local} (local time)")
        
        # Format for sensor API
        start_str = start_local.strftime('%Y-%m-%d-%H:%M:%S')
        end_str = end_local.strftime('%Y-%m-%d-%H:%M:%S')
        
        try:
            conn = http.client.HTTPConnection(sensor['sensor_ip'], sensor['sensor_port'], timeout=30)
            
            path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={start_str}&time_end={end_str}"
            
            headers_req = {
                'Authorization': f'Basic {base64.b64encode(b"admin:grnl.2024").decode()}'
            }
            
            print(f"  🔄 Fetching data...")
            conn.request("GET", path, headers=headers_req)
            response = conn.getresponse()
            
            if response.status == 200:
                data = response.read().decode('utf-8')
                lines = data.strip().split('\n')
                
                print(f"  ✅ Got {len(lines)-1} records")
                
                # Parse records
                sensor_records = []
                for i in range(1, len(lines)):
                    parts = lines[i].split(',')
                    if len(parts) >= 17:
                        try:
                            # Parse as local time
                            local_timestamp = datetime.strptime(parts[0].strip(), "%Y/%m/%d %H:%M:%S")
                            
                            # Convert to UTC for storage
                            utc_timestamp = local_timestamp - timedelta(hours=tz_offset)
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
                            
                            sensor_records.append(record)
                            
                        except Exception as e:
                            print(f"    ⚠️  Error parsing line {i}: {str(e)}")
                
                print(f"  📊 Parsed {len(sensor_records)} valid records")
                
                # Batch insert records
                if sensor_records:
                    # Split into batches of 500
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
                            print(f"    ✅ Inserted batch {i//batch_size + 1}: {len(batch)} records")
                        else:
                            print(f"    ❌ Failed batch {i//batch_size + 1}: {insert_response.status_code}")
                            print(f"       {insert_response.text}")
                        
                        # Small delay between batches
                        time.sleep(0.5)
                    
                    print(f"  ✅ Total inserted: {total_inserted} records")
                    all_records.extend(sensor_records)
                
            else:
                print(f"  ❌ HTTP {response.status}: {response.reason}")
            
            conn.close()
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 Collection Summary:")
    print(f"Total records collected: {len(all_records)}")
    
    # Show sample of data
    if all_records:
        print("\nSample records (first 5):")
        for i, record in enumerate(all_records[:5]):
            local_time = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00')) + timedelta(hours=1)
            total_in = record['line1_in'] + record['line2_in'] + record['line3_in'] + record['line4_in']
            total_out = record['line1_out'] + record['line2_out'] + record['line3_out'] + record['line4_out']
            print(f"  {local_time.strftime('%Y-%m-%d %H:%M')} local: {total_in} IN, {total_out} OUT")

if __name__ == "__main__":
    collect_july_data()