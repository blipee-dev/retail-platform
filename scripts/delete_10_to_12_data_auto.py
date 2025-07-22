#!/usr/bin/env python3
"""Delete people counting data from 10:00 to 11:59:59 UTC on 2025-07-22"""

import requests
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def delete_data():
    """Delete data from 10:00 to 11:59:59"""
    print("🗑️  Deleting People Counting Data")
    print("=" * 80)
    print("Date: 2025-07-22")
    print("Time range: 10:00:00 to 11:59:59 UTC")
    print()
    
    # First, let's check what data we have in this range
    check_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-22T10:00:00.000Z&timestamp=lt.2025-07-22T12:00:00.000Z&select=timestamp,sensor_metadata(sensor_name),total_in,total_out&order=timestamp",
        headers=headers
    )
    
    if check_response.ok:
        data = check_response.json()
        print(f"Found {len(data)} records to delete:")
        
        for record in data:
            sensor_name = record.get('sensor_metadata', {}).get('sensor_name', 'Unknown')
            timestamp = record['timestamp']
            print(f"  - {sensor_name}: {timestamp} ({record['total_in']} IN, {record['total_out']} OUT)")
        
        if len(data) > 0:
            print("\n🔄 Proceeding with deletion...")
            
            # Delete the records
            delete_response = requests.delete(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-22T10:00:00.000Z&timestamp=lt.2025-07-22T12:00:00.000Z",
                headers=headers
            )
            
            if delete_response.ok:
                print(f"\n✅ Successfully deleted {len(data)} records")
                
                # Verify deletion
                verify_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-22T10:00:00.000Z&timestamp=lt.2025-07-22T12:00:00.000Z&select=id",
                    headers=headers
                )
                
                if verify_response.ok:
                    remaining = verify_response.json()
                    if len(remaining) == 0:
                        print("✅ Verified: All records deleted successfully")
                    else:
                        print(f"⚠️  Warning: {len(remaining)} records still remain")
            else:
                print(f"\n❌ Delete failed: {delete_response.status_code}")
                print(f"   {delete_response.text}")
        else:
            print("\nNo records found in the specified time range")
    else:
        print(f"❌ Failed to fetch data: {check_response.status_code}")
        print(f"   {check_response.text}")

if __name__ == "__main__":
    delete_data()