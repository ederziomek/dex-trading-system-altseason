const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

// Trading Engine API URL
const TRADING_ENGINE_URL = process.env.TRADING_ENGINE_URL || 'http://localhost:8000';

// Socket.IO Configuration
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || "http://localhost:3000",
            "http://localhost:5173", // Vite dev server
            "https://localhost:3000",
            "https://localhost:5173"
        ],
        methods: ["GET", "POST"]
    }
});

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

// Mock data (mantido para compatibilidade)
let trades = [];
let portfolio = {
    totalValue: 100,
    totalPnL: 0,
    totalPnLPercent: 0,
    positions: [],
    capital_usdt: 100,
    active_trades: 0,
    daily_pnl: 0.0,
    total_trades: 0,
    win_rate: 0.0
};

// Store io instance for use in routes
app.set('io', io);

// Helper function to call Trading Engine API
async function callTradingEngine(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${TRADING_ENGINE_URL}${endpoint}`,
            timeout: 10000
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`Trading Engine API error (${endpoint}):`, error.message);
        return { 
            success: false, 
            error: error.response?.data?.detail || error.message 
        };
    }
}

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

// WebSocket Connection Handler
io.on('connection', (socket) => {
    console.log(`WebSocket client connected: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`WebSocket client disconnected: ${socket.id}`);
    });
    
    socket.on('subscribe_trading_data', async (data) => {
        console.log(`Client ${socket.id} subscribed to trading data`);
        socket.join('trading_data');
        
        // Send current portfolio data from Trading Engine
        const portfolioResult = await callTradingEngine('/portfolio');
        if (portfolioResult.success) {
            socket.emit('portfolio_update', portfolioResult.data);
        }
    });
    
    socket.on('subscribe_portfolio', async (data) => {
        console.log(`Client ${socket.id} subscribed to portfolio updates`);
        socket.join('portfolio_updates');
        
        // Send current portfolio data from Trading Engine
        const portfolioResult = await callTradingEngine('/portfolio');
        if (portfolioResult.success) {
            socket.emit('portfolio_update', portfolioResult.data);
        }
    });

    socket.on('subscribe_trades', (data) => {
        console.log(`Client ${socket.id} subscribed to trade updates`);
        socket.join('trade_updates');
        
        // Send recent trades
        socket.emit('trades_update', trades.slice(-10));
    });
});

// Health check (público)
app.get('/api/health', async (req, res) => {
    console.log('Health check requested');
    
    // Check Trading Engine health
    const engineHealth = await callTradingEngine('/health');
    
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Minimal backend v6 with Python Trading Engine integration',
        version: '6.0.0',
        features: ['CORS enabled', 'JWT authentication', 'Trading routes', 'WebSocket real-time', 'Python Trading Engine'],
        trading_engine: {
            status: engineHealth.success ? 'connected' : 'disconnected',
            url: TRADING_ENGINE_URL
        }
    });
});

// Root route (público)
app.get('/', (req, res) => {
    res.json({ 
        message: 'DEX Trading System - Minimal Backend v6',
        health: '/api/health',
        auth: '/api/auth/login',
        trading: '/api/trading/portfolio',
        engine: '/api/engine/status',
        websocket: 'Socket.IO enabled',
        version: '6.0.0',
        features: ['CORS enabled', 'JWT authentication', 'Trading routes', 'WebSocket real-time', 'Python Trading Engine']
    });
});

// ========== AUTH ROUTES ==========

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

// ========== TRADING ENGINE ROUTES ==========

// Get Trading Engine status (protegido)
app.get('/api/engine/status', authenticateToken, async (req, res) => {
    const result = await callTradingEngine('/status');
    
    if (result.success) {
        res.json({
            success: true,
            data: result.data
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to get Trading Engine status',
            error: result.error
        });
    }
});

// Start Trading Engine (protegido)
app.post('/api/engine/start', authenticateToken, async (req, res) => {
    const result = await callTradingEngine('/start', 'POST');
    
    if (result.success) {
        // Emit WebSocket event
        io.to('trading_data').emit('engine_started', result.data);
        
        res.json({
            success: true,
            message: 'Trading Engine started successfully',
            data: result.data
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to start Trading Engine',
            error: result.error
        });
    }
});

// Stop Trading Engine (protegido)
app.post('/api/engine/stop', authenticateToken, async (req, res) => {
    const result = await callTradingEngine('/stop', 'POST');
    
    if (result.success) {
        // Emit WebSocket event
        io.to('trading_data').emit('engine_stopped', result.data);
        
        res.json({
            success: true,
            message: 'Trading Engine stopped successfully',
            data: result.data
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to stop Trading Engine',
            error: result.error
        });
    }
});

// ========== DASHBOARD ROUTES ==========

// Dashboard stats endpoint (protegido)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    const statusResult = await callTradingEngine('/status');
    
    if (statusResult.success) {
        res.json({
            success: true,
            data: {
                ...statusResult.data,
                last_updated: new Date().toISOString()
            }
        });
    } else {
        // Fallback to mock data
        res.json({
            success: true,
            data: {
                capital_usdt: portfolio.capital_usdt,
                active_trades: portfolio.active_trades,
                daily_pnl: portfolio.daily_pnl,
                total_trades: portfolio.total_trades,
                win_rate: portfolio.win_rate,
                total_pnl: portfolio.totalPnL,
                total_pnl_percent: portfolio.totalPnLPercent,
                last_updated: new Date().toISOString(),
                engine_status: 'disconnected'
            }
        });
    }
});

