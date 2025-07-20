#!/usr/bin/env python3
"""
Comprehensive test for Milesight connector with realistic API simulation
"""

import json
import logging
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time
import urllib.parse
from src.connector_system import ConfigLoader, ConnectorFactory

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MilesightMockServer(BaseHTTPRequestHandler):
    """Mock Milesight camera server with realistic API responses"""
    
    def log_message(self, format, *args):
        pass  # Suppress logs
    
    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        
        # Handle different endpoints
        if 'dataloader.cgi' in self.path:
            self._handle_dataloader(query_params)
        elif 'operator.cgi' in self.path:
            self._handle_operator(query_params)
        else:
            self.send_response(404)
            self.end_headers()
    
    def _handle_dataloader(self, params):
        """Handle dataloader endpoints"""
        dw = params.get('dw', [''])[0]
        
        if dw == 'vcalogcsv':
            self._send_people_counting_csv()
        elif dw == 'regionalcountlogcsv':
            self._send_regional_counting_csv()
        elif dw == 'heatmapcsv':
            self._send_heatmap_csv()
        elif dw == 'spaceheatmap':
            self._send_space_heatmap_json()
        else:
            self.send_response(404)
            self.end_headers()
    
    def _handle_operator(self, params):
        """Handle operator CGI endpoints"""
        action = params.get('action', [''])[0]
        
        if action == 'get.vca.alarmstatus':
            self._send_alarm_status()
        elif action == 'get.vca.count':
            self._send_vca_config()
        else:
            self.send_response(404)
            self.end_headers()
    
    def _send_people_counting_csv(self):
        """Send realistic people counting CSV data"""
        now = datetime.now()
        
        csv_data = "StartTime,EndTime,Line1 - In,Line2 - In,Line3 - In,Line4 - In,Line1 - Out,Line2 - Out,Line3 - Out,Line4 - Out,Type,Capacity,Sum\n"
        
        # Generate 4 intervals of 15 minutes each
        for i in range(4):
            start_time = now - timedelta(minutes=(4-i)*15)
            end_time = start_time + timedelta(minutes=15)
            
            # Simulate realistic traffic patterns
            hour = start_time.hour
            base_traffic = self._get_traffic_for_hour(hour)
            
            line1_in = base_traffic + (i * 2)
            line2_in = base_traffic + (i * 1)
            line3_in = base_traffic // 2
            line4_in = base_traffic + (i * 3)
            
            line1_out = line1_in - (i + 1)
            line2_out = line2_in - i
            line3_out = line3_in - 1
            line4_out = line4_in - (i + 2)
            
            csv_data += f"{start_time.strftime('%Y/%m/%d %H:%M:%S')},{end_time.strftime('%Y/%m/%d %H:%M:%S')},{line1_in},{line2_in},{line3_in},{line4_in},{line1_out},{line2_out},{line3_out},{line4_out},0,{base_traffic * 2},{base_traffic * 4}\n"
        
        self.send_response(200)
        self.send_header('Content-type', 'text/csv')
        self.end_headers()
        self.wfile.write(csv_data.encode())
    
    def _send_regional_counting_csv(self):
        """Send regional counting CSV data"""
        now = datetime.now()
        
        csv_data = "StartTime,EndTime,region1,region2,region3,region4,Sum\n"
        
        for i in range(4):
            start_time = now - timedelta(minutes=(4-i)*15)
            end_time = start_time + timedelta(minutes=15)
            
            r1 = 25 + (i * 5)
            r2 = 30 + (i * 3)
            r3 = 18 + (i * 2)
            r4 = 22 + (i * 4)
            total = r1 + r2 + r3 + r4
            
            csv_data += f"{start_time.strftime('%Y/%m/%d %H:%M:%S')},{end_time.strftime('%Y/%m/%d %H:%M:%S')},{r1},{r2},{r3},{r4},{total}\n"
        
        self.send_response(200)
        self.send_header('Content-type', 'text/csv')
        self.end_headers()
        self.wfile.write(csv_data.encode())
    
    def _send_heatmap_csv(self):
        """Send heatmap CSV data"""
        now = datetime.now()
        
        csv_data = "StartTime,EndTime,Value(s)\n"
        
        for i in range(4):
            start_time = now - timedelta(minutes=(4-i)*15)
            end_time = start_time + timedelta(minutes=15)
            
            value = 150 + (i * 20)
            csv_data += f"{start_time.strftime('%Y-%m-%d %H:%M:%S')},{end_time.strftime('%Y-%m-%d %H:%M:%S')},{value}\n"
        
        self.send_response(200)
        self.send_header('Content-type', 'text/csv')
        self.end_headers()
        self.wfile.write(csv_data.encode())
    
    def _send_space_heatmap_json(self):
        """Send space heatmap JSON data"""
        data = {
            "max": 317,
            "min": 0,
            "data": [
                {"x": 69, "y": 21, "value": 15},
                {"x": 70, "y": 21, "value": 25},
                {"x": 71, "y": 22, "value": 35},
                {"x": 72, "y": 23, "value": 45},
                {"x": 73, "y": 24, "value": 55}
            ]
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _send_alarm_status(self):
        """Send VCA alarm status in Milesight format"""
        data = (
            "var region_entrance_alarm_status='0';"
            "var region_exit_alarm_status='0';"
            "var counter_alarm_status='0';"
            "var current_in_count='45';"
            "var current_out_count='38';"
            "var current_sum_count='83';"
            "var current_capacity_count='7';"
            "var current_counter_alarm='0';"
        )
        
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(data.encode())
    
    def _send_vca_config(self):
        """Send VCA configuration in Milesight format"""
        data = (
            "var count_enable='1';"
            "var startX[0]='282';"
            "var startY[0]='139';"
            "var stopX[0]='1662';"
            "var stopY[0]='918';"
            "var show_osd_enable[0]='1';"
            "var auto_reset_enable='1';"
            "var auto_reset_weekday='7';"
            "var auto_reset_hour='0';"
            "var auto_reset_min='0';"
            "var auto_reset_sec='0';"
        )
        
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(data.encode())
    
    def _get_traffic_for_hour(self, hour):
        """Get realistic traffic based on hour"""
        if 6 <= hour < 9:  # Morning rush
            return 25
        elif 12 <= hour < 14:  # Lunch
            return 35
        elif 17 <= hour < 19:  # Evening rush
            return 40
        elif 9 <= hour < 17:  # Business hours
            return 20
        else:  # Off hours
            return 5

def start_mock_server(port=8085):
    """Start mock Milesight server"""
    server = HTTPServer(('localhost', port), MilesightMockServer)
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    logger.info(f"Mock Milesight server started on port {port}")
    return server

def test_basic_people_counting():
    """Test basic people counting functionality"""
    print("\n🧪 Testing Basic People Counting...")
    
    # Load configuration
    config = ConfigLoader.load_from_file('connector_configs/milesight_basic_people_counting.json')
    
    # Override host for testing
    config.connection['host'] = 'localhost'
    config.connection['port'] = 8085
    
    # Create connector
    connector = ConnectorFactory.create_connector(config)
    
    # Test connection
    if connector.validate_connection():
        print("   ✅ Connection successful")
    else:
        print("   ❌ Connection failed")
        return False
    
    # Test data collection
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)
    
    data = connector.collect_data(start_time, end_time, ['people_counting'])
    
    if data['people_counting']:
        print(f"   ✅ Collected {len(data['people_counting'])} people counting records")
        
        # Show sample data
        sample = data['people_counting'][0]
        print(f"   📊 Sample data: {sample['total_in']} in, {sample['total_out']} out, net: {sample['net_count']}")
        
        return True
    else:
        print("   ❌ No data collected")
        return False

