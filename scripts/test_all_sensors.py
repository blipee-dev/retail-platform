#!/usr/bin/env python3
"""Test all sensor connections and retrieve sample data."""

import json
import sys
import os
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.connector_system.milesight_connector import MilesightConnector
from types import SimpleNamespace


def test_sensor(config_file, sensor_name):
    """Test a single sensor connection."""
    print(f"\n{'='*60}")
    print(f"Testing: {sensor_name}")
    print(f"Config: {config_file}")
    print('='*60)
    
    try:
        # Load config
        with open(config_file, 'r') as f:
            config_dict = json.load(f)
        
        # Convert to SimpleNamespace for the connector
        config = SimpleNamespace(
            name=config_dict.get('sensor_name', 'Unknown'),
            api_config=SimpleNamespace(**config_dict['api_config']),
            endpoints=config_dict['endpoints']
        )
        
        # Create connector
        connector = MilesightConnector(config)
        
        # Test connection
        print("\n1. Testing connection...")
        if connector.test_connection():
            print("✅ Connection successful!")
        else:
            print("❌ Connection failed!")
            return False
        
        # Get device info
        print("\n2. Getting device info...")
        device_info = connector.get_device_info()
        if device_info:
            print(f"✅ Device Model: {device_info.get('model', 'Unknown')}")
            print(f"   Firmware: {device_info.get('firmware', 'Unknown')}")
            print(f"   Serial: {device_info.get('serial', 'Unknown')}")
        
        # Get people counting data (last hour)
        print("\n3. Getting people counting data...")
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)
        
        people_data = connector.get_people_counting_data(
            start_time=start_time.strftime("%Y-%m-%d %H:%M:%S"),
            end_time=end_time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        if people_data and people_data['data']:
            latest = people_data['data'][-1] if people_data['data'] else {}
            print(f"✅ People counting data retrieved!")
            print(f"   Records: {len(people_data['data'])}")
            print(f"   Latest timestamp: {latest.get('timestamp', 'N/A')}")
            print(f"   Total In: {latest.get('total_in', 0)}")
            print(f"   Total Out: {latest.get('total_out', 0)}")
            if 'capture_rate' in latest:
                print(f"   Capture Rate: {latest.get('capture_rate', 0):.1f}%")
                print(f"   Passing Traffic: {latest.get('passing_traffic', 0)}")
        else:
            print("⚠️  No people counting data in the last hour")
        
        # Get regional counting data
        print("\n4. Getting regional counting data...")
        regional_data = connector.get_regional_counting_data(
            start_time=start_time.strftime("%Y-%m-%d %H:%M:%S"),
            end_time=end_time.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        if regional_data and regional_data['data']:
            latest = regional_data['data'][-1] if regional_data['data'] else {}
            print(f"✅ Regional counting data retrieved!")
            print(f"   Records: {len(regional_data['data'])}")
            for i in range(1, 5):
                count = latest.get(f'region{i}_count', 0)
                if count > 0:
                    print(f"   Region {i}: {count} people")
        else:
            print("⚠️  No regional counting data (regions may not be configured)")
        
        # Get current stats
        print("\n5. Getting current statistics...")
        current_stats = connector.get_current_people_count()
        if current_stats:
            print(f"✅ Current stats:")
            print(f"   Total In Today: {current_stats.get('total_in', 0)}")
            print(f"   Total Out Today: {current_stats.get('total_out', 0)}")
            print(f"   Current Occupancy: {current_stats.get('current_occupancy', 0)}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing sensor: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Test all configured sensors."""
    print("\n" + "="*60)
    print("TESTING ALL SENSOR CONNECTIONS")
    print("="*60)
    
    # Define all sensors to test
    sensors = [
        {
            "name": "J&J Arrábida (Jack & Jones)",
            "config": "config/sensors/jj_01_arrábida.json"
        },
        {
            "name": "Omnia Guimarães Shopping",
            "config": "config/sensors/omnia_oml01_guimaraes.json"
        },
        {
            "name": "Omnia Fórum Almada",
            "config": "config/sensors/omnia_oml02_almada.json"
        },
        {
            "name": "Omnia NorteShopping",
            "config": "config/sensors/omnia_oml03_norteshopping.json"
        }
    ]
    
    # Test each sensor
    results = []
    for sensor in sensors:
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), sensor['config'])
        if os.path.exists(config_path):
            success = test_sensor(config_path, sensor['name'])
            results.append({
                'name': sensor['name'],
                'success': success,
                'config': sensor['config']
            })
        else:
            print(f"\n❌ Config file not found: {sensor['config']}")
            results.append({
                'name': sensor['name'],
                'success': False,
                'config': sensor['config'],
                'error': 'Config file not found'
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
        if not result['success'] and 'error' in result:
            print(f"   Error: {result['error']}")
    
    return successful == len(results)


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)