// ========== TRADING ROUTES ==========

// Get portfolio (protegido)
app.get('/api/trading/portfolio', authenticateToken, async (req, res) => {
    const result = await callTradingEngine('/portfolio');
    
    if (result.success) {
        res.json({
            success: true,
            data: result.data
        });
    } else {
        // Fallback to mock data
        res.json({
            success: true,
            data: portfolio
        });
    }
});

// Execute trade (protegido)
app.post('/api/trading/execute', authenticateToken, async (req, res) => {
    try {
        const { pair, side, amount, price, dex = '1inch', chainId = 1, slippage = 1 } = req.body;
        
        // Validate required fields
        if (!pair || !side || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pair, side, amount'
            });
        }
        
        // Call Trading Engine
        const result = await callTradingEngine('/execute', 'POST', {
            pair,
            side,
            amount: parseFloat(amount),
            price: price ? parseFloat(price) : null,
            dex,
            chain_id: parseInt(chainId),
            slippage: parseFloat(slippage)
        });
        
        if (result.success) {
            // Emit WebSocket events
            io.to('trading_data').emit('trade_submitted', result.data);
            io.to('trade_updates').emit('trade_submitted', result.data);
            
            res.status(201).json({
                success: true,
                message: 'Trade submitted to Trading Engine successfully',
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to execute trade via Trading Engine',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error executing trade:', error);
        res.status(500).json({
            success: false,
            message: 'Error executing trade',
            error: error.message
        });
    }
});

// Get trading history (protegido) - usando dados locais por enquanto
app.get('/api/trading/trades', authenticateToken, (req, res) => {
    try {
        const { page = 1, limit = 50, status, pair } = req.query;
        
        let filteredTrades = trades;
        
        // Filter by status
        if (status) {
            filteredTrades = filteredTrades.filter(trade => trade.status === status);
        }
        
        // Filter by pair
        if (pair) {
            filteredTrades = filteredTrades.filter(trade => trade.pair === pair);
        }
        
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedTrades = filteredTrades.slice(startIndex, endIndex);
        
        res.json({
            success: true,
            data: {
                trades: paginatedTrades,
                pagination: {
                    current: parseInt(page),
                    total: Math.ceil(filteredTrades.length / limit),
                    count: paginatedTrades.length,
                    totalCount: filteredTrades.length
                }
            }
        });
    } catch (error) {
        console.error('Error getting trades:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting trades',
            error: error.message
        });
    }
});

// Get trading stats (protegido)
app.get('/api/trading/stats', authenticateToken, async (req, res) => {
    const statusResult = await callTradingEngine('/status');
    
    if (statusResult.success) {
        const stats = {
            totalTrades: statusResult.data.total_trades || 0,
            totalVolume: 0, // Calcular baseado nos trades
            totalFees: 0,   // Calcular baseado nos trades
            averageTradeSize: 0,
            winRate: statusResult.data.win_rate || 0,
            profitLoss: statusResult.data.daily_pnl || 0,
            profitLossPercent: 0
        };
        
        res.json({
            success: true,
            data: stats
        });
    } else {
        // Fallback to mock calculation
        const completedTrades = trades.filter(t => t.status === 'completed');
        const totalTrades = completedTrades.length;
        const totalVolume = completedTrades.reduce((sum, trade) => sum + (trade.executedAmount || 0), 0);
        const totalFees = completedTrades.reduce((sum, trade) => sum + (trade.fees || 0), 0);
        
        const stats = {
            totalTrades,
            totalVolume,
            totalFees,
            averageTradeSize: totalTrades > 0 ? totalVolume / totalTrades : 0,
            winRate: portfolio.win_rate,
            profitLoss: portfolio.totalPnL,
            profitLossPercent: portfolio.totalPnLPercent
        };
        
        res.json({
            success: true,
            data: stats
        });
    }
});

// ========== WEBSOCKET TEST ROUTES ==========

// Test WebSocket broadcast (protegido)
app.post('/api/test/broadcast', authenticateToken, (req, res) => {
    const { message, room = 'trading_data' } = req.body;
    
    io.to(room).emit('test_message', {
        message: message || 'Test broadcast from backend v6',
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        message: `Broadcast sent to room: ${room}`
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
server.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Minimal backend v6 running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
    console.log(`💰 Trading: GET http://localhost:${port}/api/trading/portfolio`);
    console.log(`🤖 Trading Engine: ${TRADING_ENGINE_URL}`);
    console.log(`🔌 WebSocket: Socket.IO enabled`);
    console.log(`🌐 CORS enabled for frontend connections`);
    console.log(`🔑 JWT authentication enabled`);
    console.log(`📈 Trading routes enabled`);
    console.log(`⚡ Real-time updates via WebSocket`);
    console.log(`🐍 Python Trading Engine integration`);
});

module.exports = { app, server, io };

