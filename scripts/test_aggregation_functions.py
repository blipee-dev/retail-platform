#!/usr/bin/env python3
"""Test aggregation functions in Supabase"""

import requests
import json

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def call_function(function_name):
    """Call a database function"""
    print(f"\n🔧 Calling function: {function_name}()")
    print("-" * 50)
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/{function_name}",
        headers=headers,
        json={}
    )
    
    if response.ok:
        result = response.json()
        print(f"✅ Success: {result}")
        return True
    else:
        print(f"❌ Error {response.status_code}: {response.text}")
        return False

def check_hourly_analytics():
    """Check hourly_analytics table after aggregation"""
    print("\n📊 Checking hourly_analytics table...")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/hourly_analytics?select=*&order=hour_start.desc.nullsfirst,date.desc.nullsfirst,hour.desc.nullsfirst&limit=5",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        if data:
            print(f"Found {len(data)} recent records:")
            for record in data:
                if 'hour_start' in record:
                    print(f"  - {record['hour_start']}: {record.get('total_entries', 0)} IN, {record.get('total_exits', 0)} OUT")
                elif 'date' in record and 'hour' in record:
                    print(f"  - {record['date']} Hour {record['hour']}: {record.get('total_in', 0)} IN, {record.get('total_out', 0)} OUT")
                else:
                    print(f"  - Unknown format: {list(record.keys())[:5]}...")
        else:
            print("No records found")

def check_daily_analytics():
    """Check daily_analytics table after aggregation"""
    print("\n📊 Checking daily_analytics table...")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/daily_analytics?select=*&order=date.desc&limit=5",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        if data:
            print(f"Found {len(data)} recent records:")
            for record in data:
                print(f"  - {record['date']}: {record.get('total_in', 0)} IN, {record.get('total_out', 0)} OUT")
        else:
            print("No records found")

def main():
    print("🔍 Testing Supabase aggregation functions...")
    print("=" * 60)
    
    # Check if we have source data
    print("\n📊 Checking source data in people_counting_data...")
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_data?select=timestamp,total_in,total_out&order=timestamp.desc&limit=5",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        if data:
            print(f"Found {len(data)} recent records:")
            for record in data:
                print(f"  - {record['timestamp']}: {record['total_in']} IN, {record['total_out']} OUT")
        else:
            print("No source data found!")
            return
    
    # Try to run aggregation functions
    functions_to_test = [
        "run_hourly_aggregation",
        "run_daily_aggregation",
        "run_all_aggregations",
        "aggregate_hourly_analytics",
        "aggregate_daily_analytics"
    ]
    
    for func in functions_to_test:
        if call_function(func):
            # If successful, check the results
            if "hourly" in func:
                check_hourly_analytics()
            elif "daily" in func:
                check_daily_analytics()
            elif "all" in func:
                check_hourly_analytics()
                check_daily_analytics()
            break
    
    print("\n" + "=" * 60)
    print("✅ Testing complete!")

if __name__ == "__main__":
    main()