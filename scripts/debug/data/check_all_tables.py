#!/usr/bin/env python3
"""Check all tables in Supabase and their data"""

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

def check_table(table_name, description=""):
    """Check a specific table for data"""
    print(f"\n📊 {table_name} {description}")
    print("-" * 50)
    
    # Get count
    response = requests.head(
        f"{SUPABASE_URL}/rest/v1/{table_name}?select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    if response.ok:
        count = response.headers.get('content-range', '').split('/')[-1]
        print(f"Total records: {count}")
        
        # Get sample data
        if count != '0':
            response = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=3&order=created_at.desc.nullsfirst,timestamp.desc.nullsfirst",
                headers=headers
            )
            
            if response.ok and response.json():
                print("\nSample records:")
                for i, record in enumerate(response.json(), 1):
                    print(f"\nRecord {i}:")
                    # Show key fields
                    for key in ['id', 'sensor_id', 'store_id', 'timestamp', 'line1_in', 'line1_out', 
                               'total_in', 'total_out', 'hour', 'date', 'created_at']:
                        if key in record:
                            value = str(record[key])
                            if len(value) > 50:
                                value = value[:47] + "..."
                            print(f"  {key}: {value}")
    else:
        print(f"Error accessing table: {response.status_code}")
        if response.status_code == 404:
            print("Table does not exist")

def main():
    print("🔍 Checking all sensor-related tables in Supabase...")
    print("=" * 60)
    
    # Tables that should contain sensor data
    sensor_tables = [
        ("people_counting_raw", "- Raw sensor data (direct from sensors)"),
        ("people_counting_data", "- Processed/cleaned sensor data"),
        ("hourly_analytics", "- Aggregated hourly statistics"),
        ("daily_analytics", "- Aggregated daily statistics"),
        ("analytics_alerts", "- Generated alerts from analytics"),
        ("sensor_metadata", "- Sensor configuration and details"),
        ("stores", "- Store information"),
        ("organizations", "- Organization/tenant information"),
        ("regions", "- Store regions/zones"),
        ("regional_analytics", "- Analytics by region"),
        ("entrance_exit_analytics", "- Entrance/exit specific analytics"),
        ("occupancy_tracking", "- Real-time occupancy data")
    ]
    
    for table, desc in sensor_tables:
        check_table(table, desc)
    
    print("\n" + "=" * 60)
    print("✅ Database scan complete!")

if __name__ == "__main__":
    main()