#!/usr/bin/env python3
"""Test if sensors are accessible from cloud environments"""

import requests
from datetime import datetime, timedelta
import base64

def test_sensor(name, ip, port):
    """Test a single sensor"""
    print(f"\n🔍 Testing {name} at {ip}:{port}")
    
    # Build URL
    now = datetime.now()
    two_hours_ago = now - timedelta(hours=2)
    
    # Format dates
    time_start = two_hours_ago.strftime("%Y-%m-%d-%H:%M:%S")
    time_end = now.strftime("%Y-%m-%d-%H:%M:%S")
    
    url = f"http://{ip}:{port}/dataloader.cgi"
    params = {
        'dw': 'vcalogcsv',
        'report_type': '0',
        'statistics_type': '3',
        'linetype': '31',
        'time_start': time_start,
        'time_end': time_end
    }
    
    # Create auth header
    auth_string = base64.b64encode(b"admin:grnl.2024").decode('utf-8')
    headers = {
        'Authorization': f'Basic {auth_string}'
    }
    
    try:
        print(f"   URL: {url}")
        print(f"   Params: {params}")
        
        response = requests.get(url, params=params, headers=headers, timeout=30)
        
        if response.status_code == 200:
            print(f"   ✅ Success! Response length: {len(response.text)} bytes")
            # Show first line of CSV
            first_line = response.text.split('\n')[0] if response.text else "No data"
            print(f"   📊 First line: {first_line[:100]}...")
            return True
        else:
            print(f"   ❌ HTTP {response.status_code}: {response.text[:200]}")
            return False
            
    except requests.exceptions.Timeout:
        print(f"   ❌ Timeout - sensor not reachable")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Connection error: {str(e)}")
        return False
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return False

# Test all sensors
sensors = [
    ("J&J Arrábida", "176.79.62.167", 2102),
    ("Omnia Guimarães", "93.108.96.96", 21001),
    ("Omnia Almada", "188.37.175.41", 2201),
    ("Omnia NorteShopping", "188.37.124.33", 21002)
]

print("🧪 Testing sensor accessibility from cloud...")
print("=" * 50)

results = []
for name, ip, port in sensors:
    success = test_sensor(name, ip, port)
    results.append((name, success))

print("\n📊 Summary:")
print("=" * 50)
for name, success in results:
    status = "✅ Accessible" if success else "❌ Not accessible"
    print(f"{name}: {status}")

# Test direct curl command
print("\n🔧 Testing with curl command:")
import subprocess
try:
    cmd = [
        "curl", "-s", "-w", "\\nHTTP_CODE:%{http_code}",
        "-u", "admin:grnl.2024",
        f"http://176.79.62.167:2102/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start={time_start}&time_end={time_end}"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if "HTTP_CODE:200" in result.stdout:
        print("✅ Curl command works!")
    else:
        print(f"❌ Curl failed: {result.stdout[-100:]}")
except Exception as e:
    print(f"❌ Curl error: {e}")