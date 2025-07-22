#!/usr/bin/env python3
"""Check the structure of hourly_analytics table"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def check_table_structure():
    """Check the columns of hourly_analytics table"""
    print("🔍 Checking hourly_analytics table structure...")
    
    # Get one row to see columns
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/hourly_analytics?select=*&limit=1",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        if data:
            print("\nColumns in hourly_analytics:")
            for key in data[0].keys():
                print(f"  - {key}")
        else:
            print("\nTable exists but is empty. Let me check another way...")
            
            # Try to insert a dummy row to see error message with columns
            test_data = {"dummy": "test"}
            response = requests.post(
                f"{SUPABASE_URL}/rest/v1/hourly_analytics",
                headers=headers,
                json=test_data
            )
            print(f"\nError response (this shows required columns):")
            print(response.text)
    else:
        print(f"Error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    check_table_structure()