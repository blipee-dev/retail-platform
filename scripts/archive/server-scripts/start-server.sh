#!/bin/bash
# Simple HTTP server script that restarts on failure

PORT=8080
DIR="/workspaces/retail-platform/docs/mockups"

echo "Starting HTTP server on port $PORT..."
echo "Press Ctrl+C to stop"

while true; do
    cd "$DIR"
    python -m http.server $PORT
    echo "Server stopped. Restarting in 2 seconds..."
    sleep 2
done