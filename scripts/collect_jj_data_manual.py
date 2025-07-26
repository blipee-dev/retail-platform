#!/usr/bin/env python3
"""Manually collect and insert J&J sensor data"""

import requests
import json
from datetime import datetime, timedelta
from io import StringIO
import csv
import sys

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

# J&J sensor metadata from database
JJ_SENSOR_META = {
    "id": "ffc2438a-ee4f-4324-96da-08671ea3b23c",
    "organization_id": "12345678-1234-1234-1234-123456789012",
    "store_id": "d719cc6b-1715-4721-8897-6f6cd0c025b0",
    "name": "J&J-ARR-01-PC"
}

def collect_hourly_data():
    """Collect last 24 hours of hourly data using curl"""
    print("📡 Collecting J&J sensor data...")
    
    # Calculate time range
    now = datetime.now()
    start_time = now - timedelta(hours=24)
    
    # Format for Milesight API
    time_start = start_time.strftime("%Y-%m-%d-%H:%M:%S")
    time_end = now.strftime("%Y-%m-%d-%H:%M:%S")
    
    print(f"   📅 Time range: {time_start} to {time_end}")
    
    # Use curl command since it works
    cmd = f'curl -s -u admin:grnl.2024 "http://188.82.28.148:2102/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={time_start}&time_end={time_end}"'
    
    import subprocess
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"   ❌ Error running curl: {result.stderr}")
        return []
    
    # Parse CSV data
    csv_data = result.stdout
    csv_reader = csv.reader(StringIO(csv_data))
    
    # Skip header
    header = next(csv_reader, None)
    print(f"   📊 CSV Headers: {header}")
    
    records_to_insert = []
    
    for row in csv_reader:
        if len(row) >= 17:
            # Parse timestamps
            start_dt = datetime.strptime(row[0], "%Y/%m/%d %H:%M:%S")
            end_dt = datetime.strptime(row[1], "%Y/%m/%d %H:%M:%S")
            
            # Extract data (don't include total_in/out as they're generated columns)
            record = {
                "sensor_id": JJ_SENSOR_META['id'],
                "organization_id": JJ_SENSOR_META['organization_id'],
                "store_id": JJ_SENSOR_META['store_id'],
                "timestamp": start_dt.isoformat(),
                "end_time": end_dt.isoformat(),
                "line1_in": int(row[5]) if row[5].strip() else 0,
                "line1_out": int(row[6]) if row[6].strip() else 0,
                "line2_in": int(row[8]) if row[8].strip() else 0,
                "line2_out": int(row[9]) if row[9].strip() else 0,
                "line3_in": int(row[11]) if row[11].strip() else 0,
                "line3_out": int(row[12]) if row[12].strip() else 0,
                "line4_in": int(row[14]) if row[14].strip() else 0,
                "line4_out": int(row[15]) if row[15].strip() else 0
            }
            
            # Store totals for display only
            total_in = int(row[2]) if row[2].strip() else 0
            total_out = int(row[3]) if row[3].strip() else 0
            
            records_to_insert.append(record)
            
            # Show sample data
            if len(records_to_insert) <= 3:
                print(f"   📈 {start_dt.strftime('%Y-%m-%d %H:%M')} - In: {total_in}, Out: {total_out}")
    
    print(f"   ✅ Parsed {len(records_to_insert)} records")
    return records_to_insert

def insert_records(records):
    """Insert records into Supabase"""
    if not records:
        return 0
    
    print(f"\n💾 Inserting {len(records)} records into database...")
    
    # Check for existing data to avoid duplicates
    first_timestamp = records[0]['timestamp']
    last_timestamp = records[-1]['timestamp']
    
    # Query existing data
    check_url = f"{SUPABASE_URL}/rest/v1/people_counting_raw"
    check_params = {
        'sensor_id': f'eq.{JJ_SENSOR_META["id"]}',
        'timestamp': f'gte.{first_timestamp}',
        'timestamp': f'lte.{last_timestamp}',
        'select': 'timestamp'
    }
    
    response = requests.get(check_url, headers=headers, params=check_params)
    if response.ok:
        existing = response.json()
        if existing:
            print(f"   ⚠️  Found {len(existing)} existing records in this time range")
            print("   🔄 Proceeding with upsert...")
    
    # Insert in batches with upsert
    batch_size = 100
    total_inserted = 0
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        
        # Use upsert to handle duplicates
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            headers={**headers, 'Prefer': 'resolution=merge-duplicates'},
            json=batch
        )
        
        if response.ok or response.status_code == 201:
            total_inserted += len(batch)
            print(f"   ✅ Batch {i//batch_size + 1}: Inserted {len(batch)} records")
        else:
            print(f"   ❌ Insert error: {response.status_code} - {response.text}")
    
    return total_inserted

def show_summary():
    """Show summary of J&J data in database"""
    print("\n📊 J&J Store Data Summary")
    print("=" * 60)
    
    # Get latest data
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{JJ_SENSOR_META['id']}&select=timestamp,total_in,total_out&order=timestamp.desc&limit=10",
        headers=headers
    )
    
    if response.ok and response.json():
        data = response.json()
        print(f"\n📈 Latest {len(data)} records:")
        for record in data:
            dt = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
            print(f"   {dt.strftime('%Y-%m-%d %H:%M')} - In: {record['total_in']}, Out: {record['total_out']}")
    
    # Get total count
    count_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{JJ_SENSOR_META['id']}&select=count",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    if count_response.ok:
        total_count = int(count_response.headers.get('content-range', '0-0/0').split('/')[-1])
        print(f"\n📊 Total J&J records in database: {total_count}")

def main():
    print("🏪 J&J Store Manual Data Collection")
    print("=" * 60)
    
    # Collect data
    records = collect_hourly_data()
    
    if records:
        # Insert into database
        total_inserted = insert_records(records)
        print(f"\n✅ Successfully processed {total_inserted} records!")
        
        # Show summary
        show_summary()
    else:
        print("\n❌ No data collected")

if __name__ == "__main__":
    main()