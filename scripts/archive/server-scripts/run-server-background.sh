#!/bin/bash

# Kill any existing Python HTTP servers
echo "Stopping any existing HTTP servers..."
pkill -f "python -m http.server" 2>/dev/null

# Start the server in the background with nohup
echo "Starting HTTP server on port 8080 in background..."
cd /workspaces/retail-platform/docs/mockups
nohup python -m http.server 8080 > server.log 2>&1 &

# Get the PID
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

# Save PID to file for later reference
echo $SERVER_PID > server.pid

echo "Server is running in background on http://localhost:8080"
echo "Logs are being written to server.log"
echo ""
echo "To stop the server later, run: kill $(cat server.pid)"
echo "To view logs, run: tail -f server.log"