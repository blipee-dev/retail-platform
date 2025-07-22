#!/usr/bin/env python3
"""
Test different parameter combinations to get real-time data
"""
import requests
from datetime import datetime, timedelta
from requests.auth import HTTPBasicAuth

def test_parameters():
    """Test different parameter combinations"""
    
    # J&J sensor config
    host = "176.79.62.167"
    port = 2102
    auth = HTTPBasicAuth("admin", "grnl.2024")
    
    # Time range - last 5 minutes
    end_time = datetime.now()
    start_time = end_time - timedelta(minutes=5)
    time_format = "%Y-%m-%d-%H:%M:%S"
    
    # Different parameter combinations to test
    test_configs = [
        {
            "name": "Original (Daily report, hourly stats)",
            "params": {
                "dw": "vcalogcsv",
                "report_type": 0,  # Daily
                "statistics_type": 3,  # Hourly
                "linetype": 31
            }
        },
        {
            "name": "No statistics type",
            "params": {
                "dw": "vcalogcsv",
                "report_type": 0,
                "linetype": 31
            }
        },
        {
            "name": "Raw data (no aggregation)",
            "params": {
                "dw": "vcalogcsv",
                "linetype": 31
            }
        },
        {
            "name": "Type 0 (All counts)",
            "params": {
                "dw": "vcalogcsv",
                "type": 0,
                "linetype": 31
            }
        },
        {
            "name": "Minimal params",
            "params": {
                "dw": "vcalogcsv"
            }
        }
    ]
    
    for config in test_configs:
        print(f"\n{'='*60}")
        print(f"Testing: {config['name']}")
        print(f"{'='*60}")
        
        # Build URL
        params = config['params'].copy()
        params['time_start'] = start_time.strftime(time_format)
        params['time_end'] = end_time.strftime(time_format)
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
        
        print(f"URL: {url}")
        
        try:
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                print(f"✅ Success! Got {len(lines)-1} data rows")
                
                # Show first few lines
                print("\nFirst 5 lines:")
                for i, line in enumerate(lines[:5]):
                    print(f"  {line[:100]}...")
                    
                # Check timestamps
                if len(lines) > 1:
                    # Parse first data line to check timestamp
                    first_data = lines[1].split(',')
                    if first_data:
                        timestamp_str = first_data[0].strip()
                        print(f"\nFirst timestamp: {timestamp_str}")
                        
                        # Check if it's in the requested range
                        try:
                            ts = datetime.strptime(timestamp_str, "%Y/%m/%d %H:%M:%S")
                            if ts >= start_time and ts <= end_time:
                                print("✅ Timestamp is within requested range!")
                            else:
                                print(f"❌ Timestamp is outside range (wanted {start_time} to {end_time})")
                        except:
                            print("⚠️  Could not parse timestamp")
                            
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_parameters()