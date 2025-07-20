#!/usr/bin/env python3
"""
Targeted test for OML01-Omnia GuimarãesShopping sensor
"""

import requests
from datetime import datetime, timedelta
import json
import logging
from src.connector_system import ConfigLoader, ConnectorFactory

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_omnia_sensor():
    """Test the specific Omnia sensor"""
    host = "93.108.96.96"
    port = 21001
    username = "admin"
    password = "grnl.2024"
    
    print(f"🏪 Testing OML01-Omnia GuimarãesShopping Sensor")
    print(f"   📍 Location: {host}:{port}")
    print(f"   🔑 Auth: {username}/*****")
    print("=" * 50)
    
    auth = (username, password)
    base_url = f"http://{host}:{port}"
    
    # Test 1: Basic connectivity
    print("\n1️⃣ Testing basic connectivity...")
    try:
        response = requests.get(f"{base_url}/", timeout=10)
        print(f"   ✅ HTTP Response: {response.status_code}")
        if response.headers.get('server'):
            print(f"   🖥️  Server: {response.headers.get('server')}")
    except Exception as e:
        print(f"   ❌ Connection failed: {str(e)}")
        return False
    
    # Test 2: Authentication and VCA status
    print("\n2️⃣ Testing authentication and VCA status...")
    try:
        url = f"{base_url}/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"
        response = requests.get(url, auth=auth, timeout=15)
        
        if response.status_code == 200:
            print(f"   ✅ Authentication successful")
            
            # Parse the response
            text = response.text
            print(f"   📡 Raw response length: {len(text)} chars")
            
            # Extract key values
            values = {}
            for line in text.split(';'):
                if '=' in line and 'var ' in line:
                    var_part = line.split('var ')[1] if 'var ' in line else line
                    if '=' in var_part:
                        name, value = var_part.split('=', 1)
                        name = name.strip()
                        value = value.strip().strip("'\"")
                        values[name] = value
            
            print(f"   📊 Current Status:")
            print(f"      In Count: {values.get('current_in_count', 'N/A')}")
            print(f"      Out Count: {values.get('current_out_count', 'N/A')}")
            print(f"      Sum Count: {values.get('current_sum_count', 'N/A')}")
            print(f"      Capacity: {values.get('current_capacity_count', 'N/A')}")
            print(f"      Counter Alarm: {values.get('current_counter_alarm', 'N/A')}")
            
        else:
            print(f"   ❌ Authentication failed: {response.status_code}")
            print(f"   📄 Response: {response.text[:200]}...")
            return False
    except Exception as e:
        print(f"   ❌ VCA status test failed: {str(e)}")
        return False
    
    # Test 3: VCA Configuration
    print("\n3️⃣ Testing VCA configuration...")
    try:
        url = f"{base_url}/cgi-bin/operator/operator.cgi?action=get.vca.count"
        response = requests.get(url, auth=auth, timeout=15)
        
        if response.status_code == 200:
            print(f"   ✅ VCA config retrieved")
            
            # Parse configuration
            text = response.text
            config_values = {}
            for line in text.split(';'):
                if '=' in line and 'var ' in line:
                    var_part = line.split('var ')[1] if 'var ' in line else line
                    if '=' in var_part:
                        name, value = var_part.split('=', 1)
                        name = name.strip()
                        value = value.strip().strip("'\"")
                        config_values[name] = value
            
            print(f"   ⚙️  Configuration:")
            print(f"      Count Enabled: {config_values.get('count_enable', 'N/A')}")
            print(f"      Auto Reset: {config_values.get('auto_reset_enable', 'N/A')}")
            print(f"      Reset Time: {config_values.get('auto_reset_hour', 'N/A')}:{config_values.get('auto_reset_min', 'N/A')}")
            
        else:
            print(f"   ❌ VCA config failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ VCA config test failed: {str(e)}")
    
    # Test 4: People counting data with different approaches
    print("\n4️⃣ Testing people counting data...")
    
    # Try different time ranges and parameters
    test_configs = [
        {
            "name": "Last 1 hour",
            "start_delta": timedelta(hours=1),
            "params": "dw=vcalogcsv&type=0"
        },
        {
            "name": "Last 6 hours", 
            "start_delta": timedelta(hours=6),
            "params": "dw=vcalogcsv&type=0"
        },
        {
            "name": "Last 24 hours",
            "start_delta": timedelta(hours=24),
            "params": "dw=vcalogcsv&type=0"
        },
        {
            "name": "All data types",
            "start_delta": timedelta(hours=6),
            "params": "dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3"
        }
    ]
    
    for config in test_configs:
        print(f"\n   🕐 Testing {config['name']}...")
        
        try:
            now = datetime.now()
            start_time = now - config['start_delta']
            
            # Format time for Milesight API
            time_start = start_time.strftime('%Y-%m-%d-%H:%M:%S')
            time_end = now.strftime('%Y-%m-%d-%H:%M:%S')
            
            url = f"{base_url}/dataloader.cgi?{config['params']}&time_start={time_start}&time_end={time_end}"
            print(f"      🔗 URL: {url}")
            
            response = requests.get(url, auth=auth, timeout=30)
            
            if response.status_code == 200:
                content = response.text.strip()
                if content:
                    lines = content.split('\n')
                    print(f"      ✅ Response: {len(lines)} lines")
                    
                    # Show first few lines
                    for i, line in enumerate(lines[:3]):
                        print(f"         Line {i+1}: {line[:100]}...")
                    
                    if len(lines) > 3:
                        print(f"         ... ({len(lines)-3} more lines)")
                    
                    # Try to parse as CSV
                    if len(lines) > 1 and ',' in lines[0]:
                        print(f"      📊 Appears to be CSV data with {len(lines)-1} records")
                        
                        # Show header
                        if lines[0]:
                            headers = lines[0].split(',')
                            print(f"      📋 Headers: {headers[:5]}...")
                        
                        return True
                else:
                    print(f"      ⚠️  Empty response")
            else:
                print(f"      ❌ Failed: {response.status_code}")
                print(f"      📄 Response: {response.text[:200]}...")
                
        except Exception as e:
            print(f"      ❌ Error: {str(e)}")
    
    # Test 5: Try the original data collector approach
    print("\n5️⃣ Testing original data collector approach...")
    try:
        now = datetime.now()
        start_time = now - timedelta(hours=1)
        
        # This matches the original data_collector.py URL pattern
        url = f"http://admin:grnl.2024@{host}:{port}/dataloader.cgi?dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3&time_start={start_time.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={now.strftime('%Y-%m-%d-%H:%M:%S')}"
        
        print(f"   🔗 Using original URL pattern...")
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            content = response.text.strip()
            if content:
                lines = content.split('\n')
                print(f"   ✅ Original approach works: {len(lines)} lines")
                
                # Show sample
                for i, line in enumerate(lines[:2]):
                    print(f"      Line {i+1}: {line}")
                
                return True
            else:
                print(f"   ⚠️  Original approach: Empty response")
        else:
            print(f"   ❌ Original approach failed: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Original approach error: {str(e)}")
    
    return False

