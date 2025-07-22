#!/usr/bin/env python3
"""Test Omnia sensor connections."""

import json
import requests
from datetime import datetime, timedelta
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def test_omnia_sensor(name, base_url, username, password):
    """Test an Omnia sensor using the J&J approach."""
    print(f"\n{'='*60}")
    print(f"🔍 Testing connection to {name} sensor...")
    print(f"   URL: {base_url}")
    print('='*60)
    
    # Create session
    session = requests.Session()
    session.auth = (username, password)
    session.verify = False
    session.headers.update({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    })
    
    try:
        # Test 1: Authentication
        print("\n1️⃣ Testing authentication...")
        response = session.get(f"{base_url}/api/v1/status")
        if response.status_code in [200, 404]:  # 404 means auth worked but endpoint doesn't exist
            print("✅ Authentication successful!")
        else:
            print(f"❌ Authentication failed with status: {response.status_code}")
            return False
        
        # Test 2: Try to get people counting data
        print("\n2️⃣ Getting people counting data (last 24 hours)...")
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        # Try the J&J format first
        params = {
            "type": "csv",
            "report_type": 0,
            "statistics_type": 3,
            "linetype": 31,
            "start_time": start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": end_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        response = session.get(f"{base_url}/api/report", params=params)
        
        if response.status_code == 200:
            if response.headers.get('content-type', '').startswith('text/csv'):
                print("✅ Retrieved CSV data!")
                # Parse CSV data
                lines = response.text.strip().split('\n')
                if len(lines) > 1:
                    print(f"   Records: {len(lines) - 1}")  # Minus header
                    # Show last record
                    if len(lines) > 1:
                        last_line = lines[-1].split(',')
                        if len(last_line) >= 2:
                            print(f"   Latest: {last_line[0]} {last_line[1] if len(last_line) > 1 else ''}")
            else:
                print(f"⚠️  Unexpected content type: {response.headers.get('content-type')}")
        else:
            # Try alternative endpoint
            print(f"   First attempt failed (status: {response.status_code}), trying alternative...")
            
            params = {
                "report_type": 0,
                "linetype": 31,
                "statistics_type": 3,
                "start_time": start_time.strftime("%Y-%m-%d%%20%H:%M:%S"),
                "end_time": end_time.strftime("%Y-%m-%d%%20%H:%M:%S")
            }
            
            response = session.get(f"{base_url}/api/v1/data", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"✅ Retrieved JSON data!")
                    print(f"   Records: {len(data)}")
                else:
                    print("⚠️  No data returned")
            else:
                print(f"❌ Failed to get data (status: {response.status_code})")
        
        # Test 3: Regional counting
        print("\n3️⃣ Getting regional counting data...")
        params = {
            "report_type": 1,
            "start_time": start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": end_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        response = session.get(f"{base_url}/api/report", params=params)
        
        if response.status_code == 200:
            print("✅ Regional counting available")
        else:
            print(f"⚠️  Regional counting not configured (status: {response.status_code})")
        
        # Test 4: Check available endpoints
        print("\n4️⃣ Checking available endpoints...")
        endpoints_to_check = [
            "/api/report",
            "/api/v1/data", 
            "/api/v1/status",
            "/api/system/status"
        ]
        
        available = []
        for endpoint in endpoints_to_check:
            try:
                response = session.get(f"{base_url}{endpoint}")
                if response.status_code in [200, 400]:  # 400 means endpoint exists but needs params
                    available.append(endpoint)
            except:
                pass
        
        if available:
            print(f"✅ Available endpoints: {', '.join(available)}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        return False


def main():
    """Test all Omnia sensors."""
    print("\n" + "="*60)
    print("OMNIA SENSORS CONNECTION TEST")
    print("="*60)
    
    sensors = [
        {
            "name": "OML01-Omnia Guimarães Shopping",
            "base_url": "http://93.108.96.96:21001",
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "OML02-Omnia Fórum Almada", 
            "base_url": "http://188.37.175.41:2201",
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "OML03-Omnia NorteShopping",
            "base_url": "http://188.37.124.33:21002",
            "username": "admin",
            "password": "grnl.2024"
        }
    ]
    
    results = []
    for sensor in sensors:
        success = test_omnia_sensor(
            sensor['name'],
            sensor['base_url'],
            sensor['username'],
            sensor['password']
        )
        results.append((sensor['name'], success))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")
    
    successful = sum(1 for _, success in results if success)
    print(f"\nTotal: {successful}/{len(results)} sensors working")


if __name__ == "__main__":
    main()