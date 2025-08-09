# Multi-stage Dockerfile for DEX Trading System
FROM node:18-alpine AS base

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip python3-dev build-base py3-virtualenv

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Create Python virtual environment and install dependencies
COPY trading-engine/requirements.txt ./trading-engine/
RUN python3 -m venv /app/venv
RUN /app/venv/bin/pip install --upgrade pip
RUN /app/venv/bin/pip install -r trading-engine/requirements.txt

# Copy all source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV PATH="/app/venv/bin:$PATH"
ENV JWT_SECRET=railway-default-jwt-secret-change-in-production
ENV FRONTEND_URL=*

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Make start script executable
RUN chmod +x start.sh

# Start command
CMD ["./start.sh"]

