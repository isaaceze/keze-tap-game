#!/bin/bash

# Keze Tap Game - Port Conflict Quick Fix
# Run this script to automatically resolve port 5000 conflicts

echo "🔧 Keze Tap Game - Port Conflict Quick Fix"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -d "server-python" ]; then
    echo "❌ Error: Please run this script from the telegram-tap-game directory"
    echo "   cd telegram-tap-game"
    echo "   ./fix-port-conflict.sh"
    exit 1
fi

echo "🔍 Checking for port conflicts..."

# Kill any processes using common ports
echo "🧹 Stopping any conflicting processes..."
for port in 5000 5001 5002; do
    if lsof -ti:$port >/dev/null 2>&1; then
        echo "   ⚡ Killing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
    fi
done

# Clean up any existing Flask/Python processes
pkill -f "python.*app.py" 2>/dev/null || true
echo "   ✅ Process cleanup complete"

echo ""
echo "🚀 Starting Keze Tap Game backend with auto port detection..."
echo ""

# Navigate to server directory and start
cd server-python

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Start the server
$PYTHON_CMD app.py &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null 2>&1; then
    echo ""
    echo "✅ Server started successfully!"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Note the port number shown above"
    echo "   2. Update your frontend .env.local file:"
    echo "      NEXT_PUBLIC_API_URL=http://localhost:[PORT]/api"
    echo "   3. Start frontend: npm run dev"
    echo ""
    echo "📋 Useful commands:"
    echo "   • Test API: curl http://localhost:[PORT]/api/health"
    echo "   • Stop server: kill $SERVER_PID"
    echo ""
    echo "Server is running in background (PID: $SERVER_PID)"
else
    echo "❌ Server failed to start. Check the error messages above."
    exit 1
fi
