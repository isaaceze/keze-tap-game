#!/bin/bash

# Keze Tap Game - Smart Server Starter
# Automatically handles port conflicts and starts the Flask backend

echo "🚀 Starting Keze Tap Game Backend Server..."
echo ""

# Check if we're in the right directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the server-python directory"
    echo "   cd telegram-tap-game/server-python"
    echo "   ./start-server.sh"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Error: Python is not installed or not in PATH"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

echo "🐍 Using Python: $PYTHON_CMD"

# Check if required packages are installed
echo "📦 Checking dependencies..."
if ! $PYTHON_CMD -c "import flask, mysql.connector" 2>/dev/null; then
    echo "⚠️  Missing dependencies. Installing..."
    $PYTHON_CMD -m pip install -r requirements.txt
fi

# Kill any existing Flask processes on common ports
echo "🧹 Cleaning up any existing Flask processes..."
pkill -f "python.*app.py" 2>/dev/null || true

# Try to start the server
echo "🚀 Starting server with automatic port detection..."
echo ""
$PYTHON_CMD app.py

echo ""
echo "🎯 If the server started successfully, you can:"
echo "   - Test API: curl http://localhost:[PORT]/api/health"
echo "   - Update frontend .env.local with the correct API URL"
echo "   - Start frontend: npm run dev"
