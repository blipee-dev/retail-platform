#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Supabase credentials
SUPABASE_URL = "https://kqfwccpnqcgxuydvmdvb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZndjY3BucWNneHV5ZHZtZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI2NjI0NiwiZXhwIjoyMDQ4ODQyMjQ2fQ.IQJGfAJJKJgNy-ANaRsJvBjO6N7Dc0W7I6bG8w2NTIE"

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "count=exact"
}

def check_data():
    """Check how much data exists for July 24-25"""
    # Check July 24
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-24T00:00:00.000Z&timestamp=lt.2025-07-25T00:00:00.000Z&select=count",
        headers=headers
    )
    
    if response.status_code == 200:
        july24_count = int(response.headers.get('content-range', '0-0/0').split('/')[-1])
        print(f"July 24 records: {july24_count}")
    else:
        print(f"Error checking July 24: {response.status_code}")
        return
    
    # Check July 25
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-25T00:00:00.000Z&timestamp=lt.2025-07-26T00:00:00.000Z&select=count",
        headers=headers
    )
    
    if response.status_code == 200:
        july25_count = int(response.headers.get('content-range', '0-0/0').split('/')[-1])
        print(f"July 25 records: {july25_count}")
    else:
        print(f"Error checking July 25: {response.status_code}")
        return
    
    return july24_count + july25_count

def delete_data():
    """Delete all data from July 24-25"""
    total_count = check_data()
    
    if total_count == 0:
        print("\nNo data to delete")
        return
    
    print(f"\nDeleting {total_count} records from July 24-25...")
    
    # Delete data
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.2025-07-24T00:00:00.000Z&timestamp=lt.2025-07-26T00:00:00.000Z",
        headers=headers
    )
    
    if response.status_code in [200, 204]:
        print(f"✅ Successfully deleted {total_count} records")
    else:
        print(f"❌ Error deleting: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    import sys
    if "--delete" in sys.argv:
        delete_data()
    else:
        check_data()
        print("\nTo delete, run with --delete flag")