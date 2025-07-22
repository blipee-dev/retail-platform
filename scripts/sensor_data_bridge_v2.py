#!/usr/bin/env python3
"""
Sensor Data Bridge - Collects data from sensors and stores in Supabase
Works with the proper UUID-based database schema
"""

import os
import sys
import json
import time
import logging
import threading
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any
import schedule

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
    """Bridge between physical sensors and Supabase database"""
    
    def __init__(self, api_base_url: str = "http://localhost:3000"):
        self.api_base_url = api_base_url
        self.api_key = os.environ.get('INTERNAL_API_KEY', 'development-key')
        self.sensors = {}  # sensor_id -> sensor_info
        self.connectors = {}  # sensor_id -> connector
        self.running = False
        
    def load_sensors_from_db(self):
        """Load sensor configurations from database"""
        try:
            # Get sensors from internal API
            response = requests.get(
                f"{self.api_base_url}/api/internal/sensors",
                headers={'x-api-key': self.api_key}
            )
            if response.status_code != 200:
                logger.error(f"Failed to get sensors: {response.status_code}")
                return False
                
            sensors_data = response.json()
            
            for sensor in sensors_data.get('sensors', []):
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
                
                # Store sensor info and connector
                self.sensors[sensor['id']] = sensor
                self.connectors[sensor['id']] = connector
                
            logger.info(f"Loaded {len(self.sensors)} sensors from database")
            return True
            
        except Exception as e:
            logger.error(f"Error loading sensors: {str(e)}")
            return False
        
    def collect_sensor_data(self, sensor_id: str):
        """Collect data from a single sensor"""
        sensor = self.sensors.get(sensor_id)
        connector = self.connectors.get(sensor_id)
        
        if not sensor or not connector:
            logger.error(f"Sensor {sensor_id} not found")
            return
            
        try:
            # Request last 2 hours of data (sensors return hourly aggregated data)
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=2)
            
            # Collect people counting data
            raw_data = connector.fetch_data(start_time, end_time, 'people_counting')
            if raw_data:
                parsed_data = connector.parse_data(raw_data, 'people_counting')
                
                if parsed_data:
                    # Filter out future timestamps
                    current_time = datetime.now()
                    valid_data = [r for r in parsed_data if r.get('timestamp') <= current_time]
                    
                    logger.info(f"[{sensor['sensor_name']}] Collected {len(valid_data)} valid records (filtered {len(parsed_data) - len(valid_data)} future records)")
                    
                    # Send to database via API
                    for record in valid_data:
                        self.send_to_db(sensor, record, 'people_counting')
                        
            # Collect regional counting data if supported
            if connector.supports_regional_counting:
                raw_regional = connector.fetch_data(start_time, end_time, 'regional_counting')
                if raw_regional:
                    parsed_regional = connector.parse_data(raw_regional, 'regional_counting')
                    
                    if parsed_regional:
                        # Filter out future timestamps
                        current_time = datetime.now()
                        valid_regional = [r for r in parsed_regional if r.get('timestamp') <= current_time]
                        
                        logger.info(f"[{sensor['sensor_name']}] Collected {len(valid_regional)} valid regional records (filtered {len(parsed_regional) - len(valid_regional)} future records)")
                        
                        # Send to database via API
                        for record in valid_regional:
                            self.send_to_db(sensor, record, 'regional_counting')
                            
        except Exception as e:
            logger.error(f"[{sensor['sensor_name']}] Error collecting data: {str(e)}")
            
    def send_to_db(self, sensor: Dict[str, Any], data: Dict[str, Any], data_type: str):
        """Send data to the database via API"""
        try:
            timestamp = data.get('timestamp')
            if isinstance(timestamp, datetime):
                timestamp = timestamp.isoformat()
                
            # Skip if this is old data (more than 2 hours old)
            data_time = data.get('timestamp')
            if isinstance(data_time, datetime):
                age = datetime.now() - data_time
                if age.total_seconds() > 7200:  # 2 hours
                    logger.debug(f"[{sensor['sensor_name']}] Skipping old data from {timestamp}")
                    return
                
            # Prepare base payload
            payload_data = {
                "sensor_id": sensor['id'],  # UUID
                "organization_id": sensor['organization_id'],
                "store_id": sensor['store_id'],
                "timestamp": timestamp,
                "end_time": (datetime.fromisoformat(timestamp.replace('Z', '+00:00')) + timedelta(hours=1)).isoformat()
            }
            
            if data_type == 'people_counting':
                # Add line data
                payload_data.update({
                    "line1_in": data.get('line1_in', 0),
                    "line1_out": data.get('line1_out', 0),
                    "line2_in": data.get('line2_in', 0),
                    "line2_out": data.get('line2_out', 0),
                    "line3_in": data.get('line3_in', 0),
                    "line3_out": data.get('line3_out', 0),
                    "line4_in": data.get('line4_in', 0),
                    "line4_out": data.get('line4_out', 0)
                })
                
            elif data_type == 'regional_counting':
                # Add regional data
                payload_data.update({
                    "region1_count": data.get('region1_count', 0),
                    "region2_count": data.get('region2_count', 0),
                    "region3_count": data.get('region3_count', 0),
                    "region4_count": data.get('region4_count', 0)
                })
                
            # Send to internal API
            response = requests.post(
                f"{self.api_base_url}/api/internal/ingest",
                json={
                    "type": data_type,
                    "data": payload_data
                },
                headers={
                    "Content-Type": "application/json",
                    "x-api-key": self.api_key
                }
            )
            
            if response.status_code == 200:
                logger.debug(f"[{sensor['sensor_name']}] Successfully sent {data_type} data")
            else:
                logger.error(f"[{sensor['sensor_name']}] Failed to send {data_type} data: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"[{sensor['sensor_name']}] Error sending to database: {str(e)}")
            
    def collect_all_sensors(self):
        """Collect data from all sensors"""
        logger.info("Starting data collection cycle...")
        
        threads = []
        for sensor_id in self.sensors:
            # Create a thread for each sensor to collect in parallel
            thread = threading.Thread(
                target=self.collect_sensor_data,
                args=(sensor_id,),
                name=f"Collector-{self.sensors[sensor_id]['sensor_name']}"
            )
            thread.start()
            threads.append(thread)
            
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
            
        logger.info("Data collection cycle completed")
        
    def run_scheduler(self):
        """Run the scheduler in a separate thread"""
        while self.running:
            schedule.run_pending()
            time.sleep(1)
            
    def start(self):
        """Start the sensor data bridge"""
        logger.info("Starting Sensor Data Bridge...")
        
        # Load sensor configurations from database
        if not self.load_sensors_from_db():
            logger.error("Failed to load sensor configurations")
            return
            
        # Validate all sensors
        logger.info("Validating sensor connections...")
        for sensor_id, connector in self.connectors.items():
            sensor = self.sensors[sensor_id]
            if connector.authenticate():
                logger.info(f"✅ {sensor['sensor_name']} - Connection validated")
            else:
                logger.error(f"❌ {sensor['sensor_name']} - Connection failed")
                
        # Schedule data collection every 30 minutes (sensors provide hourly aggregated data)
        schedule.every(30).minutes.do(self.collect_all_sensors)
        
        # Run initial collection
        self.collect_all_sensors()
        
        # Start scheduler thread
        self.running = True
        scheduler_thread = threading.Thread(target=self.run_scheduler, name="Scheduler")
        scheduler_thread.start()
        
        logger.info("Sensor Data Bridge is running. Press Ctrl+C to stop.")
        logger.info("Data collection scheduled every 30 minutes.")
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            self.running = False
            scheduler_thread.join()
            logger.info("Sensor Data Bridge stopped")
            

def main():
    """Main entry point"""
    # Get API URL from environment or use default
    api_url = os.environ.get('API_BASE_URL', 'http://localhost:3000')
    
    # Create and start the bridge
    bridge = SensorDataBridge(api_url)
    bridge.start()
    

if __name__ == "__main__":
    main()