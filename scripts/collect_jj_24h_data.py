#!/usr/bin/env python3
"""Collect last 24 hours of data from J&J store sensor"""

import requests
import json
import base64
from datetime import datetime, timedelta
from io import StringIO
import csv

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

# J&J Store configuration
JJ_SENSOR = {
    "name": "J&J Arrábida",
    "ip": "188.82.28.148",
    "port": "2102",
    "username": "admin",
    "password": "grnl.2024",
    "endpoint": "/dataloader.cgi"
}

def test_connection():
    """Test connection to J&J sensor"""
    print("🔍 Testing connection to J&J sensor...")
    url = f"http://{JJ_SENSOR['ip']}:{JJ_SENSOR['port']}"
    
    try:
        # Try a simple HEAD request first
        response = requests.head(url, timeout=5)
        print(f"   ✅ Sensor is reachable at {url}")
        return True
    except Exception as e:
        print(f"   ❌ Cannot reach sensor: {e}")
        return False

def get_sensor_metadata():
    """Get J&J sensor metadata from database"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?sensor_name=eq.J%26J-ARR-01-PC&select=*",
        headers=headers
    )
    
    if response.ok and response.json():
        return response.json()[0]
    else:
        print("❌ Could not find J&J sensor in database")
        return None

def collect_sensor_data(sensor_meta, hours=24):
    """Collect data from J&J sensor"""
    print(f"\n📡 Collecting last {hours} hours from {JJ_SENSOR['name']}...")
    
    # Calculate time range
    now = datetime.now()
    start_time = now - timedelta(hours=hours)
    
    # Format for Milesight API
    time_start = start_time.strftime("%Y-%m-%d-%H:%M:%S")
    time_end = now.strftime("%Y-%m-%d-%H:%M:%S")
    
    print(f"   📅 Time range: {time_start} to {time_end}")
    
    # Build URL
    url = f"http://{JJ_SENSOR['ip']}:{JJ_SENSOR['port']}{JJ_SENSOR['endpoint']}"
    params = {
        'dw': 'vcalogcsv',
        'report_type': '0',
        'statistics_type': '3',
        'linetype': '31',
        'time_start': time_start,
        'time_end': time_end
    }
    
    # Create auth header
    auth_string = base64.b64encode(f"{JJ_SENSOR['username']}:{JJ_SENSOR['password']}".encode()).decode('utf-8')
    request_headers = {
        'Authorization': f'Basic {auth_string}'
    }
    
    records_to_insert = []
    
    try:
        print("   🔄 Fetching data from sensor...")
        response = requests.get(url, params=params, headers=request_headers, timeout=30)
        
        if response.ok:
            # Parse CSV data
            csv_reader = csv.reader(StringIO(response.text))
            headers_row = next(csv_reader, None)
            
            for row in csv_reader:
                if len(row) >= 17:
                    timestamp = datetime.strptime(row[0], "%Y%m%d%H%M%S")
                    
                    record = {
                        "sensor_id": sensor_meta['id'],
                        "organization_id": sensor_meta['organization_id'],
                        "store_id": sensor_meta['store_id'],
                        "timestamp": timestamp.isoformat(),
                        "end_time": timestamp.isoformat(),
                        "line1_in": int(row[5]) if row[5].strip() else 0,
                        "line1_out": int(row[6]) if row[6].strip() else 0,
                        "line2_in": int(row[8]) if row[8].strip() else 0,
                        "line2_out": int(row[9]) if row[9].strip() else 0,
                        "line3_in": int(row[11]) if row[11].strip() else 0,
                        "line3_out": int(row[12]) if row[12].strip() else 0,
                        "line4_in": int(row[14]) if row[14].strip() else 0,
                        "line4_out": int(row[15]) if row[15].strip() else 0,
                        "total_in": 0,
                        "total_out": 0
                    }
                    
                    # Calculate totals
                    record['total_in'] = (record['line1_in'] + record['line2_in'] + 
                                         record['line3_in'] + record['line4_in'])
                    record['total_out'] = (record['line1_out'] + record['line2_out'] + 
                                          record['line3_out'] + record['line4_out'])
                    
                    records_to_insert.append(record)
            
            print(f"   ✅ Retrieved {len(records_to_insert)} records")
            
            # Show sample of data
            if records_to_insert:
                first = records_to_insert[0]
                last = records_to_insert[-1]
                print(f"   📊 First record: {first['timestamp']} - In: {first['total_in']}, Out: {first['total_out']}")
                print(f"   📊 Last record:  {last['timestamp']} - In: {last['total_in']}, Out: {last['total_out']}")
        else:
            print(f"   ❌ HTTP Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out - sensor might be unreachable")
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Connection error: {e}")
        print("\n   ⚠️  Note: This error is expected from Codespaces!")
        print("   Sensors are behind NAT/firewalls and cannot be accessed from here.")
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
    
    return records_to_insert

def insert_records(records):
    """Insert records into Supabase"""
    if not records:
        return 0
    
    print(f"\n💾 Inserting {len(records)} records into database...")
    
    # Insert in batches of 100
    batch_size = 100
    total_inserted = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            headers=headers,
            json=batch
        )
        
        if response.ok:
            total_inserted += len(batch)
            print(f"   ✅ Batch {i//batch_size + 1}: Inserted {len(batch)} records")
        else:
            print(f"   ❌ Insert error: {response.status_code} - {response.text}")
    
    return total_inserted

def trigger_github_action():
    """Provide instructions to trigger GitHub Action"""
    print("\n🚀 Alternative: Trigger GitHub Action")
    print("Since direct sensor access doesn't work from Codespaces, you can:")
    print("\n1. Use GitHub CLI:")
    print("   gh workflow run collect-sensor-data.yml")
    print("\n2. Or via web interface:")
    print("   https://github.com/blipee-dev/retail-platform/actions/workflows/collect-sensor-data.yml")
    print("   Click 'Run workflow' button")

def main():
    print("🏪 J&J Store Data Collection (Last 24 Hours)")
    print("=" * 60)
    
    # Get sensor metadata
    sensor_meta = get_sensor_metadata()
    if not sensor_meta:
        print("❌ Cannot proceed without sensor metadata")
        return
    
    print(f"✅ Found sensor: {sensor_meta['sensor_name']} (ID: {sensor_meta['id']})")
    
    # Test connection first
    if not test_connection():
        print("\n❌ Cannot connect to sensor from Codespaces")
        trigger_github_action()
        return
    
    # Collect data
    records = collect_sensor_data(sensor_meta, hours=24)
    
    if records:
        # Insert into database
        total_inserted = insert_records(records)
        print(f"\n✅ Successfully collected and inserted {total_inserted} records!")
    else:
        print("\n❌ No data collected")
        trigger_github_action()

if __name__ == "__main__":
    main()