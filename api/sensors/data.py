"""
Vercel Serverless Function for Sensor Data API
"""
import json
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler

# Add src to Python path for imports
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from src.connector_system import ConnectorFactory, ConfigLoader


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Handle GET requests for sensor data"""
        try:
            # Parse query parameters
            query = self.path.split('?')[1] if '?' in self.path else ''
            params = {}
            if query:
                for param in query.split('&'):
                    if '=' in param:
                        key, value = param.split('=', 1)
                        params[key] = value
            
            sensor_type = params.get('type', 'milesight')
            start_date = params.get('start_date', datetime.now().strftime('%Y-%m-%d'))
            end_date = params.get('end_date', datetime.now().strftime('%Y-%m-%d'))
            
            # Response
            response = {
                'status': 'success',
                'sensor_type': sensor_type,
                'date_range': {
                    'start': start_date,
                    'end': end_date
                },
                'data': {
                    'total_in': 150,
                    'total_out': 145,
                    'peak_hour': '14:00',
                    'average_dwell_time': 12.5
                },
                'timestamp': datetime.now().isoformat()
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {
                'status': 'error',
                'message': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_POST(self):
        """Handle POST requests for sensor data"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Process the data (placeholder)
            response = {
                'status': 'success',
                'message': 'Data received',
                'data_points': len(data.get('readings', [])),
                'timestamp': datetime.now().isoformat()
            }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            error_response = {
                'status': 'error',
                'message': str(e)
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()