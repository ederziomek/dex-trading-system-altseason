#!/bin/sh

# Activate Python virtual environment
export PATH="/app/venv/bin:$PATH"

# Start the backend
cd /app/backend && npm start

