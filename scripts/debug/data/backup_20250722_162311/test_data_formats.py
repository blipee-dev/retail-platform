#!/usr/bin/env python3
"""
Test different data formats from Milesight sensors
"""
import requests
from datetime import datetime, timedelta
from requests.auth import HTTPBasicAuth

def test_data_formats():
    """Test different parameter combinations to understand data formats"""
    
    # J&J sensor config
    host = "176.79.62.167"
    port = 2102
    auth = HTTPBasicAuth("admin", "grnl.2024")
    
    # Time range - last 10 minutes
    end_time = datetime.now()
    start_time = end_time - timedelta(minutes=10)
    time_format = "%Y-%m-%d-%H:%M:%S"
    
    # Key combinations to test
    test_configs = [
        {
            "name": "Hourly aggregation (current config)",
            "params": {
                "report_type": 0,  # Daily
                "statistics_type": 3  # Hourly
            }
        },
        {
            "name": "In counts only", 
            "params": {
                "report_type": 0,
                "statistics_type": 0  # None/Raw - shows only IN
            }
        },
        {
            "name": "Out counts only",
            "params": {
                "report_type": 0,
                "statistics_type": 1  # Summary - shows only OUT
            }
        },
        {
            "name": "In/Out/Sum detail",
            "params": {
                "report_type": 0,
                "statistics_type": 2  # Detail - shows IN/OUT/SUM
            }
        },
        {
            "name": "Weekly report with daily data",
            "params": {
                "report_type": 1,  # Weekly
                "statistics_type": 0
            }
        }
    ]
    
    for config in test_configs:
        print(f"\n{'='*80}")
        print(f"{config['name']}")
        print(f"{'='*80}")
        
        params = config['params'].copy()
        params.update({
            "dw": "vcalogcsv",
            "linetype": 31,
            "time_start": start_time.strftime(time_format),
            "time_end": end_time.strftime(time_format)
        })
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
        
        print(f"Parameters: report_type={params.get('report_type')}, statistics_type={params.get('statistics_type')}")
        
        try:
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                
                if len(lines) > 0:
                    # Show header
                    print(f"\nHeader: {lines[0]}")
                    
                    # Count columns
                    header_cols = lines[0].split(',')
                    print(f"Number of columns: {len(header_cols)}")
                    
                    # Show first 3 data rows
                    print(f"\nFirst {min(3, len(lines)-1)} data rows:")
                    for i in range(1, min(4, len(lines))):
                        print(f"  {lines[i]}")
                    
                    # Analyze time granularity
                    if len(lines) > 2:
                        times = []
                        for i in range(1, min(5, len(lines))):
                            parts = lines[i].split(',')
                            if parts:
                                try:
                                    start_dt = datetime.strptime(parts[0].strip(), "%Y/%m/%d %H:%M:%S")
                                    times.append(start_dt)
                                except:
                                    pass
                        
                        if len(times) > 1:
                            time_diff = times[1] - times[0]
                            print(f"\nTime granularity: {time_diff}")
                            print(f"Total records: {len(lines)-1}")
                            
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Test without any parameters to see default behavior
    print(f"\n{'='*80}")
    print("Default behavior (no report_type or statistics_type)")
    print(f"{'='*80}")
    
    params = {
        "dw": "vcalogcsv",
        "time_start": start_time.strftime(time_format),
        "time_end": end_time.strftime(time_format)
    }
    
    param_str = "&".join([f"{k}={v}" for k, v in params.items()])
    url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
    
    try:
        response = requests.get(url, auth=auth, timeout=10)
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            if lines:
                print(f"Header: {lines[0]}")
                print(f"Records returned: {len(lines)-1}")
        else:
            print(f"Status: {response.status_code}")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_data_formats()