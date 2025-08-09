const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const port = process.env.PORT || 3001;

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

// Mock data
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
    
    socket.on('subscribe_trading_data', (data) => {
        console.log(`Client ${socket.id} subscribed to trading data`);
        socket.join('trading_data');
        
        // Send current portfolio data
        socket.emit('portfolio_update', portfolio);
    });
    
    socket.on('subscribe_portfolio', (data) => {
        console.log(`Client ${socket.id} subscribed to portfolio updates`);
        socket.join('portfolio_updates');
        
        // Send current portfolio data
        socket.emit('portfolio_update', portfolio);
    });

    socket.on('subscribe_trades', (data) => {
        console.log(`Client ${socket.id} subscribed to trade updates`);
        socket.join('trade_updates');
        
        // Send recent trades
        socket.emit('trades_update', trades.slice(-10));
    });
});

// Health check (público)
app.get('/api/health', (req, res) => {
    console.log('Health check requested');
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Minimal backend v5 with CORS, JWT, Trading routes and WebSocket',
        version: '5.0.0',
        features: ['CORS enabled', 'JWT authentication', 'Trading routes', 'WebSocket real-time']
    });
});

// Root route (público)
app.get('/', (req, res) => {
    res.json({ 
        message: 'DEX Trading System - Minimal Backend v5',
        health: '/api/health',
        auth: '/api/auth/login',
        trading: '/api/trading/portfolio',
        websocket: 'Socket.IO enabled',
        version: '5.0.0',
        features: ['CORS enabled', 'JWT authentication', 'Trading routes', 'WebSocket real-time']
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

// ========== DASHBOARD ROUTES ==========

// Dashboard stats endpoint (protegido)
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
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
            last_updated: new Date().toISOString()
        }
    });
});

// ========== TRADING ROUTES ==========

// Get portfolio (protegido)
app.get('/api/trading/portfolio', authenticateToken, (req, res) => {
    try {
        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        console.error('Error getting portfolio:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting portfolio',
            error: error.message
        });
    }
});

// Get trading history (protegido)
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

// Execute trade (protegido)
app.post('/api/trading/execute', authenticateToken, (req, res) => {
    try {
        const { 
            pair, 
            side, 
            amount, 
            price, 
            dex = '1inch', 
            chainId = 1, 
            slippage = 1 
        } = req.body;
        
        // Validate required fields
        if (!pair || !side || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pair, side, amount'
            });
        }
        
        // Create new trade
        const newTrade = {
            id: trades.length + 1,
            pair,
            side,
            amount: parseFloat(amount),
            price: price ? parseFloat(price) : null,
            dex,
            chainId: parseInt(chainId),
            slippage: parseFloat(slippage),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            txHash: null,
            executedPrice: null,
            executedAmount: null,
            fees: null
        };
        
        trades.push(newTrade);
        
        // Emit WebSocket event for new trade
        io.to('trading_data').emit('trade_submitted', newTrade);
        io.to('trade_updates').emit('trade_submitted', newTrade);
        
        // Simulate trade execution
        setTimeout(() => {
            const trade = trades.find(t => t.id === newTrade.id);
            if (trade) {
                trade.status = 'completed';
                trade.txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
                trade.executedPrice = price || (Math.random() * 1000 + 1000);
                trade.executedAmount = amount * (1 - slippage / 100);
                trade.fees = amount * 0.003; // 0.3% fee
                trade.updatedAt = new Date().toISOString();
                
                // Update portfolio
                portfolio.total_trades++;
                portfolio.active_trades = trades.filter(t => t.status === 'pending').length;
                
                // Emit WebSocket events for trade execution
                io.to('trading_data').emit('trade_executed', trade);
                io.to('trade_updates').emit('trade_executed', trade);
                io.to('portfolio_updates').emit('portfolio_update', portfolio);
                
                console.log(`Trade executed: ${trade.id} - ${trade.pair} ${trade.side} ${trade.amount}`);
            }
        }, 2000); // 2 second delay to simulate execution
        
        res.status(201).json({
            success: true,
            message: 'Trade submitted successfully',
            data: newTrade
        });
    } catch (error) {
        console.error('Error executing trade:', error);
        res.status(500).json({
            success: false,
            message: 'Error executing trade',
            error: error.message
        });
    }
});

// Get trading stats (protegido)
app.get('/api/trading/stats', authenticateToken, (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error getting trading stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting trading stats',
            error: error.message
        });
    }
});

// ========== WEBSOCKET TEST ROUTES ==========

// Test WebSocket broadcast (protegido)
app.post('/api/test/broadcast', authenticateToken, (req, res) => {
    const { message, room = 'trading_data' } = req.body;
    
    io.to(room).emit('test_message', {
        message: message || 'Test broadcast from backend',
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
    console.log(`🚀 Minimal backend v5 running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/api/health`);
    console.log(`🔐 Login: POST http://localhost:${port}/api/auth/login`);
    console.log(`💰 Trading: GET http://localhost:${port}/api/trading/portfolio`);
    console.log(`🔌 WebSocket: Socket.IO enabled`);
    console.log(`🌐 CORS enabled for frontend connections`);
    console.log(`🔑 JWT authentication enabled`);
    console.log(`📈 Trading routes enabled`);
    console.log(`⚡ Real-time updates via WebSocket`);
});

module.exports = { app, server, io };

