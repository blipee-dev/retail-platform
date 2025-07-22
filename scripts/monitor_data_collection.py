#!/usr/bin/env python3
"""Monitor real-time data collection"""

import requests
import time
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def monitor():
    """Monitor data collection"""
    print("📊 Monitoring data collection...")
    print("Press Ctrl+C to stop")
    print("=" * 60)
    
    last_count = 0
    
    while True:
        try:
            # Get count
            response = requests.head(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*",
                headers={**headers, 'Prefer': 'count=exact'}
            )
            
            if response.ok:
                count = int(response.headers.get('content-range', '0/0').split('/')[-1])
                
                if count != last_count:
                    # Get latest records
                    response = requests.get(
                        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=timestamp,sensor_id,total_in,total_out,created_at&order=created_at.desc&limit=5",
                        headers=headers
                    )
                    
                    if response.ok and response.json():
                        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Total records: {count} (+{count - last_count})")
                        print("\nLatest records:")
                        for record in response.json():
                            print(f"  {record['timestamp'][:19]} - IN: {record['total_in']}, OUT: {record['total_out']}")
                    
                    last_count = count
                else:
                    print(f"\r[{datetime.now().strftime('%H:%M:%S')}] Waiting... (Current: {count} records)", end='', flush=True)
            
            time.sleep(10)  # Check every 10 seconds
            
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            break
        except Exception as e:
            print(f"\nError: {e}")
            time.sleep(10)

if __name__ == "__main__":
    monitor()