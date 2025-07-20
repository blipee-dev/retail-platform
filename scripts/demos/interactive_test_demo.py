#!/usr/bin/env python3
"""
Interactive demonstration of the connector system with real-time data simulation
"""

import time
import random
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import json
from src.connector_system import ConfigLoader, ConnectorFactory

class RealTimeDataSimulator(BaseHTTPRequestHandler):
    """Simulate a real sensor with dynamic data"""
    
    def log_message(self, format, *args):
        pass  # Suppress logs
    
    def generate_people_count(self):
        """Generate realistic people counting data based on time of day"""
        hour = datetime.now().hour
        
        # Simulate traffic patterns
        if 6 <= hour < 9:  # Morning rush
            base_traffic = random.randint(40, 60)
        elif 12 <= hour < 14:  # Lunch time
            base_traffic = random.randint(60, 80)
        elif 17 <= hour < 19:  # Evening rush
            base_traffic = random.randint(70, 90)
        elif 9 <= hour < 17:  # Regular hours
            base_traffic = random.randint(30, 50)
        else:  # Off hours
            base_traffic = random.randint(5, 20)
        
        # Add some randomness
        line1 = int(base_traffic * random.uniform(0.3, 0.4))
        line2 = int(base_traffic * random.uniform(0.3, 0.4))
        line3 = int(base_traffic * random.uniform(0.2, 0.3))
        line4_in = base_traffic + random.randint(-5, 5)
        line4_out = line4_in - random.randint(0, 5)
        
        return line1, line2, line3, line4_in, line4_out
    
    def do_GET(self):
        now = datetime.now()
        
        if 'vcalogcsv' in self.path:
            # Generate people counting data for the last hour
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.end_headers()
            
            csv_lines = ["StartTime,EndTime,Line1 - In,Line2 - In,Line3 - In,Line4 - In,Line4 - Out"]
            
            # Generate 4 x 15-minute intervals
            for i in range(4):
                start = now - timedelta(minutes=(4-i)*15)
                end = start + timedelta(minutes=15)
                l1, l2, l3, l4i, l4o = self.generate_people_count()
                
                csv_lines.append(
                    f"{start.strftime('%Y/%m/%d %H:%M:%S')},"
                    f"{end.strftime('%Y/%m/%d %H:%M:%S')},"
                    f"{l1},{l2},{l3},{l4i},{l4o}"
                )
            
            self.wfile.write('\n'.join(csv_lines).encode())
            
        elif 'heatmapcsv' in self.path:
            # Generate heatmap data
            self.send_response(200)
            self.send_header('Content-type', 'text/csv')
            self.end_headers()
            
            csv_lines = ["StartTime,EndTime,Value(s)"]
            for i in range(4):
                start = now - timedelta(minutes=(4-i)*15)
                end = start + timedelta(minutes=15)
                value = random.randint(100, 200)
                
                csv_lines.append(
                    f"{start.strftime('%Y-%m-%d %H:%M:%S')},"
                    f"{end.strftime('%Y-%m-%d %H:%M:%S')},"
                    f"{value}"
                )
            
            self.wfile.write('\n'.join(csv_lines).encode())
            
        else:
            self.send_response(404)
            self.end_headers()

def start_simulator(port=8084):
    """Start the real-time data simulator"""
    server = HTTPServer(('localhost', port), RealTimeDataSimulator)
    thread = threading.Thread(target=server.serve_forever)
    thread.daemon = True
    thread.start()
    return server

