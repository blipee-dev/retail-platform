#!/usr/bin/env python3
"""Check the actual schema of region_configurations table"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def check_schema():
    """Check region_configurations table schema"""
    print("🔍 Checking region_configurations table schema")
    print("=" * 60)
    
    # Try to get one record to see the structure
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/region_configurations?limit=1",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        if data:
            print("Sample record structure:")
            for key in data[0].keys():
                print(f"  - {key}: {type(data[0][key]).__name__}")
        else:
            print("Table exists but is empty")
            
            # Try to insert a minimal record to see required fields
            test_data = {
                "store_id": "00000000-0000-0000-0000-000000000000",
                "region_id": "test",
                "region_name": "Test Region"
            }
            
            test_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/region_configurations",
                json=test_data,
                headers={**headers, 'Content-Type': 'application/json'}
            )
            
            if not test_response.ok:
                print(f"\nError with minimal insert: {test_response.text}")
                
                # This might give us clues about required fields
    else:
        print(f"Error accessing table: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    check_schema()