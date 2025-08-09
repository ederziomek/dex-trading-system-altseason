const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'dex-trading-system-super-secret-jwt-key-2025';

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access token required' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Invalid or expired token' 
            });
        }
        req.user = user;
        next();
    });
};

// Health check (público)
app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Minimal backend v3 with CORS and JWT is running',
        version: '3.0.0',
        features: ['CORS enabled', 'JWT authentication']
    });
});

// Root route (público)
app.get('/', (req, res) => {
    res.json({ 
        message: 'DEX Trading System - Minimal Backend v3',
        health: '/api/health',
        auth: '/api/auth/login',
        version: '3.0.0',
        features: ['CORS enabled', 'JWT authentication']
    });
});

// Login endpoint (público)
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Validação básica (em produção, verificar contra banco de dados)
    if (email === 'ederziomek@upbet.com' && password === 'password123') {
        const user = {
            id: 1,
            email: email,
            name: 'Eder Ziomek',
            role: 'admin'
        };
        
        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
        
        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: user
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }
});

// Logout endpoint (público)
app.post('/api/auth/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Profile endpoint (protegido)
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// Dashboard endpoint (protegido)
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
    res.json({
        success: true,
        data: {
            capital_usdt: 100,
            active_trades: 0,
            daily_pnl: 0.0,
            total_trades: 0,
            win_rate: 0.0,
            last_updated: new Date().toISOString()
        }
    });
});

// CORS preflight for all routes
app.options('*', cors());

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Minimal backend v3 running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
    console.log(`🌐 CORS enabled for frontend connections`);
    console.log(`🔑 JWT authentication enabled`);
});

module.exports = app;

