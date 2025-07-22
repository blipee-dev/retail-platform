#!/usr/bin/env python3
"""Test if sensors provide real-time data"""

import http.client
import base64
from datetime import datetime, timedelta

def test_realtime():
    """Test if sensors provide current hour data"""
    print("🔍 Testing Sensor Real-Time Data Availability")
    print("=" * 80)
    
    now = datetime.utcnow()
    print(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    # Test one Omnia sensor
    sensor = {
        "name": "OML01-PC",
        "ip": "93.108.96.96",
        "port": 21001,
        "auth": "admin:grnl.2024"
    }
    
    # Try different time ranges
    test_cases = [
        {
            "name": "Last 5 minutes",
            "start": now - timedelta(minutes=5),
            "end": now
        },
        {
            "name": "Last 30 minutes",
            "start": now - timedelta(minutes=30),
            "end": now
        },
        {
            "name": "Current hour so far (10:00-10:54)",
            "start": now.replace(minute=0, second=0, microsecond=0),
            "end": now
        },
        {
            "name": "Last complete hour (9:00-10:00)",
            "start": now.replace(minute=0, second=0, microsecond=0) - timedelta(hours=1),
            "end": now.replace(minute=0, second=0, microsecond=0)
        }
    ]
    
    for test in test_cases:
        print(f"\n📊 Testing: {test['name']}")
        print(f"   From: {test['start'].strftime('%H:%M:%S')}")
        print(f"   To:   {test['end'].strftime('%H:%M:%S')}")
        
        # Format time for sensor API
        time_start = test['start'].strftime('%Y-%m-%d-%H:%M:%S')
        time_end = test['end'].strftime('%Y-%m-%d-%H:%M:%S')
        
        try:
            conn = http.client.HTTPConnection(sensor['ip'], sensor['port'], timeout=10)
            
            path = f"/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={time_start}&time_end={time_end}"
            
            headers = {
                'Authorization': f'Basic {base64.b64encode(sensor["auth"].encode()).decode()}'
            }
            
            conn.request("GET", path, headers=headers)
            response = conn.getresponse()
            
            if response.status == 200:
                data = response.read().decode('utf-8')
                lines = data.strip().split('\n')
                data_lines = len(lines) - 1 if lines else 0  # Subtract header
                
                print(f"   Result: {data_lines} data records")
                
                # Show sample timestamps if any
                if data_lines > 0 and len(lines) > 1:
                    # Parse first data line to see timestamp
                    first_data = lines[1].split(',')
                    if len(first_data) > 0:
                        print(f"   First timestamp: {first_data[0]}")
                    if data_lines > 1 and len(lines) > 2:
                        last_data = lines[-1].split(',')
                        if len(last_data) > 0:
                            print(f"   Last timestamp: {last_data[0]}")
            else:
                print(f"   Error: HTTP {response.status}")
                
            conn.close()
            
        except Exception as e:
            print(f"   Error: {str(e)}")
    
    print("\n\n💡 Analysis:")
    print("If sensors only provide hourly aggregated data:")
    print("- 10:00-11:00 data won't be available until 11:00")
    print("- We're currently at 10:54, so this hour's data is still being collected")
    print("\nIf sensors provide real-time data:")
    print("- We should see records for the current hour")
    print("- GitHub Actions workflow might need adjustment to collect more frequently")

if __name__ == "__main__":
    test_realtime()