const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const dexRoutes = require('./routes/dex');
const tradingRoutes = require('./routes/trading');
const dashboardRoutes = require('./routes/dashboard');

class App {
    constructor() {
        this.app = express();
        this.server = createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.initializeErrorHandling();
    }

    initializeMiddlewares() {
        // Security
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            }
        }));
        
        // CORS
        this.app.use(cors({
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }));
        
        // Compression
        this.app.use(compression());
        
        // Rate limiting
        const limiter = rateLimit({
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
            message: {
                error: 'Too many requests from this IP',
                retryAfter: '15 minutes'
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path} - ${req.ip}`);
            next();
        });
    }

    initializeRoutes() {
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'OK', 
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '2.0.0',
                environment: process.env.NODE_ENV || 'development'
            });
        });

        // API routes
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/dex', dexRoutes);
        this.app.use('/api/trading', tradingRoutes);
        this.app.use('/api/dashboard', dashboardRoutes);

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
                path: req.originalUrl
            });
        });
    }

    initializeWebSocket() {
        this.io.on('connection', (socket) => {
            logger.info(`WebSocket client connected: ${socket.id}`);
            
            socket.on('disconnect', () => {
                logger.info(`WebSocket client disconnected: ${socket.id}`);
            });
            
            socket.on('subscribe_trading_data', (data) => {
                logger.info(`Client ${socket.id} subscribed to trading data`);
                socket.join('trading_data');
            });
            
            socket.on('subscribe_dex_data', (data) => {
                logger.info(`Client ${socket.id} subscribed to DEX data`);
                socket.join('dex_data');
            });

            socket.on('subscribe_portfolio', (data) => {
                logger.info(`Client ${socket.id} subscribed to portfolio updates`);
                socket.join('portfolio_updates');
            });
        });

        // Store io instance for use in other modules
        this.app.set('io', this.io);
    }

    initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    listen() {
        const port = process.env.PORT || 3001;
        this.server.listen(port, '0.0.0.0', () => {
            logger.info(`🚀 DEX Trading Backend running on port ${port}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Health check: http://localhost:${port}/api/health`);
        });
    }
}

// Create and start the application
const app = new App();
app.listen();

module.exports = app;

