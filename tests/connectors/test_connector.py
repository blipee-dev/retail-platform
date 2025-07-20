#!/usr/bin/env python3
"""
Test script for the connector system with mock data
"""

import json
import logging
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time
from src.connector_system import ConfigLoader, ConnectorFactory

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Mock CSV data for testing
MOCK_PEOPLE_COUNTING_DATA = """StartTime,EndTime,Line1 - In,Line2 - In,Line3 - In,Line4 - In,Line4 - Out
2025/01/18 10:00:00,2025/01/18 10:15:00,15,23,8,45,42
2025/01/18 10:15:00,2025/01/18 10:30:00,18,25,10,52,48
2025/01/18 10:30:00,2025/01/18 10:45:00,22,30,12,61,58
2025/01/18 10:45:00,2025/01/18 11:00:00,25,28,15,68,65
"""

MOCK_HEATMAP_DATA = """StartTime,EndTime,Value(s)
2025-01-18 10:00:00,2025-01-18 10:15:00,125
2025-01-18 10:15:00,2025-01-18 10:30:00,142
2025-01-18 10:30:00,2025-01-18 10:45:00,158
2025-01-18 10:45:00,2025-01-18 11:00:00,163
"""

MOCK_REGIONAL_DATA = """StartTime,EndTime,region1,region2,region3,region4,Sum
2025/01/18 10:00:00,2025/01/18 10:15:00,25,30,18,22,95
2025/01/18 10:15:00,2025/01/18 10:30:00,28,35,20,25,108
2025/01/18 10:30:00,2025/01/18 10:45:00,32,38,22,28,120
2025/01/18 10:45:00,2025/01/18 11:00:00,35,40,25,30,130
"""

class MockSensorHandler(BaseHTTPRequestHandler):
    """Mock HTTP server to simulate sensor responses"""
    
    def log_message(self, format, *args):
        # Suppress default HTTP server logs
        pass
    
    def do_GET(self):
        # Parse the path
        if 'vcalogcsv' in self.path:
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.end_headers()
            self.wfile.write(MOCK_PEOPLE_COUNTING_DATA.encode())
        elif 'heatmapcsv' in self.path:
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.end_headers()
            self.wfile.write(MOCK_HEATMAP_DATA.encode())
        elif 'regionalcountlogcsv' in self.path:
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.end_headers()
            self.wfile.write(MOCK_REGIONAL_DATA.encode())
        else:
            self.send_response(404)
            self.end_headers()

def start_mock_server(port=8082):
    """Start mock HTTP server in background thread"""
    server = HTTPServer(('localhost', port), MockSensorHandler)
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    logger.info(f"Mock sensor server started on port {port}")
    return server

def create_test_config():
    """Create a test configuration"""
    return {
        "connector": {
            "name": "Test Store Camera",
            "type": "people_counting_camera",
            "store": "Test Store",
            "connection": {
                "host": "localhost",
                "port": 8082,
                "auth": {
                    "type": "basic",
                    "username": "admin",
                    "password": "test123"
                }
            },
            "endpoints": {
                "people_counting": "/dataloader.cgi?dw=vcalogcsv&report_type=0",
                "heatmap": "/dataloader.cgi?dw=heatmapcsv&sub_type=0",
                "regional": "/dataloader.cgi?dw=regionalcountlogcsv&report_type=0"
            },
            "data_mapping": {
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "fields": [
                    {"source": "StartTime", "target": "start_time", "type": "timestamp"},
                    {"source": "EndTime", "target": "end_time", "type": "timestamp"},
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line2 - In", "target": "line2_in", "type": "integer"},
                    {"source": "Line3 - In", "target": "line3_in", "type": "integer"},
                    {"source": "Line4 - In", "target": "line4_in", "type": "integer"},
                    {"source": "Line4 - Out", "target": "line4_out", "type": "integer"}
                ]
            }
        }
    }

def main():
    """Main test function"""
    print("\n=== Sensor Connector System Test ===\n")
    
    # Start mock server
    mock_server = start_mock_server()
    time.sleep(1)  # Give server time to start
    
    try:
        # Create configuration
        print("1. Creating test configuration...")
        config_dict = create_test_config()
        config = ConfigLoader.create_from_dict(config_dict)
        print(f"   ✓ Configuration created for: {config.name}")
        
        # Create connector using factory
        print("\n2. Creating connector instance...")
        connector = ConnectorFactory.create_connector(config)
        print(f"   ✓ Connector created: {connector.__class__.__name__}")
        
        # Test connection
        print("\n3. Testing connection...")
        connection_valid = connector.validate_connection()
        print(f"   {'✓' if connection_valid else '✗'} Connection {'valid' if connection_valid else 'invalid'}")
        
        # Get connector status
        print("\n4. Connector status:")
        status = connector.get_status()
        for key, value in status.items():
            print(f"   - {key}: {value}")
        
        # Collect data
        print("\n5. Collecting data...")
        start_time = datetime.now() - timedelta(hours=2)
        end_time = datetime.now()
        
        data = connector.collect_data(start_time, end_time)
        
        for endpoint_type, records in data.items():
            print(f"\n   {endpoint_type.upper()} Data ({len(records)} records):")
            if records:
                # Show first record as example
                print(f"   Sample record:")
                for key, value in records[0].items():
                    print(f"     - {key}: {value}")
        
        # Test configuration save/load
        print("\n6. Testing configuration persistence...")
        config_file = "test_config.json"
        with open(config_file, 'w') as f:
            json.dump(config_dict, f, indent=2)
        print(f"   ✓ Configuration saved to {config_file}")
        
        # Load configuration from file
        loaded_config = ConfigLoader.load_from_file(config_file)
        print(f"   ✓ Configuration loaded from file")
        
        # Create connector from loaded config
        loaded_connector = ConnectorFactory.create_connector(loaded_config)
        print(f"   ✓ Connector created from loaded configuration")
        
        print("\n=== Test completed successfully! ===\n")
        
    except Exception as e:
        logger.error(f"Test failed: {str(e)}", exc_info=True)
        print(f"\n✗ Test failed: {str(e)}")
    
    finally:
        # Cleanup
        import os
        if os.path.exists("test_config.json"):
            os.remove("test_config.json")

if __name__ == "__main__":
    main()