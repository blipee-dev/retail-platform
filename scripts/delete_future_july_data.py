#!/usr/bin/env python3
"""Delete July 22 data after 11:59 local time (10:59 UTC)"""

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

def delete_extra_data():
    """Delete data after July 22 11:59 local time"""
    print("🗑️  Deleting Extra July 22 Data")
    print("=" * 80)
    print("Target: Delete all data from July 22 12:00 local time onwards")
    print("(This is July 22 11:00 UTC onwards)")
    print()
    
    # July 22 12:00 local time = July 22 11:00 UTC
    delete_from = "2025-07-22T11:00:00.000Z"
    
    # First check what we're deleting
    check_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.{delete_from}&select=timestamp,sensor_metadata(sensor_name)&order=timestamp",
        headers=headers
    )
    
    if check_response.ok:
        data = check_response.json()
        print(f"Found {len(data)} records to delete")
        
        if data:
            # Show summary
            first = datetime.fromisoformat(data[0]['timestamp'].replace('Z', '+00:00'))
            last = datetime.fromisoformat(data[-1]['timestamp'].replace('Z', '+00:00'))
            
            print(f"\nRange to delete:")
            print(f"  First: {first.strftime('%Y-%m-%d %H:%M')} UTC ({(first.hour + 1) % 24}:00 local)")
            print(f"  Last: {last.strftime('%Y-%m-%d %H:%M')} UTC ({(last.hour + 1) % 24}:00 local)")
            
            # Delete the records
            print(f"\n🔄 Deleting records...")
            
            delete_response = requests.delete(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.{delete_from}",
                headers=headers
            )
            
            if delete_response.ok:
                print(f"✅ Successfully deleted {len(data)} records")
                
                # Verify final state
                print("\n📊 Verifying final data...")
                
                # Get last timestamp
                last_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp&order=timestamp.desc&limit=1",
                    headers=headers
                )
                
                if last_response.ok and last_response.json():
                    last_record = last_response.json()[0]
                    last_time = datetime.fromisoformat(last_record['timestamp'].replace('Z', '+00:00'))
                    print(f"\nLast record in database:")
                    print(f"  {last_time.strftime('%Y-%m-%d %H:%M')} UTC ({(last_time.hour + 1) % 24}:00 local)")
                    
                    if last_time.strftime('%Y-%m-%d %H:%M') == "2025-07-22 10:00":
                        print("\n✅ Perfect! Data now ends at July 22 11:00 local time as requested")
                    else:
                        print("\n⚠️  Unexpected last timestamp")
                
                # Get total count
                count_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=count",
                    headers={
                        **headers,
                        'Prefer': 'count=exact'
                    }
                )
                
                if count_response.ok:
                    count = int(count_response.headers.get('content-range', '0-0/0').split('/')[-1])
                    print(f"\nTotal records remaining: {count}")
                
            else:
                print(f"❌ Delete failed: {delete_response.status_code}")
                print(delete_response.text)
        else:
            print("No records found to delete")
    else:
        print(f"❌ Check failed: {check_response.status_code}")

if __name__ == "__main__":
    delete_extra_data()