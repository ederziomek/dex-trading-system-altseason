# Multi-stage Dockerfile for DEX Trading System
FROM node:18-alpine AS base

# Install Python and dependencies
RUN apk add --no-cache python3 py3-pip python3-dev build-base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy trading engine requirements and install Python dependencies
COPY trading-engine/requirements.txt ./trading-engine/
RUN cd trading-engine && pip3 install -r requirements.txt

# Copy all source code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start command
CMD ["npm", "run", "start:backend"]

