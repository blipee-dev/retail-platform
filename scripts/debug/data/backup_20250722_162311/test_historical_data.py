#!/usr/bin/env python3
"""
Test if we can collect historical data from sensors
"""
import requests
from datetime import datetime, timedelta
from requests.auth import HTTPBasicAuth

def test_historical_data():
    """Test requesting historical data from different time ranges"""
    
    # J&J sensor config
    host = "176.79.62.167"
    port = 2102
    auth = HTTPBasicAuth("admin", "grnl.2024")
    
    # Different time ranges to test
    test_ranges = [
        {
            "name": "Last 24 hours",
            "end": datetime.now(),
            "start": datetime.now() - timedelta(days=1)
        },
        {
            "name": "Last 7 days",
            "end": datetime.now(),
            "start": datetime.now() - timedelta(days=7)
        },
        {
            "name": "Last 30 days",
            "end": datetime.now(),
            "start": datetime.now() - timedelta(days=30)
        },
        {
            "name": "June 21 to July 21 (as requested)",
            "end": datetime(2025, 7, 21, 23, 59, 59),
            "start": datetime(2025, 6, 21, 0, 0, 0)
        },
        {
            "name": "Specific date in the past (July 1)",
            "end": datetime(2025, 7, 1, 23, 59, 59),
            "start": datetime(2025, 7, 1, 0, 0, 0)
        }
    ]
    
    for test in test_ranges:
        print(f"\n{'='*80}")
        print(f"Testing: {test['name']}")
        print(f"From: {test['start'].strftime('%Y-%m-%d %H:%M')}")
        print(f"To: {test['end'].strftime('%Y-%m-%d %H:%M')}")
        print(f"{'='*80}")
        
        # Try with daily report (report_type=0)
        params = {
            "dw": "vcalogcsv",
            "report_type": 0,  # Daily
            "statistics_type": 3,  # Hourly stats
            "linetype": 31,
            "time_start": test['start'].strftime("%Y-%m-%d-%H:%M:%S"),
            "time_end": test['end'].strftime("%Y-%m-%d-%H:%M:%S")
        }
        
        param_str = "&".join([f"{k}={v}" for k, v in params.items()])
        url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
        
        try:
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                lines = response.text.strip().split('\n')
                
                if len(lines) > 1:
                    print(f"✅ Got {len(lines)-1} hourly records")
                    
                    # Check if we got actual historical data
                    non_zero_count = 0
                    first_data_line = None
                    last_data_line = None
                    
                    for i in range(1, len(lines)):
                        parts = lines[i].split(',')
                        if len(parts) > 4:
                            # Check if any counts are non-zero
                            total_in = int(parts[2].strip()) if parts[2].strip().isdigit() else 0
                            if total_in > 0:
                                non_zero_count += 1
                                if first_data_line is None:
                                    first_data_line = parts[0].strip()
                                last_data_line = parts[0].strip()
                    
                    if non_zero_count > 0:
                        print(f"   📊 Found {non_zero_count} hours with actual data")
                        print(f"   First data: {first_data_line}")
                        print(f"   Last data: {last_data_line}")
                    else:
                        print(f"   ⚠️  All records have zero counts")
                    
                    # Show sample of data
                    print(f"\n   Sample data (first 3 non-zero records):")
                    shown = 0
                    for i in range(1, len(lines)):
                        if shown >= 3:
                            break
                        parts = lines[i].split(',')
                        if len(parts) > 4:
                            total_in = int(parts[2].strip()) if parts[2].strip().isdigit() else 0
                            if total_in > 0:
                                timestamp = parts[0].strip()
                                total_out = int(parts[3].strip()) if parts[3].strip().isdigit() else 0
                                print(f"   {timestamp}: In={total_in}, Out={total_out}")
                                shown += 1
                                
                else:
                    print("❌ No data returned")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    # Test with monthly report for long-term data
    print(f"\n{'='*80}")
    print("Testing: Monthly report for June 21 - July 21")
    print(f"{'='*80}")
    
    params = {
        "dw": "vcalogcsv",
        "report_type": 2,  # Monthly
        "statistics_type": 3,
        "linetype": 31,
        "time_start": "2025-06-21-00:00:00",
        "time_end": "2025-07-21-23:59:59"
    }
    
    param_str = "&".join([f"{k}={v}" for k, v in params.items()])
    url = f"http://{host}:{port}/dataloader.cgi?{param_str}"
    
    try:
        response = requests.get(url, auth=auth, timeout=10)
        
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            
            if len(lines) > 1:
                print(f"✅ Got {len(lines)-1} daily records")
                
                # Show first few records
                print("\nFirst 5 records:")
                for i in range(1, min(6, len(lines))):
                    parts = lines[i].split(',')
                    if len(parts) >= 2:
                        print(f"   {parts[0].strip()} to {parts[1].strip()}")
                        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_historical_data()