def create_omnia_config():
    """Create configuration for the Omnia sensor"""
    config = {
        "connector": {
            "name": "OML01-Omnia GuimarãesShopping",
            "type": "milesight",
            "store": "Omnia GuimarãesShopping",
            "description": "People counting camera at Omnia Guimarães Shopping",
            
            "connection": {
                "host": "93.108.96.96",
                "port": 21001,
                "auth": {
                    "type": "basic",
                    "username": "admin",
                    "password": "grnl.2024"
                }
            },
            
            "endpoints": {
                "people_counting": {
                    "params": {
                        "type": 0,
                        "report_type": 0,
                        "linetype": 31,
                        "statistics_type": 3
                    }
                }
            },
            
            "data_mapping": {
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "supports_real_time_status": True,
                "line_count": 4,
                "fields": [
                    {"source": "StartTime", "target": "start_time", "type": "timestamp"},
                    {"source": "EndTime", "target": "end_time", "type": "timestamp"},
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line2 - In", "target": "line2_in", "type": "integer"},
                    {"source": "Line3 - In", "target": "line3_in", "type": "integer"},
                    {"source": "Line4 - In", "target": "line4_in", "type": "integer"},
                    {"source": "Line4 - Out", "target": "line4_out", "type": "integer"}
                ]
            },
            
            "collection_settings": {
                "retry_attempts": 3,
                "timeout": 30,
                "polling_interval": 300
            }
        }
    }
    
    # Save configuration
    with open("omnia_sensor_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"   ✅ Configuration saved to: omnia_sensor_config.json")
    return "omnia_sensor_config.json"

def test_with_connector():
    """Test using our connector system"""
    print("\n6️⃣ Testing with connector system...")
    
    # Create config
    config_file = create_omnia_config()
    
    try:
        # Load and test
        config = ConfigLoader.load_from_file(config_file)
        connector = ConnectorFactory.create_connector(config)
        
        # Test connection
        if connector.validate_connection():
            print("   ✅ Connector validation successful")
            
            # Test real-time status
            if hasattr(connector, 'get_real_time_status'):
                status = connector.get_real_time_status()
                if status:
                    print(f"   📊 Real-time status: {status}")
                
            # Test data collection
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=1)
            
            data = connector.collect_data(start_time, end_time)
            
            for endpoint, records in data.items():
                if records:
                    print(f"   ✅ {endpoint}: {len(records)} records")
                    if records:
                        print(f"      Sample: {records[0]}")
                else:
                    print(f"   ⚠️  {endpoint}: No records")
            
            return True
        else:
            print("   ❌ Connector validation failed")
            return False
            
    except Exception as e:
        print(f"   ❌ Connector test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🏪 OMNIA GUIMARÃES SHOPPING SENSOR TEST")
    print("=" * 50)
    
    # Test the sensor
    sensor_working = test_omnia_sensor()
    
    if sensor_working:
        print("\n🎉 Sensor connectivity confirmed!")
        
        # Test with our connector system
        connector_working = test_with_connector()
        
        if connector_working:
            print("\n✅ SUCCESS: Omnia sensor fully integrated!")
            print("   🚀 Ready for production use")
            print("   📁 Configuration: omnia_sensor_config.json")
        else:
            print("\n⚠️  Sensor works but connector needs adjustment")
    else:
        print("\n❌ Sensor connectivity issues found")
        print("   🔧 Check network connectivity and credentials")

if __name__ == "__main__":
    main()