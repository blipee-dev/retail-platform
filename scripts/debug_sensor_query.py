#!/usr/bin/env python3
"""
Debug script to see what the sensors are actually returning
"""
import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig

def debug_sensor_query():
    """Debug what we're getting from the sensor"""
    
    # Configure J&J sensor
    config_data = {
        "sensor_name": "J&J Test",
        "location": "Test",
        "type": "milesight_people_counter",
        "connection": {
            "host": "176.79.62.167",
            "port": 2102,
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
            }
        },
        "data_mapping": {
            "timestamp_format": "%Y/%m/%d %H:%M:%S",
            "line_count": 4,
            "supports_regional_counting": True,
            "supports_real_time_status": True
        }
    }
    
    # Create connector
    connector_config = ConnectorConfig(
        name=config_data['sensor_name'],
        type='milesight_people_counter',
        store=config_data['location'],
        connection=config_data['connection'],
        endpoints=config_data.get('endpoints', {}),
        data_mapping=config_data['data_mapping']
    )
    
    connector = MilesightConnector(connector_config)
    
    # Test authentication
    if not connector.authenticate():
        print("Authentication failed!")
        return
        
    print("✅ Authentication successful")
    
    # Test with last 5 minutes
    end_time = datetime.now()
    start_time = end_time - timedelta(minutes=5)
    
    print(f"\n🔍 Querying data from {start_time} to {end_time}")
    
    # Build URL to see what we're actually requesting
    params = config_data['endpoints']['people_counting']['params']
    url = connector._build_dataloader_url('people_counting', start_time, end_time, **params)
    print(f"📡 URL: {url}")
    
    # Fetch raw data
    raw_data = connector.fetch_data(start_time, end_time, 'people_counting')
    
    # Show first 1000 chars of raw response
    print(f"\n📄 Raw response (first 1000 chars):")
    print(raw_data[:1000])
    
    # Parse data
    parsed_data = connector.parse_data(raw_data, 'people_counting')
    
    print(f"\n📊 Parsed {len(parsed_data)} records")
    
    # Show first 3 records
    for i, record in enumerate(parsed_data[:3]):
        print(f"\nRecord {i+1}:")
        print(f"  Timestamp: {record.get('timestamp')}")
        print(f"  End Time: {record.get('end_time')}")
        print(f"  Line 1: In={record.get('line1_in', 0)}, Out={record.get('line1_out', 0)}")
        print(f"  Line 4: In={record.get('line4_in', 0)}, Out={record.get('line4_out', 0)}")
        
    # Check if we're getting future data
    now = datetime.now()
    future_records = [r for r in parsed_data if r.get('timestamp') > now]
    if future_records:
        print(f"\n⚠️  WARNING: Found {len(future_records)} records with future timestamps!")
        print(f"Latest timestamp: {max(r.get('timestamp') for r in parsed_data)}")

if __name__ == "__main__":
    debug_sensor_query()