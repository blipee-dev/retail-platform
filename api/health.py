"""
Health check endpoint for Vercel deployment
"""
import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Health check endpoint"""
        response = {
            'status': 'healthy',
            'service': 'retail-platform-api',
            'timestamp': datetime.now().isoformat(),
            'version': '1.0.0',
            'environment': 'production'
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())