#!/usr/bin/env python3
"""
Sensor Data Bridge - Connects Python sensor connectors to Next.js API

This script runs the Milesight connector and sends data to the Next.js API endpoints.
It can be run as a daemon or scheduled via cron for continuous data collection.
"""

import os
import sys
import json
import time
import requests
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import argparse

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class SensorDataBridge:
    """Bridge between Python sensor connectors and Next.js API"""
    
    def __init__(self, api_base_url: str, api_token: str):
        self.api_base_url = api_base_url.rstrip('/')
        self.api_token = api_token
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json'
        })
    
    def register_sensor(self, sensor_config: Dict[str, Any]) -> Optional[str]:
        """Register a new sensor with the API"""
        try:
            response = self.session.post(
                f"{self.api_base_url}/api/sensors",
                json=sensor_config
            )
            
            if response.status_code == 201:
                sensor_data = response.json()
                logger.info(f"Sensor registered successfully: {sensor_data['sensor']['id']}")
                return sensor_data['sensor']['id']
            elif response.status_code == 409:
                # Sensor already exists, try to get it
                logger.info("Sensor already exists, fetching existing sensor")
                return self.get_sensor_id(sensor_config['sensor_name'])
            else:
                logger.error(f"Failed to register sensor: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error registering sensor: {str(e)}")
            return None
    
    def get_sensor_id(self, sensor_name: str) -> Optional[str]:
        """Get sensor ID by name"""
        try:
            response = self.session.get(f"{self.api_base_url}/api/sensors")
            if response.status_code == 200:
                sensors = response.json()['sensors']
                for sensor in sensors:
                    if sensor['sensor_name'] == sensor_name:
                        return sensor['id']
            return None
        except Exception as e:
            logger.error(f"Error getting sensor ID: {str(e)}")
            return None
    
    def send_bulk_data(self, sensor_id: str, data_batches: List[Dict[str, Any]]) -> bool:
        """Send bulk data to the API"""
        try:
            payload = {
                'sensor_id': sensor_id,
                'data_batches': data_batches
            }
            
            response = self.session.post(
                f"{self.api_base_url}/api/sensors/bulk-ingest",
                json=payload
            )
            
            if response.status_code == 201:
                result = response.json()
                logger.info(f"Bulk data sent successfully: {result['total_inserted']} records inserted")
                return True
            else:
                logger.error(f"Failed to send bulk data: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error sending bulk data: {str(e)}")
            return False
    
    def collect_and_send_data(self, connector: MilesightConnector, sensor_id: str, 
                            start_time: datetime, end_time: datetime) -> bool:
        """Collect data from connector and send to API"""
        try:
            data_batches = []
            
            # Collect people counting data
            logger.info("Collecting people counting data...")
            people_data = connector.get_people_counting(start_time, end_time)
            if people_data and not people_data.empty:
                records = []
                for _, row in people_data.iterrows():
                    record = {
                        'timestamp': row['timestamp'].isoformat() if hasattr(row['timestamp'], 'isoformat') else str(row['timestamp']),
                        'end_time': row.get('end_time', row['timestamp']).isoformat() if hasattr(row.get('end_time', row['timestamp']), 'isoformat') else str(row.get('end_time', row['timestamp'])),
                        'line1_in': int(row.get('line1_in', 0)),
                        'line1_out': int(row.get('line1_out', 0)),
                        'line2_in': int(row.get('line2_in', 0)),
                        'line2_out': int(row.get('line2_out', 0)),
                        'line3_in': int(row.get('line3_in', 0)),
                        'line3_out': int(row.get('line3_out', 0)),
                        'line4_in': int(row.get('line4_in', 0)),
                        'line4_out': int(row.get('line4_out', 0))
                    }
                    records.append(record)
                
                data_batches.append({
                    'data_type': 'people_counting',
                    'records': records
                })
                logger.info(f"Collected {len(records)} people counting records")
            
            # Collect regional counting data if supported
            if connector.supports_regional_counting:
                logger.info("Collecting regional counting data...")
                regional_data = connector.get_regional_counting(start_time, end_time)
                if regional_data and not regional_data.empty:
                    records = []
                    for _, row in regional_data.iterrows():
                        record = {
                            'timestamp': row['timestamp'].isoformat() if hasattr(row['timestamp'], 'isoformat') else str(row['timestamp']),
                            'end_time': row.get('end_time', row['timestamp']).isoformat() if hasattr(row.get('end_time', row['timestamp']), 'isoformat') else str(row.get('end_time', row['timestamp'])),
                            'region1_count': int(row.get('region1_count', 0)),
                            'region2_count': int(row.get('region2_count', 0)),
                            'region3_count': int(row.get('region3_count', 0)),
                            'region4_count': int(row.get('region4_count', 0))
                        }
                        records.append(record)
                    
                    data_batches.append({
                        'data_type': 'regional_counting',
                        'records': records
                    })
                    logger.info(f"Collected {len(records)} regional counting records")
            
            # Collect heatmap data
            logger.info("Collecting heatmap data...")
            heatmap_data = connector.get_heatmap_data(start_time, end_time)
            if heatmap_data and not heatmap_data.empty:
                records = []
                for _, row in heatmap_data.iterrows():
                    record = {
                        'timestamp': row['timestamp'].isoformat() if hasattr(row['timestamp'], 'isoformat') else str(row['timestamp']),
                        'heat_value': float(row.get('heat_value', 0))
                    }
                    records.append(record)
                
                data_batches.append({
                    'data_type': 'heatmap',
                    'records': records
                })
                logger.info(f"Collected {len(records)} heatmap records")
            
            # Collect VCA alarm status
            if connector.supports_real_time_status:
                logger.info("Collecting VCA alarm status...")
                alarm_status = connector.get_real_time_status()
                if alarm_status:
                    records = [{
                        'timestamp': datetime.now().isoformat(),
                        'counter_alarm_status': alarm_status.get('counter_alarm_status', 0),
                        'region1_in_alarm': alarm_status.get('region1_in_alarm', 0),
                        'region1_out_alarm': alarm_status.get('region1_out_alarm', 0),
                        'region2_in_alarm': alarm_status.get('region2_in_alarm', 0),
                        'region2_out_alarm': alarm_status.get('region2_out_alarm', 0),
                        'region3_in_alarm': alarm_status.get('region3_in_alarm', 0),
                        'region3_out_alarm': alarm_status.get('region3_out_alarm', 0),
                        'region4_in_alarm': alarm_status.get('region4_in_alarm', 0),
                        'region4_out_alarm': alarm_status.get('region4_out_alarm', 0)
                    }]
                    
                    data_batches.append({
                        'data_type': 'vca_alarm',
                        'records': records
                    })
                    logger.info("Collected VCA alarm status")
            
            # Send all collected data
            if data_batches:
                return self.send_bulk_data(sensor_id, data_batches)
            else:
                logger.warning("No data collected to send")
                return True
                
        except Exception as e:
            logger.error(f"Error collecting and sending data: {str(e)}")
            return False


