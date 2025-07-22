#!/usr/bin/env python3
"""Monitor data collection live with detailed progress"""

import requests
import time
from datetime import datetime, timedelta
from collections import defaultdict

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def monitor():
    """Monitor data collection with live updates"""
    print("🔄 Live Data Collection Monitor")
    print("=" * 80)
    print("Press Ctrl+C to stop\n")
    
    last_count = 0
    last_sensor_counts = defaultdict(int)
    start_time = datetime.now()
    
    while True:
        try:
            # Get total count
            response = requests.head(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*",
                headers={**headers, 'Prefer': 'count=exact'}
            )
            
            if response.ok:
                total_count = int(response.headers.get('content-range', '0/0').split('/')[-1])
                
                # Get per-sensor counts
                sensor_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=id,sensor_name",
                    headers=headers
                )
                
                if sensor_response.ok:
                    sensors = sensor_response.json()
                    current_sensor_counts = {}
                    
                    for sensor in sensors:
                        count_response = requests.head(
                            f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&select=*",
                            headers={**headers, 'Prefer': 'count=exact'}
                        )
                        if count_response.ok:
                            count = int(count_response.headers.get('content-range', '0/0').split('/')[-1])
                            current_sensor_counts[sensor['sensor_name']] = count
                    
                    # Show update if counts changed
                    if total_count != last_count or current_sensor_counts != last_sensor_counts:
                        print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Update detected!")
                        print(f"Total records: {total_count} (+{total_count - last_count})")
                        
                        print("\nPer sensor:")
                        for name, count in current_sensor_counts.items():
                            old_count = last_sensor_counts.get(name, 0)
                            diff = count - old_count
                            if diff > 0:
                                print(f"  ✅ {name}: {count} records (+{diff} new)")
                            else:
                                print(f"  · {name}: {count} records")
                        
                        # Calculate collection rate
                        elapsed = (datetime.now() - start_time).total_seconds()
                        if elapsed > 0 and total_count > 0:
                            rate = total_count / (elapsed / 60)  # records per minute
                            eta_24h = (24 * 4 * 24 - total_count) / rate if rate > 0 else 0  # 4 sensors * 24 hours * 24 records/hour
                            print(f"\n📈 Collection rate: {rate:.1f} records/minute")
                            if eta_24h > 0:
                                print(f"⏱️  ETA for 24h data: {eta_24h:.0f} minutes")
                        
                        last_count = total_count
                        last_sensor_counts = current_sensor_counts
                    else:
                        print(f"\r[{datetime.now().strftime('%H:%M:%S')}] Waiting... (Current: {total_count} records)", end='', flush=True)
                
                time.sleep(5)  # Check every 5 seconds
                
        except KeyboardInterrupt:
            print("\n\nMonitoring stopped.")
            break
        except Exception as e:
            print(f"\nError: {e}")
            time.sleep(5)

if __name__ == "__main__":
    monitor()