#!/usr/bin/env python3
"""Check table constraints for people_counting_raw"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

# Query to check constraints
query = """
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'people_counting_raw'::regclass
ORDER BY conname;
"""

response = requests.post(
    f"{SUPABASE_URL}/rest/v1/rpc/query",
    json={"query": query},
    headers=headers
)

print("🔍 Checking Constraints on people_counting_raw")
print("=" * 80)

if response.ok:
    print("Table constraints:")
    for row in response.json():
        print(f"\n{row['constraint_name']}:")
        print(f"  {row['constraint_definition']}")
else:
    # Try alternate approach - check if there's a unique constraint
    print("Direct query failed, checking via API...")
    
    # Try duplicate insert to see error
    test_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?sensor_name=eq.OML01-PC&select=id,organization_id,store_id",
        headers=headers
    )
    
    if test_response.ok and test_response.json():
        sensor = test_response.json()[0]
        
        # Try to insert duplicate
        duplicate_data = {
            "sensor_id": sensor['id'],
            "organization_id": sensor['organization_id'],
            "store_id": sensor['store_id'],
            "timestamp": "2025-07-22T11:00:00.000Z",
            "end_time": "2025-07-22T11:59:59.000Z",
            "line1_in": 999,
            "line1_out": 999,
            "line2_in": 0,
            "line2_out": 0,
            "line3_in": 0,
            "line3_out": 0,
            "line4_in": 999,
            "line4_out": 999
        }
        
        insert_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            json=duplicate_data,
            headers=headers
        )
        
        if not insert_response.ok:
            print(f"\nDuplicate insert error: {insert_response.status_code}")
            print(f"Error details: {insert_response.text}")
            
            if "duplicate key" in insert_response.text:
                print("\n✅ Table has unique constraint preventing duplicates")
            else:
                print("\n❓ Unexpected error")