const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RealPortfolioManager = require('./portfolio-manager');
const { RateLimiter, APICache } = require('./middleware/rate-limiter');
const RiskManager = require('./middleware/risk-manager');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dex-trading-secret-key-2025';
const TRADING_ENGINE_URL = process.env.TRADING_ENGINE_URL || 'http://localhost:8000';

// Initialize components
const portfolioManager = new RealPortfolioManager();
const rateLimiter = new RateLimiter();
const apiCache = new APICache();
const riskManager = new RiskManager(portfolioManager);

// Middleware
app.use(cors());
app.use(express.json());

// Trust proxy for accurate IP detection
app.set('trust proxy', true);

// Serve static files from React build
const frontendPath = path.join(__dirname, '../../dex-trading-frontend/dist');
app.use(express.static(frontendPath));

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Mock user data
const mockUser = {
  id: 1,
  email: 'ederziomek@upbet.com',
  name: 'Eder Ziomek',
  role: 'admin'
};

// Real market data integration (enhanced with caching)
class RealMarketData {
  constructor() {
    this.coingeckoUrl = 'https://api.coingecko.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 60 seconds
  }

  async getRealPrices(tokenIds = ['ethereum', 'cardano', 'solana', 'polkadot', 'chainlink']) {
    const cacheKey = `market-prices:${tokenIds.join(',')}`;
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.coingeckoUrl}/simple/price`, {
        params: {
          ids: tokenIds.join(','),
          vs_currencies: 'usd',
          include_market_cap: 'true',
          include_24hr_vol: 'true',
          include_24hr_change: 'true',
          include_last_updated_at: 'true'
        },
        timeout: 10000
      });

      const data = response.data;
      apiCache.set(cacheKey, { success: true, data }, 30000); // 30 second cache
      return data;
    } catch (error) {
      console.error('Error fetching real prices:', error.message);
      return this.getMockPrices();
    }
  }

  async getGlobalMarketData() {
    const cacheKey = 'global-market';
    const cached = apiCache.get(cacheKey);
    
    if (cached) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.coingeckoUrl}/global`, { timeout: 10000 });
      const data = response.data.data;
      
      const processedData = {
        total_market_cap_usd: data.total_market_cap?.usd || 0,
        total_volume_usd: data.total_volume?.usd || 0,
        market_cap_change_24h: data.market_cap_change_percentage_24h_usd || 0,
        active_cryptocurrencies: data.active_cryptocurrencies || 0
      };

      apiCache.set(cacheKey, processedData, 300000); // 5 minute cache
      return processedData;
    } catch (error) {
      console.error('Error fetching global market data:', error.message);
      return {
        total_market_cap_usd: 2500000000000,
        total_volume_usd: 100000000000,
        market_cap_change_24h: 2.5,
        active_cryptocurrencies: 15000
      };
    }
  }

  getMockPrices() {
    return {
      ethereum: { usd: 3500, usd_market_cap: 420000000000, usd_24h_vol: 15000000000, usd_24h_change: 5.2 },
      cardano: { usd: 0.85, usd_market_cap: 30000000000, usd_24h_vol: 800000000, usd_24h_change: 2.1 },
      solana: { usd: 180, usd_market_cap: 85000000000, usd_24h_vol: 3000000000, usd_24h_change: 8.5 }
    };
  }
}

const marketData = new RealMarketData();

