#!/usr/bin/env python3
"""
Smart HTTP Server that handles both URLs with and without .html extensions
"""

import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse, unquote

class SmartHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = unquote(parsed_path.path)
        
        # Remove leading slash
        if path.startswith('/'):
            path = path[1:]
        
        # Handle root path
        if path == '' or path == '/':
            path = 'index.html'
        
        # If the path doesn't end with .html, try adding it
        if not path.endswith('.html') and not path.endswith('.css') and not path.endswith('.js') and not path.endswith('.png') and not path.endswith('.jpg') and not path.endswith('.ico'):
            # Check if the file exists with .html extension
            html_path = path + '.html'
            if os.path.exists(html_path):
                # Redirect to the .html version
                self.send_response(301)
                self.send_header('Location', '/' + html_path)
                self.end_headers()
                return
        
        # Handle the request normally
        super().do_GET()

def run_server(port=8080):
    """Run the smart HTTP server"""
    handler = SmartHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"Smart HTTP server running on port {port}")
            print(f"Server handles both URLs with and without .html extensions")
            print(f"Access your files at: http://localhost:{port}/")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except Exception as e:
        print(f"Error starting server: {e}")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)