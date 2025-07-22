#!/usr/bin/env python3
"""
Test all parameter combinations for Milesight sensors
"""
import requests
from datetime import datetime, timedelta
from requests.auth import HTTPBasicAuth

def test_all_combinations():
    """Test different parameter combinations"""
    
    # J&J sensor config
    host = "176.79.62.167"
    port = 2102
    auth = HTTPBasicAuth("admin", "grnl.2024")
    
    # Time range - last hour
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)
    time_format = "%Y-%m-%d-%H:%M:%S"
    
    # Different report_type values
    report_types = [
        (0, "Daily"),
        (1, "Weekly"),
        (2, "Monthly"),
        (3, "Yearly"),
        (4, "Custom"),
        (5, "Real-time"),
        (6, "Minute"),
        (7, "Hourly")
    ]
    
    # Different statistics_type values
    statistics_types = [
        (0, "None/Raw"),
        (1, "Summary"),
        (2, "Detail"),
        (3, "Hourly"),
        (4, "Daily"),
        (5, "Minute"),
        (6, "Real-time")
    ]
    
    # Test just report_type variations first
    print("="*80)
    print("TESTING REPORT_TYPE VARIATIONS")
    print("="*80)
    
    for rt_val, rt_name in report_types:
        print(f"\n--- Testing report_type={rt_val} ({rt_name}) ---")
        
        params = {
            "dw": "vcalogcsv",
            "report_type": rt_val,
            "linetype": 31,
            "time_start": start_time.strftime(time_format),
            "time_end": end_time.strftime(time_format)
        }
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
        
        try:
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                if len(lines) > 1:
                    print(f"✅ Success! Got {len(lines)-1} data rows")
                    # Show first data line
                    first_data = lines[1].split(',')
                    if first_data:
                        print(f"   First timestamp: {first_data[0].strip()}")
                        print(f"   Last timestamp: {lines[-1].split(',')[0].strip()}")
                else:
                    print("⚠️  No data returned")
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Test statistics_type variations with report_type=0
    print("\n" + "="*80)
    print("TESTING STATISTICS_TYPE VARIATIONS (with report_type=0)")
    print("="*80)
    
    for st_val, st_name in statistics_types:
        print(f"\n--- Testing statistics_type={st_val} ({st_name}) ---")
        
        params = {
            "dw": "vcalogcsv",
            "report_type": 0,
            "statistics_type": st_val,
            "linetype": 31,
            "time_start": start_time.strftime(time_format),
            "time_end": end_time.strftime(time_format)
        }
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
        
        try:
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                if len(lines) > 1:
                    print(f"✅ Success! Got {len(lines)-1} data rows")
                    # Show header to understand data format
                    header = lines[0]
                    print(f"   Header: {header[:80]}...")
                    # Show first few data points
                    for i in range(1, min(4, len(lines))):
                        data_parts = lines[i].split(',')
                        if len(data_parts) >= 2:
                            print(f"   Row {i}: {data_parts[0].strip()} to {data_parts[1].strip()}")
                else:
                    print("⚠️  No data returned")
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Test some specific combinations
    print("\n" + "="*80)
    print("TESTING SPECIFIC COMBINATIONS")
    print("="*80)
    
    specific_tests = [
        {"report_type": 1, "statistics_type": 0, "name": "Weekly + No stats"},
        {"report_type": 0, "statistics_type": 5, "name": "Daily + Minute stats"},
        {"report_type": 6, "statistics_type": 0, "name": "Minute report + No stats"},
        {"report_type": 5, "statistics_type": 6, "name": "Real-time + Real-time stats"},
    ]
    
    for test in specific_tests:
        print(f"\n--- Testing {test['name']} ---")
        
        params = {
            "dw": "vcalogcsv",
            "report_type": test["report_type"],
            "statistics_type": test["statistics_type"],
            "linetype": 31,
            "time_start": start_time.strftime(time_format),
            "time_end": end_time.strftime(time_format)
        }
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
        
        try:
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                if len(lines) > 1:
                    print(f"✅ Success! Got {len(lines)-1} data rows")
                    # Analyze time granularity
                    if len(lines) > 2:
                        first_time = lines[1].split(',')[0].strip()
                        second_time = lines[2].split(',')[0].strip()
                        print(f"   Time range: {first_time} to {second_time}")
                else:
                    print("⚠️  No data returned")
            else:
                print(f"❌ Error: HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_all_combinations()