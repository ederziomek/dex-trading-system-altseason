#!/bin/bash

echo "🚀 Starting DEX Trading System v8 (Real Market Data Integration)..."

# Set environment variables for Railway
export NODE_ENV=production
export PORT=${PORT:-3001}
export PYTHONPATH=/app/trading-engine

echo "🔧 Environment: $NODE_ENV"
echo "🌐 Port: $PORT"
echo "🐍 Python Path: $PYTHONPATH"
echo "📈 Market Data: CoinGecko API Integration"

# Check if directories exist
if [ ! -d "/app/backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

if [ ! -d "/app/trading-engine" ]; then
    echo "❌ Trading Engine directory not found!"
    exit 1
fi

echo "📦 Installing Node.js dependencies..."
cd /app/backend && npm install --only=production

echo "🐍 Installing Python dependencies..."
cd /app/trading-engine && pip install -r requirements.txt

# Start Trading Engine API Server in background
echo "🤖 Starting Trading Engine API Server..."
cd /app/trading-engine && python api_server.py &
TRADING_ENGINE_PID=$!

# Wait a moment for Trading Engine to initialize
sleep 5

# Start the Node.js backend v8 with Real Market Data
echo "🎯 Starting Node.js backend v8 (Real Market Data + React Frontend)..."
cd /app/backend && node src/minimal-app-v8.js &
BACKEND_PID=$!

# Function to handle shutdown
shutdown() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    kill $TRADING_ENGINE_PID 2>/dev/null
    exit 0
}

# Trap signals
trap shutdown SIGTERM SIGINT

echo "✅ DEX Trading System v8 started successfully!"
echo "📊 Real market data integration active"
echo "🌐 Frontend available at: http://localhost:$PORT"
echo "📡 API available at: http://localhost:$PORT/api/health"

# Wait for processes
wait $BACKEND_PID

