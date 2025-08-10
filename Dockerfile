# Hybrid Dockerfile for DEX Trading System (Node.js + Python)
FROM python:3.11-slim AS python-base

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs

# Set working directory
WORKDIR /app

# Copy and install Python dependencies first (for better caching)
COPY trading-engine/requirements.txt ./trading-engine/
RUN cd trading-engine && pip install --no-cache-dir -r requirements.txt

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm install --only=production

COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production

# Copy and build frontend
COPY dex-trading-frontend/package*.json ./dex-trading-frontend/
RUN cd dex-trading-frontend && npm install

COPY dex-trading-frontend/ ./dex-trading-frontend/
RUN cd dex-trading-frontend && npm run build

# Copy all source code
COPY backend/ ./backend/
COPY trading-engine/ ./trading-engine/
COPY start.sh ./

# Create logs directory
RUN mkdir -p logs trading-engine/logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV PYTHONPATH=/app/trading-engine

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start command
CMD ["./start.sh"]

