#!/bin/bash

PORT=8080
PID_FILE="/workspaces/retail-platform/docs/mockups/server.pid"
LOG_FILE="/workspaces/retail-platform/docs/mockups/server.log"
MOCKUPS_DIR="/workspaces/retail-platform/docs/mockups"

start_server() {
    # Check if server is already running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "Server is already running with PID: $PID"
            return
        fi
    fi
    
    # Kill any orphaned servers
    pkill -f "python -m http.server $PORT" 2>/dev/null
    
    # Start server in background
    cd "$MOCKUPS_DIR"
    nohup python -m http.server $PORT > "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    
    echo "✓ Server started on http://localhost:$PORT"
    echo "  PID: $(cat $PID_FILE)"
    echo "  Logs: $LOG_FILE"
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        kill $PID 2>/dev/null
        rm -f "$PID_FILE"
        echo "✓ Server stopped"
    else
        echo "No server PID file found"
    fi
}

status_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "✓ Server is running (PID: $PID)"
            echo "  URL: http://localhost:$PORT"
        else
            echo "✗ Server is not running (stale PID file)"
            rm -f "$PID_FILE"
        fi
    else
        echo "✗ Server is not running"
    fi
}

restart_server() {
    echo "Restarting server..."
    stop_server
    sleep 1
    start_server
}

# Auto-restart mechanism
monitor_server() {
    echo "Starting server monitor..."
    while true; do
        if [ -f "$PID_FILE" ]; then
            PID=$(cat "$PID_FILE")
            if ! ps -p $PID > /dev/null 2>&1; then
                echo "Server crashed, restarting..."
                start_server
            fi
        else
            start_server
        fi
        sleep 5
    done
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        status_server
        ;;
    monitor)
        monitor_server
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|monitor}"
        echo "  start   - Start the server"
        echo "  stop    - Stop the server"
        echo "  restart - Restart the server"
        echo "  status  - Check server status"
        echo "  monitor - Start server and auto-restart if it crashes"
        exit 1
esac