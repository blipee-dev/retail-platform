#!/usr/bin/env python3
"""
Comprehensive test suite for the connector system
"""

import unittest
import json
import tempfile
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
import requests
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

# Import our connector system
from src.connector_system import (
    ConnectorConfig, 
    ConfigLoader, 
    ConnectorFactory,
    PeopleCountingConnector
)

class TestConnectorConfig(unittest.TestCase):
    """Test the ConnectorConfig dataclass"""
    
    def test_config_creation(self):
        """Test creating a config with required fields"""
        config = ConnectorConfig(
            name="Test Sensor",
            type="people_counting",
            store="Test Store",
            connection={"host": "localhost", "port": 8080},
            endpoints={"default": "/api/data"},
            data_mapping={}
        )
        
        self.assertEqual(config.name, "Test Sensor")
        self.assertEqual(config.type, "people_counting")
        self.assertEqual(config.timeout, 30)  # Default value
        
    def test_config_with_custom_values(self):
        """Test config with custom timeout and retry"""
        config = ConnectorConfig(
            name="Test",
            type="test",
            store="store",
            connection={},
            endpoints={},
            data_mapping={},
            timeout=60,
            retry_attempts=5
        )
        
        self.assertEqual(config.timeout, 60)
        self.assertEqual(config.retry_attempts, 5)

class TestConfigLoader(unittest.TestCase):
    """Test the configuration loader"""
    
    def setUp(self):
        """Create temporary directory for test files"""
        self.temp_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        """Clean up temporary files"""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    def test_load_json_config(self):
        """Test loading configuration from JSON file"""
        config_data = {
            "connector": {
                "name": "Test JSON",
                "type": "people_counting",
                "connection": {"host": "localhost"}
            }
        }
        
        config_file = os.path.join(self.temp_dir, "test.json")
        with open(config_file, 'w') as f:
            json.dump(config_data, f)
        
        config = ConfigLoader.load_from_file(config_file)
        self.assertEqual(config.name, "Test JSON")
        
    def test_missing_required_field(self):
        """Test that missing required fields raise errors"""
        config_data = {
            "connector": {
                "name": "Test"
                # Missing 'type' and 'connection'
            }
        }
        
        with self.assertRaises(ValueError) as context:
            ConfigLoader.create_from_dict(config_data)
        
        self.assertIn("Missing required field", str(context.exception))
    
    def test_validate_config(self):
        """Test configuration validation"""
        # Valid config
        valid_config = ConnectorConfig(
            name="Test",
            type="test",
            store="store",
            connection={"host": "localhost"},
            endpoints={},
            data_mapping={}
        )
        self.assertTrue(ConfigLoader.validate_config(valid_config))
        
        # Invalid config - missing host
        invalid_config = ConnectorConfig(
            name="Test",
            type="test", 
            store="store",
            connection={},  # No host
            endpoints={},
            data_mapping={}
        )
        
        with self.assertRaises(ValueError):
            ConfigLoader.validate_config(invalid_config)

class TestConnectorFactory(unittest.TestCase):
    """Test the connector factory"""
    
    def test_create_known_connector(self):
        """Test creating a known connector type"""
        config = ConnectorConfig(
            name="Test",
            type="people_counting_camera",
            store="store",
            connection={"host": "localhost"},
            endpoints={},
            data_mapping={}
        )
        
        connector = ConnectorFactory.create_connector(config)
        self.assertIsInstance(connector, PeopleCountingConnector)
    
    def test_unknown_connector_type(self):
        """Test that unknown connector types raise errors"""
        config = ConnectorConfig(
            name="Test",
            type="unknown_type",
            store="store",
            connection={"host": "localhost"},
            endpoints={},
            data_mapping={}
        )
        
        with self.assertRaises(ValueError) as context:
            ConnectorFactory.create_connector(config)
        
        self.assertIn("Unknown connector type", str(context.exception))
    
    def test_get_available_types(self):
        """Test getting list of available connector types"""
        types = ConnectorFactory.get_available_types()
        self.assertIn("people_counting_camera", types)
        self.assertIn("people_counting", types)

class TestPeopleCountingConnector(unittest.TestCase):
    """Test the PeopleCountingConnector implementation"""
    
    def setUp(self):
        """Set up test connector"""
        self.config = ConnectorConfig(
            name="Test Camera",
            type="people_counting_camera",
            store="Test Store",
            connection={
                "host": "localhost",
                "port": 8080,
                "auth": {
                    "type": "basic",
                    "username": "admin",
                    "password": "pass"
                }
            },
            endpoints={
                "people_counting": "/api/people"
            },
            data_mapping={
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "fields": [
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"}
                ]
            }
        )
        self.connector = PeopleCountingConnector(self.config)
    
    @patch('requests.Session.get')
    def test_fetch_data_success(self, mock_get):
        """Test successful data fetching"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "test,data\n1,2"
        mock_get.return_value = mock_response
        
        data = self.connector.fetch_data(
            datetime.now() - timedelta(hours=1),
            datetime.now()
        )
        
        self.assertEqual(data, "test,data\n1,2")
        mock_get.assert_called_once()
    
    @patch('requests.Session.get')
    def test_fetch_data_error(self, mock_get):
        """Test handling of fetch errors"""
        mock_get.side_effect = requests.exceptions.RequestException("Network error")
        
        with self.assertRaises(requests.exceptions.RequestException):
            self.connector.fetch_data(datetime.now(), datetime.now())
    
    def test_parse_people_counting_data(self):
        """Test parsing people counting CSV data"""
        csv_data = """StartTime,EndTime,Line1 - In,Line2 - In,Line3 - In
