#!/usr/bin/env python3
"""Test if sensor returns 11:00 data now"""

import http.client
import base64
from datetime import datetime

def test_sensor():
    """Test sensor for 11:00 data"""
    print("🔍 Testing Sensor for 11:00 Data")
    print("=" * 80)
    
    now = datetime.utcnow()
    print(f"Current UTC time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test OML01-PC sensor
    sensor = {
        "name": "OML01-PC",
        "ip": "93.108.96.96",
        "port": 21001,
        "auth": "admin:grnl.2024"
    }
    
    # Try different query approaches
    queries = [
        {
            "desc": "Query for 11:00-12:00",
            "path": "/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-22-11:00:00&time_end=2025-07-22-12:00:00"
        },
        {
            "desc": "Query for 10:00-12:00 (2 hours)",
            "path": "/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-22-10:00:00&time_end=2025-07-22-12:00:00"
        },
        {
            "desc": "Query for 08:00-12:00 (4 hours)",
            "path": "/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-22-08:00:00&time_end=2025-07-22-12:00:00"
        }
    ]
    
    for query in queries:
        print(f"\n📡 {query['desc']}:")
        print(f"Path: {query['path']}")
        
        try:
            conn = http.client.HTTPConnection(sensor['ip'], sensor['port'], timeout=10)
            
            headers = {
                'Authorization': f'Basic {base64.b64encode(sensor["auth"].encode()).decode()}'
            }
            
            conn.request("GET", query['path'], headers=headers)
            response = conn.getresponse()
            
            if response.status == 200:
                data = response.read().decode('utf-8')
                lines = data.strip().split('\n')
                
                print(f"✅ Got {len(lines)-1} data records")
                
                if len(lines) > 1:
                    print(f"Header: {lines[0][:80]}...")
                    
                    # Show all data lines
                    for i in range(1, min(len(lines), 6)):  # Show up to 5 records
                        parts = lines[i].split(',')
                        if len(parts) >= 17:
                            timestamp = parts[0].strip()
                            total_in = sum(int(parts[j].strip()) if parts[j].strip() else 0 for j in [5, 8, 11, 14])
                            total_out = sum(int(parts[j].strip()) if parts[j].strip() else 0 for j in [6, 9, 12, 15])
                            print(f"  {timestamp}: {total_in} IN, {total_out} OUT")
            else:
                print(f"❌ HTTP {response.status}")
                
            conn.close()
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    print("\n💡 Analysis:")
    print("If 11:00 data is not showing up, it means:")
    print("1. The sensor hasn't started collecting data for the 11:00 hour yet")
    print("2. OR there's a delay in when the sensor makes the data available")
    print("3. OR the sensor only provides complete hourly data after the hour ends")

if __name__ == "__main__":
    test_sensor()