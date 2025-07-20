#!/usr/bin/env python3
"""
Quick test script for real Milesight sensor connectivity
"""

import requests
from datetime import datetime, timedelta
import json

def quick_test_sensor(host, username="admin", password="admin", port=80):
    """Quick test of sensor connectivity and data"""
    print(f"🧪 Quick test of {host}:{port} with {username}/*****")
    
    auth = (username, password)
    base_url = f"http://{host}:{port}"
    
    # Test 1: Basic connectivity
    try:
        response = requests.get(f"{base_url}/", timeout=5)
        print(f"   ✅ Basic connectivity: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Basic connectivity failed: {str(e)}")
        return False
    
    # Test 2: Authentication
    try:
        url = f"{base_url}/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"
        response = requests.get(url, auth=auth, timeout=10)
        
        if response.status_code == 200:
            print(f"   ✅ Authentication successful")
            print(f"   📡 Status response: {response.text[:100]}...")
        else:
            print(f"   ❌ Authentication failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Authentication test failed: {str(e)}")
        return False
    
    # Test 3: People counting data
    try:
        now = datetime.now()
        start_time = now - timedelta(hours=24)  # Last 24 hours
        
        url = f"{base_url}/dataloader.cgi?dw=vcalogcsv&type=0&time_start={start_time.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={now.strftime('%Y-%m-%d-%H:%M:%S')}"
        response = requests.get(url, auth=auth, timeout=15)
        
        if response.status_code == 200:
            lines = response.text.strip().split('\n')
            if len(lines) > 1:  # Has header + data
                print(f"   ✅ People counting data: {len(lines)-1} records")
                print(f"   📊 Sample: {lines[1][:100]}...")
            else:
                print(f"   ⚠️  People counting: No data (empty or header only)")
        else:
            print(f"   ❌ People counting failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ People counting test failed: {str(e)}")
    
    # Test 4: Real-time status
    try:
        url = f"{base_url}/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"
        response = requests.get(url, auth=auth, timeout=10)
        
        if response.status_code == 200:
            # Parse Milesight variables
            text = response.text
            in_count = "N/A"
            out_count = "N/A"
            
            if "current_in_count=" in text:
                in_count = text.split("current_in_count='")[1].split("'")[0]
            if "current_out_count=" in text:
                out_count = text.split("current_out_count='")[1].split("'")[0]
            
            print(f"   ✅ Real-time status: {in_count} in, {out_count} out")
        else:
            print(f"   ❌ Real-time status failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Real-time status test failed: {str(e)}")
    
    return True

def main():
    """Main function"""
    print("🚀 QUICK MILESIGHT SENSOR TEST")
    print("=" * 35)
    
    # Test with the original IP from the data collector
    print("\n1. Testing original sensor from data_collector.py:")
    quick_test_sensor("93.108.96.96", "admin", "grnl.2024", 21001)
    
    print("\n2. Testing other sensors:")
    sensors = [
        ("93.108.245.76", 21002),
        ("93.108.245.76", 21003),
        ("188.37.190.134", 2201),
        ("188.37.124.33", 21002)
    ]
    
    for host, port in sensors:
        print(f"\n   Testing {host}:{port}...")
        quick_test_sensor(host, "admin", "grnl.2024", port)
    
    print("\n" + "="*35)
    print("ℹ️  If any sensors show ✅, you can use the full test script:")
    print("   python test_real_sensor.py")

if __name__ == "__main__":
    main()