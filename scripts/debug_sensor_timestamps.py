#!/usr/bin/env python3
"""Debug sensor timestamp behavior"""

import http.client
import base64
from datetime import datetime, timezone

def test_sensor_timestamps():
    """Test sensor timestamp behavior"""
    print("🕐 Debugging Sensor Timestamps")
    print("=" * 80)
    
    # Get current times
    utc_now = datetime.now(timezone.utc)
    print(f"Current UTC time: {utc_now.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Current hour: {utc_now.hour}:00 UTC")
    
    # Portugal is UTC+1 in summer (WEST - Western European Summer Time)
    portugal_now = utc_now.replace(tzinfo=None) + timedelta(hours=1)
    print(f"Portugal time (UTC+1): {portugal_now.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test OML01-PC sensor
    sensor = {
        "name": "OML01-PC",
        "ip": "93.108.96.96",
        "port": 21001,
        "auth": "admin:grnl.2024"
    }
    
    # Query for current data
    path = "/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-22-08:00:00&time_end=2025-07-22-14:00:00"
    
    print(f"📡 Querying sensor from 08:00 to 14:00 UTC...")
    print(f"Path: {path}")
    
    try:
        conn = http.client.HTTPConnection(sensor['ip'], sensor['port'], timeout=10)
        
        headers = {
            'Authorization': f'Basic {base64.b64encode(sensor["auth"].encode()).decode()}'
        }
        
        conn.request("GET", path, headers=headers)
        response = conn.getresponse()
        
        if response.status == 200:
            data = response.read().decode('utf-8')
            lines = data.strip().split('\n')
            
            print(f"\n✅ Got {len(lines)-1} data records:")
            print("\nTimestamp Analysis:")
            print("-" * 80)
            
            if len(lines) > 1:
                # Show all records
                for i in range(1, len(lines)):
                    parts = lines[i].split(',')
                    if len(parts) >= 17:
                        timestamp_str = parts[0].strip()
                        # Parse timestamp
                        timestamp = datetime.strptime(timestamp_str, "%Y/%m/%d %H:%M:%S")
                        
                        total_in = sum(int(parts[j].strip()) if parts[j].strip() else 0 for j in [5, 8, 11, 14])
                        total_out = sum(int(parts[j].strip()) if parts[j].strip() else 0 for j in [6, 9, 12, 15])
                        
                        # Determine if this is past, current, or future
                        if timestamp.hour < utc_now.hour:
                            status = "PAST"
                            emoji = "✅"
                        elif timestamp.hour == utc_now.hour:
                            status = "CURRENT"
                            emoji = "🔄"
                        else:
                            status = "FUTURE"
                            emoji = "❓"
                        
                        print(f"{emoji} {timestamp_str} UTC: {total_in:4d} IN, {total_out:4d} OUT [{status}]")
                        
                        # If it's future data, note it
                        if timestamp.hour > utc_now.hour:
                            print(f"   ⚠️  This is {timestamp.hour - utc_now.hour} hour(s) in the future!")
            
            print("\n💡 Analysis:")
            print("If the sensor is returning future timestamps, it might be:")
            print("1. Using local time (Portugal UTC+1) instead of UTC")
            print("2. Pre-allocating hourly slots with zero or placeholder data")
            print("3. A timezone configuration issue on the sensor")
            
        else:
            print(f"❌ HTTP {response.status}")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")

# Import after defining to avoid circular import
from datetime import timedelta

if __name__ == "__main__":
    test_sensor_timestamps()