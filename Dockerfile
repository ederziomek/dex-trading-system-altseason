# Minimal Dockerfile for DEX Trading System
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --only=production

# Copy backend package files and install dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --only=production

# Copy backend source code only
COPY backend/ ./backend/
COPY start.sh ./

# Create logs directory
RUN mkdir -p logs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start command
CMD ["./start.sh"]