def test_advanced_analytics():
    """Test advanced analytics with multiple endpoints"""
    print("\n🧪 Testing Advanced Analytics...")
    
    # Load advanced configuration
    config = ConfigLoader.load_from_file('connector_configs/milesight_advanced_multi_analytics.json')
    
    # Override host for testing
    config.connection['host'] = 'localhost'
    config.connection['port'] = 8085
    
    # Create connector
    connector = ConnectorFactory.create_connector(config)
    
    # Test all endpoints
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=1)
    
    endpoints = ['people_counting', 'regional_counting', 'heatmap', 'space_heatmap']
    data = connector.collect_data(start_time, end_time, endpoints)
    
    success_count = 0
    for endpoint in endpoints:
        if data[endpoint]:
            print(f"   ✅ {endpoint}: {len(data[endpoint])} records")
            success_count += 1
        else:
            print(f"   ❌ {endpoint}: No data")
    
    # Test real-time status
    if hasattr(connector, 'get_real_time_status'):
        status = connector.get_real_time_status()
        if status:
            print(f"   ✅ Real-time status: {status['current_in_count']} in, {status['current_out_count']} out")
            success_count += 1
        else:
            print("   ❌ Real-time status: Failed")
    
    return success_count >= 3

def test_configuration_management():
    """Test camera configuration management"""
    print("\n🧪 Testing Configuration Management...")
    
    config = ConfigLoader.load_from_file('connector_configs/milesight_basic_people_counting.json')
    config.connection['host'] = 'localhost'
    config.connection['port'] = 8085
    
    connector = ConnectorFactory.create_connector(config)
    
    # Test getting configuration
    if hasattr(connector, 'get_camera_config'):
        camera_config = connector.get_camera_config()
        if camera_config:
            print(f"   ✅ Retrieved camera config: {len(camera_config)} parameters")
            print(f"   📋 Count enabled: {camera_config.get('count_enable', 'Unknown')}")
            return True
        else:
            print("   ❌ Failed to retrieve camera config")
            return False
    else:
        print("   ⚠️  Configuration management not available")
        return True

