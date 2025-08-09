#!/bin/sh

echo "🚀 Starting DEX Trading System..."

# Activate Python virtual environment
export PATH="/app/venv/bin:$PATH"
echo "✅ Python virtual environment activated"

# Check if backend directory exists
if [ ! -d "/app/backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "/app/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd /app/backend && npm install
fi

# Set environment variables for Railway
export NODE_ENV=production
export PORT=${PORT:-3001}

echo "🔧 Environment: $NODE_ENV"
echo "🌐 Port: $PORT"

# Start the backend
echo "🎯 Starting backend server..."
cd /app/backend && npm start

