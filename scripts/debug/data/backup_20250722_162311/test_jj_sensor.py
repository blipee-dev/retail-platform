#!/usr/bin/env python3
"""
Test connection to J&J ArrábidaShopping sensor
"""

import os
import sys
import json
from datetime import datetime, timedelta

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig


def test_sensor_connection():
    """Test connection to the J&J sensor"""
    print("🔍 Testing connection to J&J - 01 - ArrábidaShopping sensor...")
    print(f"   IP: http://176.79.62.167:2102/")
    print(f"   Store: J&J - 01 - ArrábidaShopping\n")
    
    # Load configuration
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sensors', 'jj_01_arrábida.json')
    with open(config_path, 'r') as f:
        config_data = json.load(f)
    
    # Create connector configuration
    connector_config = ConnectorConfig(
        name=config_data['sensor_name'],
        type='milesight_people_counter',
        store=config_data['location'],
        connection=config_data['connection'],
        endpoints={},  # Milesight connector builds these dynamically
        data_mapping=config_data['data_mapping']
    )
    
    # Initialize connector
    connector = MilesightConnector(connector_config)
    
    # Test authentication
    print("1️⃣ Testing authentication...")
    if connector.authenticate():
        print("✅ Authentication successful!")
    else:
        print("❌ Authentication failed!")
        return False
    
    # Test real-time status
    print("\n2️⃣ Getting real-time status...")
    try:
        status = connector.get_real_time_status()
        if status:
            print("✅ Real-time status retrieved:")
            print(f"   - Counter alarm status: {status.get('counter_alarm_status', 'N/A')}")
            print(f"   - Region 1 in alarm: {status.get('region1_in_alarm', 'N/A')}")
            print(f"   - Region 1 out alarm: {status.get('region1_out_alarm', 'N/A')}")
        else:
            print("⚠️  No real-time status available")
    except Exception as e:
        print(f"❌ Error getting real-time status: {str(e)}")
    
    # Test people counting data (last hour)
    print("\n3️⃣ Getting people counting data (last hour)...")
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=1)
        
        # Fetch raw data
        raw_data = connector.fetch_data(start_time, end_time, 'people_counting')
        if raw_data:
            # Parse the data
            parsed_data = connector.parse_data(raw_data, 'people_counting')
            if parsed_data:
                print(f"✅ Retrieved {len(parsed_data)} records")
                if len(parsed_data) > 0:
                    print("\n   Latest data:")
                    latest = parsed_data[-1]
                    print(f"   - Timestamp: {latest.get('timestamp', 'N/A')}")
                    print(f"   - Line 1: In={latest.get('line1_in', 0)}, Out={latest.get('line1_out', 0)}")
                    print(f"   - Line 2: In={latest.get('line2_in', 0)}, Out={latest.get('line2_out', 0)}")
                    print(f"   - Line 3: In={latest.get('line3_in', 0)}, Out={latest.get('line3_out', 0)}")
                    print(f"   - Line 4: In={latest.get('line4_in', 0)}, Out={latest.get('line4_out', 0)}")
                    print(f"   - Total: In={latest.get('total_in', 0)}, Out={latest.get('total_out', 0)}")
            else:
                print("⚠️  No data parsed")
        else:
            print("⚠️  No people counting data available for the last hour")
    except Exception as e:
        print(f"❌ Error getting people counting data: {str(e)}")
    
    # Test regional counting (if supported)
    if connector.supports_regional_counting:
        print("\n4️⃣ Getting regional counting data (last hour)...")
        try:
            # Fetch raw regional data
            raw_regional = connector.fetch_data(start_time, end_time, 'regional_counting')
            if raw_regional:
                # Parse the data
                parsed_regional = connector.parse_data(raw_regional, 'regional_counting')
                if parsed_regional:
                    print(f"✅ Retrieved {len(parsed_regional)} regional records")
                    if len(parsed_regional) > 0:
                        latest = parsed_regional[-1]
                        print(f"   - Region 1: {latest.get('region1_count', 0)} people")
                        print(f"   - Region 2: {latest.get('region2_count', 0)} people")
                        print(f"   - Region 3: {latest.get('region3_count', 0)} people")
                        print(f"   - Region 4: {latest.get('region4_count', 0)} people")
                else:
                    print("⚠️  No regional data parsed")
            else:
                print("⚠️  No regional counting data available")
        except Exception as e:
            print(f"❌ Error getting regional counting data: {str(e)}")
    
    print("\n✅ Sensor connection test completed!")
    return True


if __name__ == "__main__":
    test_sensor_connection()