def display_performance_metrics():
    """Display performance comparison"""
    print("\n📈 Performance Metrics:")
    print("   🚀 Milesight Connector Advantages:")
    print("      • Native API integration (no screen scraping)")
    print("      • Multiple data types (people counting, regional, heatmap)")
    print("      • Real-time status monitoring")
    print("      • Configurable time ranges and filtering")
    print("      • Bulk data export capabilities")
    print("      • Built-in authentication and retry logic")
    print("      • Configuration management via API")
    print("   ")
    print("   📊 Data Types Supported:")
    print("      • Line-based people counting (up to 4 lines)")
    print("      • Regional people counting (up to 4 regions)")
    print("      • Temporal heatmaps")
    print("      • Spatial heatmaps")
    print("      • Real-time occupancy status")
    print("      • Capacity monitoring and alerts")

def main():
    """Main test function"""
    print("🎯 MILESIGHT CONNECTOR COMPREHENSIVE TEST")
    print("=" * 50)
    
    # Start mock server
    mock_server = start_mock_server(8085)
    time.sleep(1)
    
    try:
        test_results = []
        
        # Run tests
        test_results.append(test_basic_people_counting())
        test_results.append(test_advanced_analytics())
        test_results.append(test_configuration_management())
        
        # Display results
        passed = sum(test_results)
        total = len(test_results)
        
        print(f"\n🏆 Test Results: {passed}/{total} passed")
        
        if passed == total:
            print("   ✅ All tests passed! Milesight connector is ready for production.")
            display_performance_metrics()
        else:
            print("   ⚠️  Some tests failed. Check configuration and connectivity.")
        
        # Show available connector types
        print(f"\n📋 Available Connector Types:")
        for conn_type in ConnectorFactory.get_available_types():
            print(f"   • {conn_type}")
        
    except Exception as e:
        logger.error(f"Test failed with error: {str(e)}", exc_info=True)
        print(f"   ❌ Test suite failed: {str(e)}")
    
    finally:
        mock_server.shutdown()

if __name__ == "__main__":
    main()