#!/usr/bin/env python3
"""Test if sensors provide partial hour data"""

import http.client
import base64
from datetime import datetime, timedelta

def test_partial_hour():
    """Test what happens when we query during an hour"""
    print("🔍 Testing Partial Hour Data Collection")
    print("=" * 80)
    
    # Simulate what would happen at different times
    now = datetime.utcnow()
    current_hour_start = now.replace(minute=0, second=0, microsecond=0)
    
    print(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    print(f"Current hour: {current_hour_start.strftime('%H:00')} - {(current_hour_start + timedelta(hours=1)).strftime('%H:00')}")
    
    # Test sensor
    sensor = {
        "name": "OML01-PC",
        "ip": "93.108.96.96", 
        "port": 21001,
        "auth": "admin:grnl.2024"
    }
    
    print(f"\n📊 Testing {sensor['name']} sensor behavior:")
    
    # Test 1: Query for exactly current hour
    print(f"\nTest 1: Query for current hour (10:00 to 11:00)")
    time_start = current_hour_start.strftime('%Y-%m-%d-%H:%M:%S')
    time_end = (current_hour_start + timedelta(hours=1)).strftime('%Y-%m-%d-%H:%M:%S')
    
    try:
        conn = http.client.HTTPConnection(sensor['ip'], sensor['port'], timeout=10)
        path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={time_start}&time_end={time_end}"
        headers = {'Authorization': f'Basic {base64.b64encode(sensor["auth"].encode()).decode()}'}
        
        conn.request("GET", path, headers=headers)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            print(f"Response: {len(lines)-1} data records")
            if len(lines) > 1:
                # Parse the data line
                parts = lines[1].split(',')
                if len(parts) >= 17:
                    timestamp = parts[0]
                    end_time = parts[1]
                    total_in = sum(int(parts[i]) if parts[i] else 0 for i in [5, 8, 11, 14])
                    total_out = sum(int(parts[i]) if parts[i] else 0 for i in [6, 9, 12, 15])
                    
                    print(f"Timestamp: {timestamp}")
                    print(f"End time: {end_time}")
                    print(f"Total IN: {total_in}")
                    print(f"Total OUT: {total_out}")
                    print(f"\nFull data line: {lines[1]}")
        
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")
    
    # Test 2: Query for partial current hour
    print(f"\n\nTest 2: Query for partial hour (10:00 to 10:30)")
    partial_end = current_hour_start + timedelta(minutes=30)
    time_end_partial = partial_end.strftime('%Y-%m-%d-%H:%M:%S')
    
    try:
        conn = http.client.HTTPConnection(sensor['ip'], sensor['port'], timeout=10)
        path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={time_start}&time_end={time_end_partial}"
        
        conn.request("GET", path, headers=headers)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            print(f"Response: {len(lines)-1} data records")
            
            if len(lines) > 1:
                print(f"Data returned: {lines[1][:100]}...")
        
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print("\n\n💡 Analysis:")
    print("If the sensor returns data for 10:00-11:00 when queried at 10:30:")
    print("- The timestamp might be for the START of the hour (10:00)")
    print("- The data might be cumulative up to query time")
    print("- OR the sensor might only return completed hours")
    
    print("\n🔍 The key question:")
    print("Does the sensor update the 10:00 record throughout the hour,")
    print("or does it only create the record once the hour is complete?")

if __name__ == "__main__":
    test_partial_hour()