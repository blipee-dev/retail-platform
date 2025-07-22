#!/usr/bin/env python3
"""Test Omnia sensors using EXACT J&J format."""

import os
import sys
import json
from datetime import datetime, timedelta

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig


def test_sensor(name, host, port):
    """Test sensor using EXACT J&J configuration."""
    print(f"\n{'='*60}")
    print(f"🔍 Testing connection to {name}...")
    print(f"   IP: http://{host}:{port}/")
    print('='*60)
    
    # Create EXACT same configuration as J&J
    config_data = {
        "sensor_name": name,
        "location": name,  # Store name
        "type": "milesight_people_counter",
        "connection": {
            "host": host,
            "port": port,
            "protocol": "http",
            "auth": {
                "type": "basic",
                "username": "admin",
                "password": "grnl.2024"
            },
            "timeout": 30
        },
        "endpoints": {
            "people_counting": {
                "endpoint": "/dataloader.cgi",
                "method": "GET",
                "params": {
                    "report_type": 0,
                    "statistics_type": 3,
                    "linetype": 31
                }
            },
            "regional_counting": {
                "endpoint": "/dataloader.cgi",
                "method": "GET",
                "params": {
                    "report_type": 0
                }
            }
        },
        "data_mapping": {
            "timestamp_format": "%Y/%m/%d %H:%M:%S",
            "line_count": 4,
            "region_count": 4,
            "supports_regional_counting": True,
            "supports_real_time_status": True
        }
    }
    
    # Create connector configuration
    connector_config = ConnectorConfig(
        name=config_data['sensor_name'],
        type='milesight_people_counter',
        store=config_data['location'],
        connection=config_data['connection'],
        endpoints=config_data.get('endpoints', {}),
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
            print(f"   - Current in count: {status.get('current_in_count', 0)}")
            print(f"   - Current out count: {status.get('current_out_count', 0)}")
            print(f"   - Current capacity: {status.get('current_capacity_count', 0)}")
        else:
            print("⚠️  No real-time status available")
    except Exception as e:
        print(f"❌ Error getting real-time status: {str(e)}")
    
    # Test people counting data (last 24 hours)
    print("\n3️⃣ Getting people counting data (last 24 hours)...")
    try:
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=24)
        
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
                    print(f"\n   Store Entry Lines (1-3):")
                    print(f"   - Line 1: In={latest.get('line1_in', 0)}, Out={latest.get('line1_out', 0)}")
                    print(f"   - Line 2: In={latest.get('line2_in', 0)}, Out={latest.get('line2_out', 0)}")
                    print(f"   - Line 3: In={latest.get('line3_in', 0)}, Out={latest.get('line3_out', 0)}")
                    print(f"   - Store Total: In={latest.get('total_in', 0)}, Out={latest.get('total_out', 0)}")
                    print(f"\n   Passing Traffic (Line 4):")
                    print(f"   - Line 4: In={latest.get('line4_in', 0)}, Out={latest.get('line4_out', 0)}")
                    print(f"   - Total Passing: {latest.get('passing_traffic', 0)} people")
                    print(f"   - Dominant Direction: {latest.get('dominant_direction', 'N/A')}")
                    print(f"   - Capture Rate: {latest.get('capture_rate', 0):.1f}%")
            else:
                print("⚠️  No data parsed")
        else:
            print("⚠️  No people counting data available")
    except Exception as e:
        print(f"❌ Error getting people counting data: {str(e)}")
    
    # Test regional counting
    if connector.supports_regional_counting:
        print("\n4️⃣ Getting regional counting data (last 24 hours)...")
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
    
    print(f"\n✅ Test completed for {name}!")
    return True


def main():
    """Test all sensors with exact J&J format."""
    sensors = [
        {
            "name": "J&J - 01 - ArrábidaShopping",
            "host": "176.79.62.167",
            "port": 2102
        },
        {
            "name": "OML01 - Omnia Guimarães Shopping",
            "host": "93.108.96.96",
            "port": 21001
        },
        {
            "name": "OML02 - Omnia Fórum Almada",
            "host": "188.37.175.41", 
            "port": 2201
        },
        {
            "name": "OML03 - Omnia NorteShopping",
            "host": "188.37.124.33",
            "port": 21002
        }
    ]
    
    print("\n" + "="*60)
    print("TESTING ALL SENSORS WITH EXACT J&J FORMAT")
    print("Using MilesightConnector with identical configuration")
    print("="*60)
    
    results = []
    for sensor in sensors:
        success = test_sensor(
            sensor['name'],
            sensor['host'],
            sensor['port']
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