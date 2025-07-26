#!/usr/bin/env python3
"""Test regional data collection from sensors"""

import http.client
import base64
import json
from datetime import datetime, timedelta

def test_regional_data():
    """Test if sensors provide regional counting data"""
    print("🗺️  Testing Regional Data Collection")
    print("=" * 80)
    
    # Test sensors
    sensors = [
        {
            "name": "OML01-PC",
            "host": "192.168.1.164",
            "port": 80,
            "auth": "admin:OmniaOml01",
            "endpoint": "regionalcountlogcsv"  # Milesight regional endpoint
        },
        {
            "name": "J&J-ARR-01-PC", 
            "host": "188.82.28.148",
            "port": 2102,
            "auth": "admin:grnl.2024",
            "endpoint": "regionalcountlogcsv"
        }
    ]
    
    # Time range
    now = datetime.now()
    start_time = now - timedelta(hours=2)
    
    # Format for Milesight API
    def format_time(dt):
        return dt.strftime('%Y-%m-%d-%H:%M:%S')
    
    for sensor in sensors:
        print(f"\n📡 Testing {sensor['name']}...")
        
        try:
            # Try regional counting endpoint
            conn = http.client.HTTPConnection(sensor['host'], sensor['port'], timeout=30)
            
            # Build URL with parameters for regional counting
            params = f"?dw={sensor['endpoint']}&report_type=0&statistics_type=3&time_start={format_time(start_time)}&time_end={format_time(now)}"
            url = f"/dataloader.cgi{params}"
            
            # Auth header
            auth_str = base64.b64encode(sensor['auth'].encode()).decode()
            headers = {
                'Authorization': f'Basic {auth_str}'
            }
            
            print(f"  URL: {url}")
            conn.request("GET", url, headers=headers)
            response = conn.getresponse()
            
            if response.status == 200:
                data = response.read().decode('utf-8')
                print(f"  ✅ Got response ({len(data)} bytes)")
                
                # Show first few lines
                lines = data.strip().split('\n')
                print(f"  Headers: {lines[0] if lines else 'No data'}")
                
                if len(lines) > 1:
                    print(f"  Sample row: {lines[1]}")
                    
                    # Check for regional columns
                    header = lines[0].lower()
                    if 'region' in header:
                        print("  ✅ Found regional data columns!")
                        # Parse columns
                        cols = [col.strip() for col in lines[0].split(',')]
                        regional_cols = [col for col in cols if 'region' in col.lower()]
                        print(f"  Regional columns: {regional_cols}")
                    else:
                        print("  ❌ No regional columns found")
                        print(f"  Available columns: {lines[0]}")
                else:
                    print("  ⚠️  No data rows returned")
                    
            else:
                print(f"  ❌ HTTP {response.status}: {response.reason}")
                
            conn.close()
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
    
    print("\n\n💡 Analysis:")
    print("If sensors don't provide regional data, we need to:")
    print("1. Enable regional counting in the sensor web interface")
    print("2. Or use virtual regions based on line crossings")
    print("3. Or check if sensors support a different API endpoint")

if __name__ == "__main__":
    test_regional_data()