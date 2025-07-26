#!/usr/bin/env python3
"""
Data Collection Bridge for Retail Platform
Continuously collects data from all configured sensors and sends to the API
"""

import os
import sys
import json
import time
import requests
import logging
import threading
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

class DataCollectionBridge:
    """Bridge between sensor connectors and the retail platform API"""
    
    def __init__(self, api_base_url: str = "http://localhost:3000"):
        self.api_base_url = api_base_url
        self.sensors = []
        self.connectors = {}
        self.running = False
        self.threads = []
        
    def load_sensor_configs(self):
        """Load all sensor configurations"""
        sensor_configs = [
            {
                "id": "188.82.28.148:2102",
                "name": "J&J - 01 - ArrábidaShopping",
                "organization": "jack-jones",
                "store": "J&J - 01 - ArrábidaShopping",
                "host": "188.82.28.148",
                "port": 2102
            },
            {
                "id": "93.108.96.96:21001",
                "name": "OML01 - Omnia Guimarães Shopping",
                "organization": "omnia",
                "store": "OML01 - Omnia Guimarães Shopping",
                "host": "93.108.96.96",
                "port": 21001
            },
            {
                "id": "188.37.175.41:2201",
                "name": "OML02 - Omnia Fórum Almada",
                "organization": "omnia",
                "store": "OML02 - Omnia Fórum Almada",
                "host": "188.37.175.41",
                "port": 2201
            },
            {
                "id": "188.37.124.33:21002",
                "name": "OML03 - Omnia NorteShopping",
                "organization": "omnia",
                "store": "OML03 - Omnia NorteShopping",
                "host": "188.37.124.33",
                "port": 21002
            }
        ]
        
        for sensor_config in sensor_configs:
            # Create connector configuration
            config_data = {
                "sensor_name": sensor_config["name"],
                "location": sensor_config["store"],
                "type": "milesight_people_counter",
                "connection": {
                    "host": sensor_config["host"],
                    "port": sensor_config["port"],
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
            self.sensors.append(sensor_config)
            self.connectors[sensor_config["id"]] = connector
            
        logger.info(f"Loaded {len(self.sensors)} sensor configurations")
        
    def collect_sensor_data(self, sensor_config: Dict[str, Any]):
        """Collect data from a single sensor"""
        sensor_id = sensor_config["id"]
        connector = self.connectors[sensor_id]
        
        try:
            # Get data from last collection interval (5 minutes)
            end_time = datetime.now()
            start_time = end_time - timedelta(minutes=5)
            
            # Collect people counting data
            raw_data = connector.fetch_data(start_time, end_time, 'people_counting')
            if raw_data:
                parsed_data = connector.parse_data(raw_data, 'people_counting')
                
                if parsed_data:
                    logger.info(f"[{sensor_config['name']}] Collected {len(parsed_data)} people counting records")
                    
                    # Send each record to the API
                    for record in parsed_data:
                        self.send_to_api(sensor_config, record, 'people_counting')
                        
            # Collect regional counting data if supported
            if connector.supports_regional_counting:
                raw_regional = connector.fetch_data(start_time, end_time, 'regional_counting')
                if raw_regional:
                    parsed_regional = connector.parse_data(raw_regional, 'regional_counting')
                    
                    if parsed_regional:
                        logger.info(f"[{sensor_config['name']}] Collected {len(parsed_regional)} regional records")
                        
                        # Send each record to the API
                        for record in parsed_regional:
                            self.send_to_api(sensor_config, record, 'regional_counting')
                            
        except Exception as e:
            logger.error(f"[{sensor_config['name']}] Error collecting data: {str(e)}")
            
    def send_to_api(self, sensor_config: Dict[str, Any], data: Dict[str, Any], data_type: str):
        """Send data to the retail platform API"""
        try:
            # Prepare payload based on data type
            if data_type == 'people_counting':
                payload = {
                    "sensor_id": sensor_config["id"],
                    "organization": sensor_config["organization"],
                    "store": sensor_config["store"],
                    "timestamp": data.get('timestamp').isoformat() if isinstance(data.get('timestamp'), datetime) else data.get('timestamp'),
                    "data": {
                        "line1_in": data.get('line1_in', 0),
                        "line1_out": data.get('line1_out', 0),
                        "line2_in": data.get('line2_in', 0),
                        "line2_out": data.get('line2_out', 0),
                        "line3_in": data.get('line3_in', 0),
                        "line3_out": data.get('line3_out', 0),
                        "line4_in": data.get('line4_in', 0),
                        "line4_out": data.get('line4_out', 0),
                        "total_in": data.get('total_in', 0),
                        "total_out": data.get('total_out', 0),
                        "passing_traffic": data.get('passing_traffic', 0),
                        "capture_rate": data.get('capture_rate', 0)
                    }
                }
                endpoint = "/api/analytics/ingestion/bulk"
                
            elif data_type == 'regional_counting':
                payload = {
                    "sensor_id": sensor_config["id"],
                    "organization": sensor_config["organization"],
                    "store": sensor_config["store"],
                    "timestamp": data.get('timestamp').isoformat() if isinstance(data.get('timestamp'), datetime) else data.get('timestamp'),
                    "data": {
                        "region1_count": data.get('region1_count', 0),
                        "region2_count": data.get('region2_count', 0),
                        "region3_count": data.get('region3_count', 0),
                        "region4_count": data.get('region4_count', 0),
                        "total_regional_count": data.get('total_regional_count', 0)
                    }
                }
                endpoint = "/api/analytics/regions"
                
            # Send to API
            response = requests.post(
                f"{self.api_base_url}{endpoint}",
                json={"data": [payload]},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                logger.debug(f"[{sensor_config['name']}] Successfully sent {data_type} data")
            else:
                logger.error(f"[{sensor_config['name']}] Failed to send {data_type} data: {response.status_code}")
                
        except Exception as e:
            logger.error(f"[{sensor_config['name']}] Error sending to API: {str(e)}")
            
    def collect_all_sensors(self):
        """Collect data from all sensors"""
        logger.info("Starting data collection cycle...")
        
        threads = []
        for sensor_config in self.sensors:
            # Create a thread for each sensor to collect in parallel
            thread = threading.Thread(
                target=self.collect_sensor_data,
                args=(sensor_config,),
                name=f"Collector-{sensor_config['name']}"
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
        """Start the data collection bridge"""
        logger.info("Starting Data Collection Bridge...")
        
        # Load sensor configurations
        self.load_sensor_configs()
        
        # Validate all sensors
        logger.info("Validating sensor connections...")
        for sensor_id, connector in self.connectors.items():
            if connector.authenticate():
                logger.info(f"✅ {connector.config.name} - Connection validated")
            else:
                logger.error(f"❌ {connector.config.name} - Connection failed")
                
        # Schedule data collection every 5 minutes
        schedule.every(5).minutes.do(self.collect_all_sensors)
        
        # Run initial collection
        self.collect_all_sensors()
        
        # Start scheduler thread
        self.running = True
        scheduler_thread = threading.Thread(target=self.run_scheduler, name="Scheduler")
        scheduler_thread.start()
        
        logger.info("Data Collection Bridge is running. Press Ctrl+C to stop.")
        
        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logger.info("Shutting down...")
            self.running = False
            scheduler_thread.join()
            logger.info("Data Collection Bridge stopped")
            

def main():
    """Main entry point"""
    # Get API URL from environment or use default
    api_url = os.environ.get('API_BASE_URL', 'http://localhost:3000')
    
    # Create and start the bridge
    bridge = DataCollectionBridge(api_url)
    bridge.start()
    

if __name__ == "__main__":
    main()