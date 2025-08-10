#!/bin/bash

echo "🎨 Building React Frontend..."

# Check if frontend directory exists
if [ ! -d "dex-trading-frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

# Navigate to frontend directory
cd dex-trading-frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the React app
echo "🔨 Building React app for production..."
npm run build

# Check if build was successful
if [ -d "dist" ]; then
    echo "✅ Frontend build completed successfully!"
    echo "📁 Build files available in: dex-trading-frontend/dist/"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "🚀 Frontend ready for deployment!"

