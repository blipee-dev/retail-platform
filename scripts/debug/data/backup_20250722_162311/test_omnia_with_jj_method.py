#!/usr/bin/env python3
"""Test Omnia sensors using the exact J&J method."""

import json
import requests
from datetime import datetime, timedelta
import csv
from io import StringIO
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def parse_milesight_csv(csv_text):
    """Parse Milesight CSV data."""
    lines = csv_text.strip().split('\n')
    if len(lines) < 2:
        return []
    
    # Parse CSV
    csv_file = StringIO(csv_text)
    reader = csv.DictReader(csv_file)
    
    records = []
    for row in reader:
        # Fix column names (some have typos like "Tolal")
        fixed_row = {}
        for key, value in row.items():
            if key and value:
                # Fix common typos
                fixed_key = key.replace('Tolal', 'Total').strip()
                fixed_row[fixed_key] = value
        
        record = {
            'timestamp': f"{fixed_row.get('Date', '')} {fixed_row.get('Time', '')}".strip(),
        }
        
        # Extract line data
        for i in range(1, 5):
            in_key = f'Line {i} In' if f'Line {i} In' in fixed_row else f'Line{i} In'
            out_key = f'Line {i} Out' if f'Line {i} Out' in fixed_row else f'Line{i} Out'
            
            record[f'line{i}_in'] = int(fixed_row.get(in_key, 0) or 0)
            record[f'line{i}_out'] = int(fixed_row.get(out_key, 0) or 0)
        
        # Calculate totals
        record['total_in'] = sum(record[f'line{i}_in'] for i in range(1, 4))
        record['total_out'] = sum(record[f'line{i}_out'] for i in range(1, 4))
        record['passing_traffic'] = record['line4_in'] + record['line4_out']
        
        if record['passing_traffic'] > 0:
            record['capture_rate'] = (record['total_in'] / record['passing_traffic']) * 100
        else:
            record['capture_rate'] = 0
        
        records.append(record)
    
    return records


def test_sensor(name, host, port, username, password):
    """Test sensor using exact J&J method."""
    print(f"\n{'='*60}")
    print(f"🔍 Testing connection to {name}...")
    print(f"   IP: http://{host}:{port}/")
    print('='*60)
    
    base_url = f"http://{host}:{port}"
    session = requests.Session()
    session.auth = (username, password)
    session.verify = False
    
    try:
        # Test 1: Authentication
        print("\n1️⃣ Testing authentication...")
        response = session.get(f"{base_url}/api/v1/status")
        if response.status_code in [200, 404]:
            print("✅ Authentication successful!")
        else:
            print(f"❌ Authentication failed (status: {response.status_code})")
            return False
        
        # Test 2: Get people counting data using EXACT J&J parameters
        print("\n2️⃣ Getting people counting data (last 24 hours)...")
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
        # EXACT parameters from J&J test
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
                csv_data = response.text
                records = parse_milesight_csv(csv_data)
                
                print(f"✅ Retrieved {len(records)} records")
                
                if records:
                    latest = records[-1]
                    print(f"\n   Latest data:")
                    print(f"   - Timestamp: {latest['timestamp']}")
                    
                    print(f"\n   Store Entry Lines (1-3):")
                    for i in range(1, 4):
                        print(f"   - Line {i}: In={latest[f'line{i}_in']}, Out={latest[f'line{i}_out']}")
                    print(f"   - Store Total: In={latest['total_in']}, Out={latest['total_out']}")
                    
                    print(f"\n   Passing Traffic (Line 4):")
                    print(f"   - Line 4: In={latest['line4_in']}, Out={latest['line4_out']}")
                    print(f"   - Total Passing: {latest['passing_traffic']} people")
                    if latest['passing_traffic'] > 0:
                        dominant = 'in' if latest['line4_in'] > latest['line4_out'] else 'out'
                        print(f"   - Dominant Direction: {dominant}")
                        print(f"   - Capture Rate: {latest['capture_rate']:.1f}%")
            else:
                print(f"❌ Unexpected response type: {response.headers.get('content-type')}")
        else:
            print(f"❌ Failed to get data (status: {response.status_code})")
            print(f"   Response: {response.text[:200]}...")
        
        # Test 3: Get regional counting data
        print("\n3️⃣ Getting regional counting data (last 24 hours)...")
        params = {
            "type": "csv",
            "report_type": 1,
            "start_time": start_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end_time": end_time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        response = session.get(f"{base_url}/api/report", params=params)
        
        if response.status_code == 200:
            print("✅ Regional counting available")
        else:
            print(f"⚠️  Regional counting not configured (status: {response.status_code})")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Test all Omnia sensors using J&J method."""
    sensors = [
        {
            "name": "OML01-Omnia Guimarães Shopping",
            "host": "93.108.96.96",
            "port": 21001
        },
        {
            "name": "OML02-Omnia Fórum Almada",
            "host": "188.37.175.41", 
            "port": 2201
        },
        {
            "name": "OML03-Omnia NorteShopping",
            "host": "188.37.124.33",
            "port": 21002
        }
    ]
    
    # All use same credentials
    username = "admin"
    password = "grnl.2024"
    
    print("\n" + "="*60)
    print("TESTING OMNIA SENSORS WITH J&J METHOD")
    print("Using same credentials for all sensors")
    print("="*60)
    
    results = []
    for sensor in sensors:
        success = test_sensor(
            sensor['name'],
            sensor['host'],
            sensor['port'],
            username,
            password
        )
        results.append((sensor['name'], success))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for name, success in results:
        status = "✅" if success else "❌"
        print(f"{status} {name}")


if __name__ == "__main__":
    main()