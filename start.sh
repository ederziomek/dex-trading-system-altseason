#!/bin/sh

echo "🚀 Starting DEX Trading System (Minimal Mode)..."

# Set environment variables for Railway
export NODE_ENV=production
export PORT=${PORT:-3001}

echo "🔧 Environment: $NODE_ENV"
echo "🌐 Port: $PORT"

# Check if backend directory exists
if [ ! -d "/app/backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

echo "📦 Installing minimal dependencies..."
cd /app/backend && npm install --only=production

# Start the minimal backend v5 with CORS, JWT, Trading routes and WebSocket
echo "🎯 Starting minimal backend v5 with CORS, JWT, Trading routes and WebSocket..."
cd /app/backend && node src/minimal-app-v5.js

