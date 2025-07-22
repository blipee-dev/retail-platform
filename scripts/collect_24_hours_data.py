#!/usr/bin/env python3
"""Collect last 24 hours of data from all sensors"""

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

def get_sensors():
    """Get all active sensors"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers=headers
    )
    
    if response.ok:
        return response.json()
    else:
        print(f"Error fetching sensors: {response.status_code}")
        return []

def collect_sensor_data(sensor, hours=24):
    """Collect data from a sensor for the specified hours"""
    print(f"\n📡 Collecting from {sensor['sensor_name']}...")
    
    # Calculate time range
    now = datetime.now()
    start_time = now - timedelta(hours=hours)
    
    # Format for Milesight API
    time_start = start_time.strftime("%Y-%m-%d-%H:%M:%S")
    time_end = now.strftime("%Y-%m-%d-%H:%M:%S")
    
    # Build URL
    url = f"http://{sensor['sensor_ip']}:{sensor['sensor_port']}{sensor['api_endpoint']}"
    params = {
        'dw': 'vcalogcsv',
        'report_type': '0',
        'statistics_type': '3',
        'linetype': '31',
        'time_start': time_start,
        'time_end': time_end
    }
    
    # Get credentials from config
    config = sensor.get('config', {})
    credentials = config.get('credentials', {})
    username = credentials.get('username', 'admin')
    password = credentials.get('password', 'grnl.2024')
    
    # Create auth header
    auth_string = base64.b64encode(f"{username}:{password}".encode()).decode('utf-8')
    request_headers = {
        'Authorization': f'Basic {auth_string}'
    }
    
    records_to_insert = []
    
    try:
        # Note: This will fail from Codespaces due to network restrictions
        response = requests.get(url, params=params, headers=request_headers, timeout=30)
        
        if response.ok:
            csv_reader = csv.reader(StringIO(response.text))
            headers_row = next(csv_reader, None)
            
            for row in csv_reader:
                if len(row) >= 17:
                    timestamp = datetime.strptime(row[0], "%Y%m%d%H%M%S")
                    
                    record = {
                        "sensor_id": sensor['id'],
                        "organization_id": sensor['organization_id'],
                        "store_id": sensor['store_id'],
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
        else:
            print(f"   ❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Connection error: {e}")
        print("   Note: Direct sensor access doesn't work from Codespaces")
        return []
    
    return records_to_insert

def insert_records(records):
    """Insert records into Supabase"""
    if not records:
        return
    
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
        else:
            print(f"   ❌ Insert error: {response.status_code} - {response.text}")
    
    print(f"   ✅ Inserted {total_inserted} records")
    return total_inserted

def main():
    print("🚀 Collecting 24 hours of sensor data...")
    print("=" * 60)
    
    # Get sensors
    sensors = get_sensors()
    print(f"\nFound {len(sensors)} active sensors")
    
    if not sensors:
        print("❌ No active sensors found!")
        return
    
    # Note about Codespaces limitation
    print("\n⚠️  WARNING: This script won't work from Codespaces due to network restrictions.")
    print("The sensors are behind NAT/firewalls and can only be accessed from:")
    print("1. GitHub Actions (running on GitHub's infrastructure)")
    print("2. Your local machine (if on the same network)")
    print("3. Cloud services with proper network access")
    
    print("\n📋 Alternative: Use GitHub Actions")
    print("1. Go to: https://github.com/blipee-dev/retail-platform/actions")
    print("2. Click on 'Direct Sensor Data Collection' workflow")
    print("3. Click 'Run workflow' button")
    print("4. This will trigger immediate data collection")
    
    # Try anyway (will fail from Codespaces)
    total_records = 0
    for sensor in sensors:
        records = collect_sensor_data(sensor, hours=24)
        if records:
            inserted = insert_records(records)
            total_records += inserted
    
    print(f"\n✅ Total records collected: {total_records}")

if __name__ == "__main__":
    main()