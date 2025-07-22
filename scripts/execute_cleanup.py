#!/usr/bin/env python3
"""Execute database cleanup"""

import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Prefer': 'return=minimal'
}

def cleanup_database():
    """Clean all sensor data"""
    print("🧹 Cleaning database...")
    print("=" * 60)
    
    tables = [
        'daily_analytics',
        'hourly_analytics', 
        'people_counting_data',
        'people_counting_raw'
    ]
    
    for table in tables:
        print(f"\nDeleting from {table}...")
        response = requests.delete(
            f"{SUPABASE_URL}/rest/v1/{table}?id=not.is.null",
            headers=headers
        )
        
        if response.ok:
            print(f"✅ Cleaned {table}")
        else:
            print(f"❌ Failed to clean {table}: {response.status_code}")
    
    # Verify counts
    print("\n📊 Verifying cleanup:")
    for table in tables:
        response = requests.head(
            f"{SUPABASE_URL}/rest/v1/{table}?select=*",
            headers={**headers, 'Prefer': 'count=exact'}
        )
        
        if response.ok:
            count = int(response.headers.get('content-range', '0/0').split('/')[-1])
            print(f"  {table}: {count} records")

if __name__ == "__main__":
    cleanup_database()
    print("\n✅ Database cleaned!")
    print("\n📌 Next steps:")
    print("1. Go to: https://github.com/blipee-dev/retail-platform/actions")
    print("2. Click 'Direct Sensor Data Collection' workflow")
    print("3. Click 'Run workflow' button")
    print("4. The workflow will now collect the last 24 hours of data")