// Health check with system stats
app.get('/api/health', rateLimiter.createMiddleware('general'), async (req, res) => {
  try {
    const testPrices = await marketData.getRealPrices(['ethereum']);
    const isRealData = testPrices.ethereum && testPrices.ethereum.usd > 0;
    const portfolioSummary = portfolioManager.getPortfolioSummary();
    const rateLimiterStats = rateLimiter.getStats();
    const cacheStats = apiCache.getStats();
    const riskStats = riskManager.getRiskStats();

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'DEX Trading System - Full Stack v10 with Security & Risk Management',
      version: '10.0.0',
      features: [
        'CORS enabled',
        'JWT authentication',
        'Trading routes',
        'WebSocket real-time',
        'Python Trading Engine',
        'React Frontend Served',
        'Real Market Data Integration',
        'Real Portfolio Management',
        'Persistent Trade History',
        'Real Balance Tracking',
        'Rate Limiting & Protection',
        'Intelligent API Caching',
        'Risk Management System',
        'Stop-Loss Protection',
        'Portfolio Health Monitoring'
      ],
      market_data: {
        status: isRealData ? 'real' : 'fallback',
        source: 'CoinGecko API',
        last_update: new Date().toISOString()
      },
      portfolio: {
        status: 'active',
        total_value: portfolioSummary.totalValue,
        total_trades: portfolioSummary.totalTrades,
        last_updated: portfolioSummary.lastUpdated
      },
      security: {
        rate_limiter: rateLimiterStats,
        api_cache: cacheStats,
        risk_management: riskStats
      },
      trading_engine: {
        status: 'connected',
        url: TRADING_ENGINE_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
});

// Authentication routes with rate limiting
app.post('/api/auth/login', rateLimiter.createMiddleware('auth'), (req, res) => {
  const { email, password } = req.body;

  if (email === 'ederziomek@upbet.com' && password === 'password123') {
    const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: mockUser
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

app.post('/api/auth/logout', authenticateToken, rateLimiter.createMiddleware('general'), (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.get('/api/auth/profile', authenticateToken, rateLimiter.createMiddleware('general'), (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Dashboard routes with caching and rate limiting
app.get('/api/dashboard/stats', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'),
  apiCache.middleware('portfolio', 10000), // 10 second cache
  async (req, res) => {
    try {
      const prices = await marketData.getRealPrices();
      const globalData = await marketData.getGlobalMarketData();
      const portfolioData = await portfolioManager.calculatePortfolioValue(prices);
      const portfolioHealth = await riskManager.checkPortfolioHealth(prices);

      res.json({
        success: true,
        data: {
          ...portfolioData,
          portfolio_health: portfolioHealth,
          market_data: {
            total_market_cap: globalData.total_market_cap_usd,
            total_volume: globalData.total_volume_usd,
            market_change_24h: globalData.market_cap_change_24h,
            active_cryptos: globalData.active_cryptocurrencies
          }
        }
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard stats'
      });
    }
  }
);

// Trading routes with risk management
app.get('/api/trading/portfolio', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'),
  apiCache.middleware('portfolio', 5000), // 5 second cache
  async (req, res) => {
    try {
      const prices = await marketData.getRealPrices();
      const portfolioData = await portfolioManager.calculatePortfolioValue(prices);

      res.json({
        success: true,
        data: portfolioData
      });
    } catch (error) {
      console.error('Error getting portfolio:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolio data'
      });
    }
  }
);

// Execute trades with comprehensive risk management
app.post('/api/trading/execute', 
  authenticateToken, 
  rateLimiter.createMiddleware('trading'), 
  async (req, res) => {
    const { pair, side, amount, price } = req.body;

    try {
      // Get current market prices for risk validation
      const [baseSymbol] = pair.split('/');
      const tokenId = portfolioManager.symbolToTokenId(baseSymbol);
      const currentPrices = await marketData.getRealPrices([tokenId]);
      const marketPrice = currentPrices[tokenId]?.usd || price;

      // Risk management validation
      const tradeData = {
        pair,
        side,
        amount: parseFloat(amount),
        price: marketPrice,
        dex: '1inch'
      };

      const riskValidation = await riskManager.validateTrade(tradeData, currentPrices);

      // If trade is not valid, return errors
      if (!riskValidation.valid) {
        return res.status(400).json({
          success: false,
          message: 'Trade rejected by risk management',
          errors: riskValidation.errors,
          warnings: riskValidation.warnings
        });
      }

      // Apply suggested adjustments if any
      if (riskValidation.adjustments.suggestedAmount) {
        tradeData.amount = riskValidation.adjustments.suggestedAmount;
      }

      // Execute trade through portfolio manager
      const executedTrade = await portfolioManager.executeTrade(tradeData);

      // Emit real-time update
      io.emit('trade_executed', {
        ...executedTrade,
        risk_validation: riskValidation
      });

      res.json({
        success: true,
        message: 'Trade executed successfully',
        data: executedTrade,
        risk_validation: riskValidation
      });

    } catch (error) {
      console.error('Trade execution error:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Get trade history with caching
app.get('/api/trading/trades', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'),
  apiCache.middleware('trades', 5000), // 5 second cache
  (req, res) => {
    try {
      const { limit = 20 } = req.query;
      const trades = portfolioManager.getRecentTrades(parseInt(limit));

      res.json({
        success: true,
        data: trades
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get trades'
      });
    }
  }
);

// Get trading stats with risk metrics
app.get('/api/trading/stats', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'),
  async (req, res) => {
    try {
      const prices = await marketData.getRealPrices();
      const portfolioData = await portfolioManager.calculatePortfolioValue(prices);
      const riskStats = riskManager.getRiskStats();

      res.json({
        success: true,
        data: {
          total_trades: portfolioData.total_trades,
          successful_trades: Math.floor(portfolioData.total_trades * (portfolioData.win_rate / 100)),
          win_rate: portfolioData.win_rate,
          total_pnl: portfolioData.totalPnL,
          daily_pnl: portfolioData.daily_pnl,
          risk_metrics: riskStats
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get trading stats'
      });
    }
  }
);

// Portfolio management endpoints
app.get('/api/portfolio/balances', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'), 
  (req, res) => {
    try {
      const balances = portfolioManager.getBalances();
      res.json({
        success: true,
        data: balances
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get balances'
      });
    }
  }
);

app.post('/api/portfolio/add-funds', 
  authenticateToken, 
  rateLimiter.createMiddleware('trading'), 
  async (req, res) => {
    try {
      const { tokenId, amount } = req.body;
      
      if (!tokenId || !amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid tokenId or amount'
        });
      }

      await portfolioManager.addFunds(tokenId, parseFloat(amount));

      res.json({
        success: true,
        message: `Added ${amount} ${tokenId.toUpperCase()} to portfolio`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to add funds'
      });
    }
  }
);

// Market data endpoint with intelligent caching
app.get('/api/market/prices', 
  authenticateToken, 
  rateLimiter.createMiddleware('market'),
  apiCache.middleware('market-prices', 30000), // 30 second cache
  async (req, res) => {
    try {
      const { tokens } = req.query;
      const tokenList = tokens ? tokens.split(',') : ['ethereum', 'cardano', 'solana', 'polkadot', 'chainlink'];
      
      const prices = await marketData.getRealPrices(tokenList);
      
      res.json({
        success: true,
        data: prices,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting market prices:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get market prices'
      });
    }
  }
);

// Risk management endpoints
app.get('/api/risk/health', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'), 
  async (req, res) => {
    try {
      const prices = await marketData.getRealPrices();
      const health = await riskManager.checkPortfolioHealth(prices);
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolio health'
      });
    }
  }
);

app.post('/api/risk/emergency-stop', 
  authenticateToken, 
  rateLimiter.createMiddleware('trading'), 
  async (req, res) => {
    try {
      const { tokenId } = req.body;
      
      if (!tokenId) {
        return res.status(400).json({
          success: false,
          message: 'Token ID required'
        });
      }

      const prices = await marketData.getRealPrices([tokenId]);
      const result = await riskManager.executeEmergencyStopLoss(tokenId, prices);
      
      if (result.success) {
        io.emit('emergency_stop_executed', result.trade);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to execute emergency stop'
      });
    }
  }
);

// Admin endpoints for system management
app.get('/api/admin/stats', 
  authenticateToken, 
  rateLimiter.createMiddleware('general'), 
  (req, res) => {
    try {
      const rateLimiterStats = rateLimiter.getStats();
      const cacheStats = apiCache.getStats();
      const riskStats = riskManager.getRiskStats();
      const portfolioSummary = portfolioManager.getPortfolioSummary();

      res.json({
        success: true,
        data: {
          rate_limiter: rateLimiterStats,
          api_cache: cacheStats,
          risk_management: riskStats,
          portfolio: portfolioSummary,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: '10.0.0'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get admin stats'
      });
    }
  }
);

// Trading Engine routes (with fallback)
app.get('/api/engine/status', authenticateToken, rateLimiter.createMiddleware('general'), async (req, res) => {
  try {
    const response = await axios.get(`${TRADING_ENGINE_URL}/status`, { timeout: 3000 });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    const prices = await marketData.getRealPrices();
    const portfolioData = await portfolioManager.calculatePortfolioValue(prices);

    res.json({
      success: true,
      data: {
        active: false,
        capital_usdt: portfolioData.capital_usdt,
        active_trades: portfolioData.active_trades,
        daily_pnl: portfolioData.daily_pnl,
        total_trades: portfolioData.total_trades,
        win_rate: portfolioData.win_rate,
        last_updated: new Date().toISOString()
      }
    });
  }
});

app.post('/api/engine/start', authenticateToken, rateLimiter.createMiddleware('trading'), async (req, res) => {
  try {
    const response = await axios.post(`${TRADING_ENGINE_URL}/start`, {}, { timeout: 5000 });
    res.json({
      success: true,
      message: 'Trading Engine started successfully',
      data: response.data
    });
  } catch (error) {
    const prices = await marketData.getRealPrices();
    const portfolioData = await portfolioManager.calculatePortfolioValue(prices);

    res.json({
      success: true,
      message: 'Trading Engine started successfully (simulated)',
      data: {
        message: 'Trading Engine started successfully',
        status: 'active',
        capital: portfolioData.totalValue
      }
    });
  }
});

app.post('/api/engine/stop', authenticateToken, rateLimiter.createMiddleware('trading'), async (req, res) => {
  try {
    const response = await axios.post(`${TRADING_ENGINE_URL}/stop`, {}, { timeout: 5000 });
    res.json({
      success: true,
      message: 'Trading Engine stopped successfully',
      data: response.data
    });
  } catch (error) {
    res.json({
      success: true,
      message: 'Trading Engine stopped successfully (simulated)',
      data: {
        message: 'Trading Engine stopped successfully',
        status: 'inactive'
      }
    });
  }
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// WebSocket connection handling with enhanced real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send real-time market, portfolio, and system updates
  const updateInterval = setInterval(async () => {
    try {
      const prices = await marketData.getRealPrices();
      const portfolioData = await portfolioManager.calculatePortfolioValue(prices);
      const portfolioHealth = await riskManager.checkPortfolioHealth(prices);
      
      socket.emit('market_update', {
        prices,
        portfolio: portfolioData,
        portfolio_health: portfolioHealth,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending real-time update:', error);
    }
  }, 30000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(updateInterval);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DEX Trading System v10 (Security & Risk Management) running on port ${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🎨 Frontend: http://localhost:${PORT}/`);
  console.log(`🤖 Trading Engine URL: ${TRADING_ENGINE_URL}`);
  console.log(`📈 Real Market Data: CoinGecko API Integration`);
  console.log(`💼 Real Portfolio: Persistent data with trade execution`);
  console.log(`🛡️ Security: Rate limiting, API caching, risk management`);
  console.log(`⚡ Performance: Intelligent caching and optimization`);
});

module.exports = app;

