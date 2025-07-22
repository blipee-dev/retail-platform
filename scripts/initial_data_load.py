#!/usr/bin/env python3
"""
Initial data load - Collect all available data from July 21st 00:00:00
"""
import os
import sys
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig

def load_initial_data():
    """Load all available data starting from July 21st 00:00:00"""
    
    # API configuration
    api_base_url = os.environ.get('API_BASE_URL', 'http://localhost:3001')
    api_key = os.environ.get('INTERNAL_API_KEY', 'development-key')
    
    print("="*80)
    print("INITIAL DATA LOAD - Starting from July 21st, 2025 00:00:00")
    print("="*80)
    
    # Get sensors from API
    try:
        response = requests.get(
            f"{api_base_url}/api/internal/sensors",
            headers={'x-api-key': api_key}
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to get sensors: {response.status_code}")
            return
            
        sensors_data = response.json()
        sensors = sensors_data.get('sensors', [])
        
        print(f"\n✅ Found {len(sensors)} sensors to process")
        
    except Exception as e:
        print(f"❌ Error loading sensors: {str(e)}")
        return
    
    # Define time range - from midnight today
    start_time = datetime(2025, 7, 21, 0, 0, 0)
    end_time = datetime.now()
    
    print(f"\n📅 Time range: {start_time} to {end_time}")
    
    total_records = 0
    
    # Process each sensor
    for sensor in sensors:
        print(f"\n{'='*60}")
        print(f"Processing: {sensor['sensor_name']}")
        print(f"Store: {sensor['stores']['name']}")
        print(f"{'='*60}")
        
        # Create connector configuration
        config_data = {
            "sensor_name": sensor['sensor_name'],
            "location": sensor.get('location', 'Main Entrance'),
            "type": sensor['sensor_type'],
            "connection": {
                "host": sensor['sensor_ip'],
                "port": sensor['sensor_port'],
                "protocol": "http",
                "auth": {
                    "type": "basic",
                    "username": sensor['config'].get('credentials', {}).get('username', 'admin'),
                    "password": sensor['config'].get('credentials', {}).get('password', 'grnl.2024')
                },
                "timeout": 30
            },
            "endpoints": {
                "people_counting": {
                    "endpoint": "/dataloader.cgi",
                    "method": "GET",
                    "params": {
                        "report_type": 0,  # Daily
                        "statistics_type": 3,  # Hourly
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
        
        # Authenticate
        if not connector.authenticate():
            print(f"❌ Authentication failed for {sensor['sensor_name']}")
            continue
            
        print("✅ Authentication successful")
        
        # Fetch data
        try:
            raw_data = connector.fetch_data(start_time, end_time, 'people_counting')
            
            if raw_data:
                parsed_data = connector.parse_data(raw_data, 'people_counting')
                
                if parsed_data:
                    # Filter valid data (not future, has actual counts)
                    valid_data = []
                    current_time = datetime.now()
                    
                    for record in parsed_data:
                        timestamp = record.get('timestamp')
                        
                        # Skip future data
                        if timestamp > current_time:
                            continue
                            
                        # Only include data from July 21st onwards
                        if timestamp < start_time:
                            continue
                            
                        # Check if has any counts (not all zeros)
                        total_count = sum([
                            record.get('line1_in', 0),
                            record.get('line1_out', 0),
                            record.get('line2_in', 0),
                            record.get('line2_out', 0),
                            record.get('line3_in', 0),
                            record.get('line3_out', 0),
                            record.get('line4_in', 0),
                            record.get('line4_out', 0)
                        ])
                        
                        if total_count > 0:
                            valid_data.append(record)
                    
                    print(f"📊 Found {len(valid_data)} hours with data (filtered from {len(parsed_data)} total)")
                    
                    # Send each record to database
                    success_count = 0
                    for record in valid_data:
                        # Prepare payload
                        timestamp = record.get('timestamp')
                        if isinstance(timestamp, datetime):
                            timestamp = timestamp.isoformat()
                            
                        payload_data = {
                            "sensor_id": sensor['id'],
                            "organization_id": sensor['organization_id'],
                            "store_id": sensor['store_id'],
                            "timestamp": timestamp,
                            "end_time": record.get('end_time').isoformat() if isinstance(record.get('end_time'), datetime) else record.get('end_time'),
                            "line1_in": record.get('line1_in', 0),
                            "line1_out": record.get('line1_out', 0),
                            "line2_in": record.get('line2_in', 0),
                            "line2_out": record.get('line2_out', 0),
                            "line3_in": record.get('line3_in', 0),
                            "line3_out": record.get('line3_out', 0),
                            "line4_in": record.get('line4_in', 0),
                            "line4_out": record.get('line4_out', 0)
                        }
                        
                        # Send to API
                        try:
                            response = requests.post(
                                f"{api_base_url}/api/internal/ingest",
                                json={
                                    "type": "people_counting",
                                    "data": payload_data
                                },
                                headers={
                                    "Content-Type": "application/json",
                                    "x-api-key": api_key
                                }
                            )
                            
                            if response.status_code == 200:
                                success_count += 1
                                print(f"   ✅ {record.get('timestamp')}: Entries={record.get('line1_in', 0) + record.get('line2_in', 0) + record.get('line3_in', 0)}, Exits={record.get('line1_out', 0) + record.get('line2_out', 0) + record.get('line3_out', 0)}, Passing={record.get('line4_in', 0) + record.get('line4_out', 0)}")
                            else:
                                print(f"   ❌ Failed to store {timestamp}: {response.status_code}")
                                
                        except Exception as e:
                            print(f"   ❌ Error storing {timestamp}: {str(e)}")
                    
                    print(f"\n✅ Successfully stored {success_count} records")
                    total_records += success_count
                    
                else:
                    print("⚠️  No data parsed")
            else:
                print("⚠️  No raw data received")
                
        except Exception as e:
            print(f"❌ Error collecting data: {str(e)}")
    
    print(f"\n{'='*80}")
    print(f"INITIAL LOAD COMPLETE")
    print(f"Total records stored: {total_records}")
    print(f"{'='*80}")

if __name__ == "__main__":
    load_initial_data()