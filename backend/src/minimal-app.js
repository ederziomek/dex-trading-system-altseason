const express = require('express');

const app = express();
const port = process.env.PORT || 3001;

// Middleware básico
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Minimal backend is running'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'DEX Trading System - Minimal Backend',
        health: '/api/health'
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Minimal backend running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
});

module.exports = app;

