#!/usr/bin/env python3
"""Manually collect 11:00 data to prove it exists"""

import http.client
import base64
from datetime import datetime
import requests

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

def collect_11am():
    """Manually collect 11:00 data"""
    print("🔧 Manually Collecting 11:00 UTC Data")
    print("=" * 80)
    
    # Test one sensor
    sensor = {
        "name": "OML01-PC",
        "id": "f63ef2e9-344e-4373-aedf-04dd05cf8f8b",
        "org_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "store_id": "e3c26903-7da5-4b09-9d43-abf93cd09f74",
        "ip": "93.108.96.96",
        "port": 21001,
        "auth": "admin:grnl.2024"
    }
    
    # Get data for 11:00-12:00
    print(f"\n📡 Getting data from {sensor['name']}...")
    
    try:
        conn = http.client.HTTPConnection(sensor['ip'], sensor['port'], timeout=10)
        
        # Request just the 11:00 hour
        path = "/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-22-11:00:00&time_end=2025-07-22-12:00:00"
        
        headers = {
            'Authorization': f'Basic {base64.b64encode(sensor["auth"].encode()).decode()}'
        }
        
        conn.request("GET", path, headers=headers)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            print(f"✅ Got {len(lines)-1} data records")
            
            if len(lines) > 1:
                print(f"\nCSV Header: {lines[0]}")
                print(f"Data line: {lines[1]}")
                
                # Parse the data
                parts = lines[1].split(',')
                if len(parts) >= 17:
                    timestamp_str = parts[0].strip()
                    total_in = sum(int(parts[i].strip()) if parts[i].strip() else 0 for i in [5, 8, 11, 14])
                    total_out = sum(int(parts[i].strip()) if parts[i].strip() else 0 for i in [6, 9, 12, 15])
                    
                    print(f"\nParsed data:")
                    print(f"  Timestamp: {timestamp_str}")
                    print(f"  Total IN: {total_in}")
                    print(f"  Total OUT: {total_out}")
                    
                    # Now insert it
                    print(f"\n💾 Inserting into database...")
                    
                    record = {
                        "sensor_id": sensor['id'],
                        "organization_id": sensor['org_id'],
                        "store_id": sensor['store_id'],
                        "timestamp": "2025-07-22T11:00:00.000Z",
                        "end_time": "2025-07-22T11:59:59.000Z",
                        "line1_in": int(parts[5].strip()) if parts[5].strip() else 0,
                        "line1_out": int(parts[6].strip()) if parts[6].strip() else 0,
                        "line2_in": int(parts[8].strip()) if parts[8].strip() else 0,
                        "line2_out": int(parts[9].strip()) if parts[9].strip() else 0,
                        "line3_in": int(parts[11].strip()) if parts[11].strip() else 0,
                        "line3_out": int(parts[12].strip()) if parts[12].strip() else 0,
                        "line4_in": int(parts[14].strip()) if parts[14].strip() else 0,
                        "line4_out": int(parts[15].strip()) if parts[15].strip() else 0
                    }
                    
                    headers = {
                        'apikey': SERVICE_ROLE_KEY,
                        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    }
                    
                    insert_response = requests.post(
                        f"{SUPABASE_URL}/rest/v1/people_counting_raw",
                        json=record,
                        headers=headers
                    )
                    
                    if insert_response.ok:
                        print("✅ Successfully inserted 11:00 data!")
                    else:
                        print(f"❌ Insert failed: {insert_response.status_code}")
                        print(f"   {insert_response.text}")
        else:
            print(f"❌ HTTP {response.status}")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    collect_11am()