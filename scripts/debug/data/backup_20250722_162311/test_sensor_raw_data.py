#!/usr/bin/env python3
"""Test what raw data sensors are returning"""

import requests
import base64
from datetime import datetime, timedelta

def test_sensor(name, ip, port, username, password):
    """Test a single sensor"""
    print(f"\n📡 Testing {name} ({ip}:{port})...")
    
    now = datetime.now()
    one_hour_ago = now - timedelta(hours=1)
    
    # Format dates
    time_start = one_hour_ago.strftime("%Y-%m-%d-%H:%M:%S")
    time_end = now.strftime("%Y-%m-%d-%H:%M:%S")
    
    url = f"http://{ip}:{port}/dataloader.cgi"
    params = {
        'dw': 'vcalogcsv',
        'report_type': '0',
        'statistics_type': '3',
        'linetype': '31',
        'time_start': time_start,
        'time_end': time_end
    }
    
    auth_string = base64.b64encode(f"{username}:{password}".encode()).decode('utf-8')
    headers = {
        'Authorization': f'Basic {auth_string}'
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=30)
        if response.ok:
            lines = response.text.strip().split('\n')
            print(f"   ✅ Got {len(lines)-1} data rows")
            
            # Show raw CSV header and first few rows
            if len(lines) > 0:
                print(f"\n   CSV Header: {lines[0]}")
                print("\n   Sample data rows (raw):")
                for i, line in enumerate(lines[1:6], 1):  # Show first 5 data rows
                    print(f"   Row {i}: {line}")
                    
                # Parse and show interpreted data
                print("\n   Interpreted data:")
                for line in lines[1:4]:  # Show first 3 rows interpreted
                    parts = line.split(',')
                    if len(parts) >= 17:
                        timestamp = parts[0]
                        # The columns are: timestamp, end_time, device_mac, device_name, sub_area,
                        # line1_in, line1_out, line1_name, line2_in, line2_out, line2_name,
                        # line3_in, line3_out, line3_name, line4_in, line4_out, line4_name
                        print(f"\n   {timestamp}:")
                        print(f"     Line 1: IN={parts[5]}, OUT={parts[6]} ({parts[7]})")
                        print(f"     Line 2: IN={parts[8]}, OUT={parts[9]} ({parts[10]})")
                        print(f"     Line 3: IN={parts[11]}, OUT={parts[12]} ({parts[13]})")
                        print(f"     Line 4: IN={parts[14]}, OUT={parts[15]} ({parts[16]})")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Response: {response.text[:200]}...")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def main():
    print("🔍 Testing raw sensor data...")
    print("=" * 50)
    
    # Test each sensor
    sensors = [
        ("J&J Arrábida", "176.79.62.167", 2102, "admin", "grnl.2024"),
        ("Omnia Guimarães", "93.108.96.96", 21001, "admin", "grnl.2024"),
        ("Omnia Almada", "188.37.175.41", 2201, "admin", "grnl.2024"),
        ("Omnia NorteShopping", "188.37.124.33", 21002, "admin", "grnl.2024")
    ]
    
    for sensor in sensors:
        test_sensor(*sensor)

if __name__ == "__main__":
    main()