#!/usr/bin/env python3
import http.server
import socketserver
import os

# Change to the mockups directory
os.chdir('/workspaces/retail-platform/docs/mockups')

PORT = 8080
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Serving files from: {os.getcwd()}")
    print("Available files:")
    for file in os.listdir('.'):
        if file.endswith('.html'):
            print(f"  - {file}")
    httpd.serve_forever()