def display_dashboard(data):
    """Display data in a dashboard-like format"""
    print("\n" + "="*60)
    print(f"📊 LIVE SENSOR DASHBOARD - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    if 'people_counting' in data and data['people_counting']:
        print("\n👥 PEOPLE COUNTING DATA:")
        print("-"*60)
        print(f"{'Time Period':<25} {'In':<10} {'Out':<10} {'Total':<10}")
        print("-"*60)
        
        total_in = 0
        total_out = 0
        
        for record in data['people_counting']:
            time_str = record['timestamp'].strftime('%H:%M')
            in_count = record.get('total_in', 0)
            out_count = record.get('line4_out', 0)
            
            total_in += in_count
            total_out += out_count
            
            print(f"{time_str:<25} {in_count:<10} {out_count:<10} {in_count:<10}")
        
        print("-"*60)
        print(f"{'TOTAL':<25} {total_in:<10} {total_out:<10} {total_in:<10}")
        
        # Calculate metrics
        occupancy = total_in - total_out
        conversion_rate = (total_out / total_in * 100) if total_in > 0 else 0
        
        print(f"\n📈 METRICS:")
        print(f"   Current Occupancy: {occupancy} people")
        print(f"   Conversion Rate: {conversion_rate:.1f}%")
        print(f"   Average Stay: ~{random.randint(15, 45)} minutes")
    
    if 'heatmap' in data and data['heatmap']:
        print(f"\n🔥 HEATMAP ACTIVITY:")
        print("-"*60)
        avg_heat = sum(r['value'] for r in data['heatmap']) / len(data['heatmap'])
        print(f"   Average Heat Value: {avg_heat:.1f}")
        print(f"   Peak Activity: {max(r['value'] for r in data['heatmap'])}")
        
        # Visual representation
        print("\n   Heat Distribution:")
        for record in data['heatmap']:
            bars = "█" * int(record['value'] / 10)
            print(f"   {record['timestamp'].strftime('%H:%M')} {bars} {record['value']}")

def continuous_monitoring(connector, interval=30):
    """Continuously monitor and display data"""
    print("\n🚀 Starting Live Monitoring...")
    print(f"   Polling interval: {interval} seconds")
    print("   Press Ctrl+C to stop\n")
    
    try:
        while True:
            # Collect data for the last hour
            end_time = datetime.now()
            start_time = end_time - timedelta(hours=1)
            
            # Fetch data
            data = connector.collect_data(start_time, end_time)
            
            # Clear screen (works on most terminals)
            print("\033[2J\033[H", end='')
            
            # Display dashboard
            display_dashboard(data)
            
            # Show next update time
            next_update = datetime.now() + timedelta(seconds=interval)
            print(f"\n⏰ Next update: {next_update.strftime('%H:%M:%S')}")
            
            # Wait for next interval
            time.sleep(interval)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Monitoring stopped by user")

def main():
    """Main demonstration function"""
    print("\n🎯 CONNECTOR SYSTEM - LIVE DEMONSTRATION\n")
    
    # Start simulator
    print("1️⃣ Starting sensor simulator...")
    simulator = start_simulator(8084)
    time.sleep(1)
    print("   ✅ Simulator running on port 8084")
    
    # Create configuration
    print("\n2️⃣ Creating connector configuration...")
    config = {
        "connector": {
            "name": "Demo Store Sensor",
            "type": "people_counting_camera",
            "store": "Demo Retail Store",
            "connection": {
                "host": "localhost",
                "port": 8084,
                "auth": {"type": "none"}
            },
            "endpoints": {
                "people_counting": "/dataloader.cgi?dw=vcalogcsv",
                "heatmap": "/dataloader.cgi?dw=heatmapcsv"
            },
            "data_mapping": {
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "fields": [
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line2 - In", "target": "line2_in", "type": "integer"},
                    {"source": "Line3 - In", "target": "line3_in", "type": "integer"},
                    {"source": "Line4 - In", "target": "line4_in", "type": "integer"},
                    {"source": "Line4 - Out", "target": "line4_out", "type": "integer"}
                ]
            }
        }
    }
    
    # Create connector
    connector_config = ConfigLoader.create_from_dict(config)
    connector = ConnectorFactory.create_connector(connector_config)
    print("   ✅ Connector created and configured")
    
    # Test connection
    print("\n3️⃣ Testing connection...")
    if connector.validate_connection():
        print("   ✅ Connection successful!")
    else:
        print("   ❌ Connection failed!")
        return
    
    # Demo options
    print("\n4️⃣ Running automated demo...")
    
    # Run single collection demo
    choice = '1'
    
    if choice == '1':
        # Single collection
        print("\n📥 Collecting data...")
        data = connector.collect_data(
            datetime.now() - timedelta(hours=1),
            datetime.now()
        )
        display_dashboard(data)
        
    elif choice == '2':
        # Continuous monitoring
        continuous_monitoring(connector, interval=30)
        
    elif choice == '3':
        # Performance test
        print("\n⚡ Running performance test...")
        print("   Collecting data 10 times in rapid succession...")
        
        start = time.time()
        for i in range(10):
            data = connector.collect_data(
                datetime.now() - timedelta(minutes=30),
                datetime.now()
            )
            print(f"   Collection {i+1}/10 completed")
        
        elapsed = time.time() - start
        print(f"\n   ✅ Performance test completed!")
        print(f"   Total time: {elapsed:.2f} seconds")
        print(f"   Average per collection: {elapsed/10:.2f} seconds")
    
    else:
        print("   ❌ Invalid choice")

if __name__ == "__main__":
    main()