def load_config(config_file: str) -> Dict[str, Any]:
    """Load configuration from JSON file"""
    with open(config_file, 'r') as f:
        return json.load(f)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Sensor Data Bridge')
    parser.add_argument('--config', required=True, help='Path to sensor configuration file')
    parser.add_argument('--api-url', required=True, help='Next.js API base URL')
    parser.add_argument('--api-token', required=True, help='API authentication token')
    parser.add_argument('--store-id', required=True, help='Store ID for sensor registration')
    parser.add_argument('--interval', type=int, default=300, help='Collection interval in seconds (default: 300)')
    parser.add_argument('--backfill-hours', type=int, default=0, help='Hours to backfill on first run')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    
    args = parser.parse_args()
    
    # Load sensor configuration
    logger.info(f"Loading configuration from {args.config}")
    config_data = load_config(args.config)
    
    # Create connector configuration
    connector_config = ConnectorConfig(
        sensor_id=config_data.get('sensor_id', 'milesight_001'),
        connection=config_data['connection'],
        data_mapping=config_data.get('data_mapping', {}),
        collection_interval=args.interval
    )
    
    # Initialize connector
    logger.info("Initializing Milesight connector...")
    connector = MilesightConnector(connector_config)
    
    if not connector.authenticate():
        logger.error("Failed to authenticate with sensor")
        return 1
    
    # Initialize API bridge
    bridge = SensorDataBridge(args.api_url, args.api_token)
    
    # Register or get sensor
    sensor_name = config_data.get('sensor_name', f"Milesight_{config_data['connection']['host']}")
    sensor_config = {
        'sensor_name': sensor_name,
        'sensor_ip': config_data['connection']['host'],
        'sensor_port': config_data['connection']['port'],
        'sensor_type': 'milesight_people_counter',
        'location': config_data.get('location', 'Main Entrance'),
        'timezone': config_data.get('timezone', 'UTC'),
        'config': {
            'supports_regional_counting': connector.supports_regional_counting,
            'line_count': connector.line_count,
            'region_count': connector.region_count
        },
        'store_id': args.store_id
    }
    
    sensor_id = bridge.register_sensor(sensor_config)
    if not sensor_id:
        logger.error("Failed to register sensor")
        return 1
    
    logger.info(f"Using sensor ID: {sensor_id}")
    
    # Determine initial time range
    if args.backfill_hours > 0:
        start_time = datetime.now() - timedelta(hours=args.backfill_hours)
        logger.info(f"Backfilling data from {start_time}")
    else:
        start_time = datetime.now() - timedelta(seconds=args.interval)
    
    # Main collection loop
    while True:
        try:
            end_time = datetime.now()
            logger.info(f"Collecting data from {start_time} to {end_time}")
            
            success = bridge.collect_and_send_data(connector, sensor_id, start_time, end_time)
            
            if success:
                # Update start time for next iteration
                start_time = end_time
                logger.info("Data collection cycle completed successfully")
            else:
                logger.warning("Data collection cycle failed, will retry")
            
            if args.once:
                logger.info("Single run completed, exiting")
                break
            
            # Wait for next interval
            logger.info(f"Waiting {args.interval} seconds until next collection...")
            time.sleep(args.interval)
            
        except KeyboardInterrupt:
            logger.info("Received interrupt signal, shutting down...")
            break
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            if args.once:
                return 1
            time.sleep(60)  # Wait a minute before retrying
    
    return 0


if __name__ == '__main__':
    sys.exit(main())