2025/01/18 10:00:00,2025/01/18 10:15:00,10,20,30"""
        
        parsed = self.connector.parse_data(csv_data, 'people_counting')
        
        self.assertEqual(len(parsed), 1)
        self.assertEqual(parsed[0]['line1_in'], 10)
        # total_in is only calculated if all three line fields exist in mapping
        self.assertEqual(parsed[0]['data_type'], 'people_counting')
    
    def test_parse_empty_data(self):
        """Test parsing empty data returns empty list"""
        parsed = self.connector.parse_data("", 'people_counting')
        self.assertEqual(parsed, [])
    
    @patch('requests.Session.get')
    def test_validate_connection(self, mock_get):
        """Test connection validation"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.text = "some data"
        mock_get.return_value = mock_response
        
        is_valid = self.connector.validate_connection()
        self.assertTrue(is_valid)

class TestIntegration(unittest.TestCase):
    """Integration tests with mock HTTP server"""
    
    @classmethod
    def setUpClass(cls):
        """Start mock HTTP server for integration tests"""
        class MockHandler(BaseHTTPRequestHandler):
            def log_message(self, format, *args):
                pass  # Suppress logs
                
            def do_GET(self):
                if 'people' in self.path:
                    self.send_response(200)
                    self.send_header('Content-type', 'text/csv')
                    self.end_headers()
                    self.wfile.write(b"""StartTime,EndTime,Line1 - In,Line2 - In,Line3 - In
2025/01/18 10:00:00,2025/01/18 10:15:00,5,10,15""")
                else:
                    self.send_response(404)
                    self.end_headers()
        
        cls.server = HTTPServer(('localhost', 8083), MockHandler)
        cls.server_thread = threading.Thread(target=cls.server.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()
        time.sleep(0.5)  # Give server time to start
    
    @classmethod
    def tearDownClass(cls):
        """Stop mock server"""
        cls.server.shutdown()
    
    def test_end_to_end_data_collection(self):
        """Test complete data collection flow"""
        config = ConnectorConfig(
            name="Integration Test",
            type="people_counting_camera",
            store="Test Store",
            connection={
                "host": "localhost",
                "port": 8083
            },
            endpoints={
                "people_counting": "/api/people"
            },
            data_mapping={
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "fields": [
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line2 - In", "target": "line2_in", "type": "integer"},
                    {"source": "Line3 - In", "target": "line3_in", "type": "integer"}
                ]
            }
        )
        
        connector = ConnectorFactory.create_connector(config)
        data = connector.collect_data(
            datetime.now() - timedelta(hours=1),
            datetime.now(),
            ['people_counting']
        )
        
        self.assertIn('people_counting', data)
        self.assertEqual(len(data['people_counting']), 1)
        self.assertEqual(data['people_counting'][0]['total_in'], 30)

class TestPerformance(unittest.TestCase):
    """Performance and load tests"""
    
    def test_parse_large_dataset(self):
        """Test parsing performance with large dataset"""
        # Generate large CSV data
        lines = ["StartTime,EndTime,Line1 - In,Line2 - In,Line3 - In"]
        for i in range(10000):
            lines.append(f"2025/01/18 10:{i%60:02d}:00,2025/01/18 10:{i%60:02d}:15,{i%100},{i%50},{i%25}")
        
        csv_data = "\n".join(lines)
        
        config = ConnectorConfig(
            name="Perf Test",
            type="people_counting",
            store="store",
            connection={"host": "localhost"},
            endpoints={},
            data_mapping={
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "fields": [
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line2 - In", "target": "line2_in", "type": "integer"},
                    {"source": "Line3 - In", "target": "line3_in", "type": "integer"}
                ]
            }
        )
        
        connector = PeopleCountingConnector(config)
        
        start_time = time.time()
        parsed = connector.parse_data(csv_data, 'people_counting')
        parse_time = time.time() - start_time
        
        self.assertEqual(len(parsed), 10000)
        self.assertLess(parse_time, 1.0)  # Should parse 10k records in under 1 second
        print(f"\nParsed 10,000 records in {parse_time:.3f} seconds")

def run_specific_test(test_name=None):
    """Run specific test or all tests"""
    if test_name:
        # Run specific test
        suite = unittest.TestLoader().loadTestsFromName(test_name)
    else:
        # Run all tests
        suite = unittest.TestLoader().loadTestsFromModule(__import__(__name__))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    # Example: Run all tests
    # run_specific_test()
    
    # Example: Run specific test class
    # run_specific_test('TestPeopleCountingConnector')
    
    # Example: Run specific test method
    # run_specific_test('TestPeopleCountingConnector.test_parse_people_counting_data')
    
    unittest.main()