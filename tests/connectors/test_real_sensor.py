#!/usr/bin/env python3
"""
Test script for connecting to real Milesight sensors
"""

import logging
import requests
from datetime import datetime, timedelta
from src.connector_system import ConfigLoader, ConnectorFactory
import json
import time

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def discover_sensor(host, port=80, timeout=10):
    """Discover and validate a Milesight sensor"""
    print(f"\n🔍 Discovering sensor at {host}:{port}...")
    
    # Test basic connectivity
    try:
        response = requests.get(f"http://{host}:{port}/", timeout=timeout)
        print(f"   ✅ HTTP connectivity: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"   ❌ HTTP connectivity failed: {str(e)}")
        return False
    
    # Test with common Milesight credentials
    common_creds = [
        ("admin", "admin"),
        ("admin", "123456"),
        ("admin", ""),
        ("admin", "ms1234"),
        ("admin", "milesight"),
        ("root", "root"),
        ("admin", "password")
    ]
    
    for username, password in common_creds:
        try:
            auth = (username, password)
            url = f"http://{host}:{port}/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"
            response = requests.get(url, auth=auth, timeout=timeout)
            
            if response.status_code == 200:
                print(f"   ✅ Authentication successful: {username}/***** ")
                print(f"   📡 Response sample: {response.text[:100]}...")
                return True, username, password
            elif response.status_code == 401:
                print(f"   ❌ Authentication failed: {username}/*****")
            else:
                print(f"   ⚠️  Unexpected response: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Connection error with {username}: {str(e)}")
            continue
    
    print(f"   ❌ Unable to authenticate with common credentials")
    return False

def test_sensor_capabilities(host, port, username, password):
    """Test what capabilities the sensor supports"""
    print(f"\n🧪 Testing sensor capabilities...")
    
    auth = (username, password)
    capabilities = {}
    
    # Test endpoints
    endpoints = {
        "VCA Status": "/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus",
        "VCA Config": "/cgi-bin/operator/operator.cgi?action=get.vca.count",
        "People Counting": "/dataloader.cgi?dw=vcalogcsv&type=0&time_start=2025-01-01-00:00:00&time_end=2025-01-01-01:00:00",
        "Regional Counting": "/dataloader.cgi?dw=regionalcountlogcsv&time_start=2025-01-01-00:00:00&report_type=0",
        "Heatmap": "/dataloader.cgi?dw=heatmapcsv&sub_type=0&time_start=2025-01-01-00:00:00",
        "Space Heatmap": "/dataloader.cgi?dw=spaceheatmap&sub_type=0&time_start=2025-01-01-00:00:00"
    }
    
    for name, endpoint in endpoints.items():
        try:
            url = f"http://{host}:{port}{endpoint}"
            response = requests.get(url, auth=auth, timeout=10)
            
            if response.status_code == 200:
                print(f"   ✅ {name}: Available")
                capabilities[name] = True
                
                # Show sample data
                if len(response.text) > 0:
                    sample = response.text[:200].replace('\n', ' ').replace('\r', ' ')
                    print(f"      Sample: {sample}...")
                else:
                    print(f"      (No data returned)")
            else:
                print(f"   ❌ {name}: Not available ({response.status_code})")
                capabilities[name] = False
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ {name}: Connection error - {str(e)}")
            capabilities[name] = False
    
    return capabilities

def create_sensor_config(host, port, username, password, capabilities):
    """Create a configuration file for the discovered sensor"""
    print(f"\n📝 Creating sensor configuration...")
    
    config = {
        "connector": {
            "name": f"Real Milesight Sensor - {host}",
            "type": "milesight",
            "store": f"Test Location - {host}",
            "description": f"Real sensor test at {host}:{port}",
            
            "connection": {
                "host": host,
                "port": port,
                "auth": {
                    "type": "basic",
                    "username": username,
                    "password": password
                }
            },
            
            "endpoints": {},
            
            "data_mapping": {
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "heatmap_timestamp_format": "%Y-%m-%d %H:%M:%S",
                "supports_real_time_status": capabilities.get("VCA Status", False),
                "supports_regional_counting": capabilities.get("Regional Counting", False),
                "line_count": 4,
                "region_count": 4,
                "fields": [
                    {"source": "StartTime", "target": "start_time", "type": "timestamp"},
                    {"source": "EndTime", "target": "end_time", "type": "timestamp"},
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line2 - In", "target": "line2_in", "type": "integer"},
                    {"source": "Line3 - In", "target": "line3_in", "type": "integer"},
                    {"source": "Line4 - In", "target": "line4_in", "type": "integer"},
                    {"source": "Line1 - Out", "target": "line1_out", "type": "integer"},
                    {"source": "Line2 - Out", "target": "line2_out", "type": "integer"},
                    {"source": "Line3 - Out", "target": "line3_out", "type": "integer"},
                    {"source": "Line4 - Out", "target": "line4_out", "type": "integer"}
                ]
            },
            
            "collection_settings": {
                "retry_attempts": 3,
                "timeout": 30,
                "polling_interval": 300,
                "batch_size_hours": 1
            }
        }
    }
    
    # Add available endpoints
    if capabilities.get("People Counting", False):
        config["connector"]["endpoints"]["people_counting"] = {
            "params": {"type": 0}
        }
    
    if capabilities.get("Regional Counting", False):
        config["connector"]["endpoints"]["regional_counting"] = {
            "params": {
                "report_type": 0,
                "region1": 1,
                "region2": 1,
                "region3": 1,
                "region4": 1
            }
        }
    
    if capabilities.get("Heatmap", False):
        config["connector"]["endpoints"]["heatmap"] = {
            "params": {"sub_type": 0}
        }
    
    if capabilities.get("Space Heatmap", False):
        config["connector"]["endpoints"]["space_heatmap"] = {
            "params": {"sub_type": 0}
        }
    
    # Save configuration
    config_file = f"real_sensor_{host.replace('.', '_')}.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"   ✅ Configuration saved to: {config_file}")
    return config_file

def test_real_data_collection(config_file):
    """Test actual data collection from the real sensor"""
    print(f"\n📊 Testing real data collection...")
    
    try:
        # Load configuration
        config = ConfigLoader.load_from_file(config_file)
        
        # Create connector
        connector = ConnectorFactory.create_connector(config)
        
        # Test connection
        if not connector.validate_connection():
            print("   ❌ Connection validation failed")
            return False
        
        print("   ✅ Connection validated")
        
        # Test real-time status
        if hasattr(connector, 'get_real_time_status'):
            status = connector.get_real_time_status()
            if status:
                print(f"   📈 Real-time status:")
                print(f"      In: {status.get('current_in_count', 'N/A')}")
                print(f"      Out: {status.get('current_out_count', 'N/A')}")
                print(f"      Capacity: {status.get('current_capacity_count', 'N/A')}")
                print(f"      Timestamp: {status.get('timestamp', 'N/A')}")
            else:
                print("   ⚠️  Real-time status not available")
        
        # Test historical data collection
        print(f"\n   📈 Testing historical data collection...")
        
        # Try different time ranges
        time_ranges = [
            (timedelta(hours=1), "Last 1 hour"),
            (timedelta(hours=6), "Last 6 hours"), 
            (timedelta(days=1), "Last 24 hours"),
            (timedelta(days=7), "Last 7 days")
        ]
        
        for time_delta, description in time_ranges:
            try:
                end_time = datetime.now()
                start_time = end_time - time_delta
                
                print(f"   🕐 Testing {description} ({start_time.strftime('%Y-%m-%d %H:%M')} to {end_time.strftime('%Y-%m-%d %H:%M')})...")
                
                # Get available endpoints
                available_endpoints = list(config.endpoints.keys())
                if not available_endpoints:
                    available_endpoints = ['people_counting']  # Default fallback
                
                data = connector.collect_data(start_time, end_time, available_endpoints)
                
                total_records = 0
                for endpoint, records in data.items():
                    record_count = len(records)
                    total_records += record_count
                    
                    if record_count > 0:
                        print(f"      ✅ {endpoint}: {record_count} records")
                        
                        # Show sample data
                        if records:
                            sample = records[0]
                            if 'total_in' in sample and 'total_out' in sample:
                                print(f"         Sample: {sample['total_in']} in, {sample['total_out']} out")
                            elif 'heat_value' in sample:
                                print(f"         Sample: Heat value {sample['heat_value']}")
                            elif 'region1_count' in sample:
                                region_counts = [sample.get(f'region{i}_count', 0) for i in range(1, 5)]
                                print(f"         Sample: Regions {region_counts}")
                    else:
                        print(f"      ⚠️  {endpoint}: No data")
                
                if total_records > 0:
                    print(f"   ✅ Successfully collected {total_records} total records for {description}")
                    return True
                    
            except Exception as e:
                print(f"   ❌ Error collecting {description}: {str(e)}")
                continue
        
        print("   ⚠️  No historical data found in any time range")
        return False
        
    except Exception as e:
        print(f"   ❌ Data collection test failed: {str(e)}")
        logger.error(f"Data collection error: {str(e)}", exc_info=True)
        return False

def main():
    """Main test function"""
    print("🎯 REAL MILESIGHT SENSOR TEST")
    print("=" * 40)
    
    # Get sensor details from user
    host = input("Enter sensor IP address (e.g., 192.168.1.100): ").strip()
    if not host:
        print("❌ No IP address provided")
        return
    
    port_input = input("Enter port (default 80): ").strip()
    port = int(port_input) if port_input else 80
    
    # Discover sensor
    discovery_result = discover_sensor(host, port)
    if not discovery_result:
        print("\n❌ Sensor discovery failed")
        
        # Ask for manual credentials
        manual_test = input("\nTry manual credentials? (y/n): ").strip().lower()
        if manual_test == 'y':
            username = input("Username: ").strip()
            password = input("Password: ").strip()
            
            # Test manual credentials
            try:
                auth = (username, password)
                url = f"http://{host}:{port}/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"
                response = requests.get(url, auth=auth, timeout=10)
                
                if response.status_code == 200:
                    print("✅ Manual credentials successful!")
                    discovery_result = True, username, password
                else:
                    print("❌ Manual credentials failed")
                    return
            except Exception as e:
                print(f"❌ Manual test failed: {str(e)}")
                return
        else:
            return
    
    # Extract credentials
    _, username, password = discovery_result
    
    # Test capabilities
    capabilities = test_sensor_capabilities(host, port, username, password)
    
    # Create configuration
    config_file = create_sensor_config(host, port, username, password, capabilities)
    
    # Test data collection
    success = test_real_data_collection(config_file)
    
    # Summary
    print(f"\n🏆 Test Results:")
    if success:
        print("   ✅ Successfully connected to real Milesight sensor!")
        print("   ✅ Data collection working")
        print(f"   📁 Configuration saved: {config_file}")
        print("\n   🚀 You can now use this configuration in production:")
        print(f"      config = ConfigLoader.load_from_file('{config_file}')")
        print(f"      connector = ConnectorFactory.create_connector(config)")
        print(f"      data = connector.collect_data(start_time, end_time)")
    else:
        print("   ⚠️  Connection established but data collection had issues")
        print("   🔧 Check sensor configuration and try different time ranges")
        print(f"   📁 Configuration saved: {config_file}")

if __name__ == "__main__":
    main()