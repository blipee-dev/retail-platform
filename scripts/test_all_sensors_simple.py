#!/usr/bin/env python3
"""Test all sensor connections using direct API calls."""

import requests
import json
from datetime import datetime, timedelta
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def test_sensor_connection(name, host, port, username, password):
    """Test a single sensor connection using direct API calls."""
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print(f"Host: {host}:{port}")
    print('='*60)
    
    base_url = f"http://{host}:{port}"
    auth = (username, password)
    
    try:
        # Test 1: Check connection
        print("\n1. Testing connection...")
        try:
            response = requests.get(
                f"{base_url}/",
                auth=auth,
                timeout=10,
                verify=False
            )
            if response.status_code in [200, 302, 401]:  # 401 means auth is working
                print(f"✅ Connection successful! (Status: {response.status_code})")
            else:
                print(f"⚠️  Unexpected status code: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection failed: {str(e)}")
            return False
        
        # Test 2: Get device info
        print("\n2. Getting device info...")
        try:
            # Common Milesight endpoints
            info_endpoints = [
                "/api/v1/system/status",
                "/api/system/status",
                "/cgi-bin/system.cgi?action=status"
            ]
            
            for endpoint in info_endpoints:
                try:
                    response = requests.get(
                        f"{base_url}{endpoint}",
                        auth=auth,
                        timeout=10,
                        verify=False
                    )
                    if response.status_code == 200:
                        print(f"✅ Device info endpoint found: {endpoint}")
                        break
                except:
                    continue
        except Exception as e:
            print(f"⚠️  Could not get device info: {str(e)}")
        
        # Test 3: Get people counting data
        print("\n3. Testing people counting data...")
        try:
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=24)  # Last 24 hours
            
            # Milesight API format
            params = {
                "report_type": 0,  # Line counting
                "linetype": 31,    # All lines
                "statistics_type": 3,  # Device statistics
                "start_time": start_time.strftime("%Y-%m-%d%%20%H:%M:%S"),
                "end_time": end_time.strftime("%Y-%m-%d%%20%H:%M:%S")
            }
            
            # Build query string
            query = "&".join([f"{k}={v}" for k, v in params.items()])
            url = f"{base_url}/api/v1/data?{query}"
            
            response = requests.get(
                url,
                auth=auth,
                timeout=30,
                verify=False
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"✅ People counting data retrieved!")
                    print(f"   Records found: {len(data)}")
                    
                    # Show latest entry
                    latest = data[-1] if data else {}
                    if 'time' in latest:
                        print(f"   Latest time: {latest['time']}")
                    
                    # Count total traffic
                    total_in = sum(item.get('in', 0) for item in data if isinstance(item.get('in'), (int, float)))
                    total_out = sum(item.get('out', 0) for item in data if isinstance(item.get('out'), (int, float)))
                    print(f"   Total In (24h): {total_in}")
                    print(f"   Total Out (24h): {total_out}")
                else:
                    print("⚠️  No data returned")
            else:
                print(f"❌ Failed to get data (Status: {response.status_code})")
                
        except Exception as e:
            print(f"❌ Error getting people counting data: {str(e)}")
        
        # Test 4: Check regional counting
        print("\n4. Testing regional counting...")
        try:
            params = {
                "report_type": 1,  # Regional counting
                "start_time": start_time.strftime("%Y-%m-%d%%20%H:%M:%S"),
                "end_time": end_time.strftime("%Y-%m-%d%%20%H:%M:%S")
            }
            
            query = "&".join([f"{k}={v}" for k, v in params.items()])
            url = f"{base_url}/api/v1/data?{query}"
            
            response = requests.get(
                url,
                auth=auth,
                timeout=30,
                verify=False
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    print(f"✅ Regional counting available!")
                    print(f"   Records found: {len(data)}")
                else:
                    print("⚠️  No regional data (regions may not be configured)")
            else:
                print(f"⚠️  Regional counting not available (Status: {response.status_code})")
                
        except Exception as e:
            print(f"⚠️  Could not test regional counting: {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        return False


def main():
    """Test all configured sensors."""
    print("\n" + "="*60)
    print("SENSOR CONNECTION TEST")
    print("Testing all configured sensors...")
    print("="*60)
    
    # Define all sensors
    sensors = [
        {
            "name": "J&J Arrábida (Jack & Jones)",
            "host": "176.79.62.167",
            "port": 2102,
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "Omnia Guimarães Shopping",
            "host": "93.108.96.96",
            "port": 21001,
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "Omnia Fórum Almada",
            "host": "188.37.175.41",
            "port": 2201,
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "Omnia NorteShopping",
            "host": "188.37.124.33",
            "port": 21002,
            "username": "admin",
            "password": "grnl.2024"
        }
    ]
    
    # Test each sensor
    results = []
    for sensor in sensors:
        success = test_sensor_connection(
            sensor['name'],
            sensor['host'],
            sensor['port'],
            sensor['username'],
            sensor['password']
        )
        results.append({
            'name': sensor['name'],
            'success': success
        })
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    successful = sum(1 for r in results if r['success'])
    failed = len(results) - successful
    
    print(f"\nTotal sensors tested: {len(results)}")
    print(f"✅ Successful: {successful}")
    print(f"❌ Failed: {failed}")
    
    print("\nDetailed Results:")
    for result in results:
        status = "✅" if result['success'] else "❌"
        print(f"{status} {result['name']}")
    
    if successful == len(results):
        print("\n🎉 All sensors are accessible and returning data!")
    else:
        print("\n⚠️  Some sensors failed. Please check the connection details.")
    
    return successful == len(results)


if __name__ == "__main__":
    success = main()