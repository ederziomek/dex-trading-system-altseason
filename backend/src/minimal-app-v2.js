const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// CORS Configuration
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:5173", // Vite dev server
        "https://localhost:3000",
        "https://localhost:5173"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware básico
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Minimal backend v2 with CORS is running',
        version: '2.0.0',
        cors: 'enabled'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'DEX Trading System - Minimal Backend v2',
        health: '/api/health',
        version: '2.0.0',
        features: ['CORS enabled']
    });
});

// CORS preflight for all routes
app.options('*', cors());

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Minimal backend v2 running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🌐 CORS enabled for frontend connections`);
});

module.exports = app;

