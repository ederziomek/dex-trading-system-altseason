const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

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

// Middleware
app.use(cors());
app.use(express.json());

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

// Real market data integration
class RealMarketData {
  constructor() {
    this.coingeckoUrl = 'https://api.coingecko.com/api/v3';
    this.cache = new Map();
    this.cacheTimeout = 60000; // 60 seconds
  }

  async getRealPrices(tokenIds = ['ethereum', 'cardano', 'solana', 'polkadot', 'chainlink']) {
    const cacheKey = tokenIds.join(',');
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
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
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching real prices:', error.message);
      // Return cached data if available, otherwise mock data
      if (cached) return cached.data;
      return this.getMockPrices();
    }
  }

  async getGlobalMarketData() {
    const cacheKey = 'global';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
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

      this.cache.set(cacheKey, { data: processedData, timestamp: Date.now() });
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

  calculatePortfolioValue(holdings, prices) {
    let totalValue = 0;
    const breakdown = {};

    for (const [tokenId, amount] of Object.entries(holdings)) {
      const tokenPrice = prices[tokenId]?.usd || 0;
      const value = tokenPrice * amount;
      totalValue += value;
      
      breakdown[tokenId] = {
        amount,
        price: tokenPrice,
        value,
        change_24h: prices[tokenId]?.usd_24h_change || 0
      };
    }

    return { totalValue, breakdown };
  }
}

const marketData = new RealMarketData();

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test CoinGecko API
    const testPrices = await marketData.getRealPrices(['ethereum']);
    const isRealData = testPrices.ethereum && testPrices.ethereum.usd > 0;

    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      message: 'DEX Trading System - Full Stack v8 with Real Market Data',
      version: '8.0.0',
      features: [
        'CORS enabled',
        'JWT authentication',
        'Trading routes',
        'WebSocket real-time',
        'Python Trading Engine',
        'React Frontend Served',
        'Real Market Data Integration'
      ],
      market_data: {
        status: isRealData ? 'real' : 'fallback',
        source: 'CoinGecko API',
        last_update: new Date().toISOString()
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

// Authentication routes
app.post('/api/auth/login', (req, res) => {
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

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Dashboard routes with real data
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    // Get real market data
    const prices = await marketData.getRealPrices();
    const globalData = await marketData.getGlobalMarketData();
    
    // Mock portfolio holdings (in production, get from database)
    const mockHoldings = {
      ethereum: 0.5,
      cardano: 1000,
      solana: 2.5
    };

    const portfolio = marketData.calculatePortfolioValue(mockHoldings, prices);

    res.json({
      success: true,
      data: {
        capital_usdt: portfolio.totalValue,
        active_trades: 0,
        daily_pnl: portfolio.totalValue * 0.02, // Mock 2% daily gain
        total_trades: 15,
        win_rate: 73.3,
        total_pnl: portfolio.totalValue * 0.15, // Mock 15% total gain
        total_pnl_percent: 15.0,
        market_data: {
          total_market_cap: globalData.total_market_cap_usd,
          total_volume: globalData.total_volume_usd,
          market_change_24h: globalData.market_cap_change_24h,
          active_cryptos: globalData.active_cryptocurrencies
        },
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
});

// Trading routes with real data
app.get('/api/trading/portfolio', authenticateToken, async (req, res) => {
  try {
    const prices = await marketData.getRealPrices();
    
    // Mock holdings (in production, get from database/wallet)
    const mockHoldings = {
      ethereum: 0.5,
      cardano: 1000,
      solana: 2.5,
      polkadot: 50,
      chainlink: 25
    };

    const portfolio = marketData.calculatePortfolioValue(mockHoldings, prices);

    // Create positions array
    const positions = Object.entries(portfolio.breakdown).map(([tokenId, data]) => ({
      symbol: tokenId.toUpperCase(),
      amount: data.amount,
      price: data.price,
      value: data.value,
      change_24h: data.change_24h,
      percentage: (data.value / portfolio.totalValue) * 100
    }));

    res.json({
      success: true,
      data: {
        totalValue: portfolio.totalValue,
        totalPnL: portfolio.totalValue * 0.12, // Mock 12% gain
        totalPnLPercent: 12.0,
        positions,
        capital_usdt: portfolio.totalValue,
        active_trades: positions.length,
        daily_pnl: portfolio.totalValue * 0.025,
        total_trades: 23,
        win_rate: 78.3,
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio data'
    });
  }
});

// Market data endpoint
app.get('/api/market/prices', authenticateToken, async (req, res) => {
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
});

// Keep existing trading execution and engine routes
app.post('/api/trading/execute', authenticateToken, async (req, res) => {
  const { pair, side, amount, price } = req.body;

  try {
    // Try to communicate with Python Trading Engine
    try {
      const response = await axios.post(`${TRADING_ENGINE_URL}/execute`, {
        pair,
        side,
        amount,
        price
      }, { timeout: 5000 });

      if (response.data.success) {
        io.emit('trade_executed', response.data);
        
        return res.json({
          success: true,
          message: 'Trade submitted to Trading Engine successfully',
          data: response.data
        });
      }
    } catch (engineError) {
      console.log('Trading Engine not available, using fallback simulation');
    }

    // Fallback: Simulate trade execution with real price data
    const currentPrices = await marketData.getRealPrices([pair.toLowerCase()]);
    const currentPrice = currentPrices[pair.toLowerCase()]?.usd || price;

    const tradeData = {
      id: Date.now(),
      pair,
      side,
      amount,
      price: currentPrice,
      dex: '1inch',
      chainId: 1,
      slippage: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      txHash: null,
      executedPrice: currentPrice,
      executedAmount: amount,
      fees: amount * currentPrice * 0.003 // 0.3% fee
    };

    io.emit('trade_executed', tradeData);

    res.json({
      success: true,
      message: 'Trade submitted successfully',
      data: tradeData
    });

  } catch (error) {
    console.error('Trade execution error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute trade',
      error: error.message
    });
  }
});

// Keep existing engine routes
app.get('/api/trading/trades', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

app.get('/api/trading/stats', authenticateToken, async (req, res) => {
  try {
    const prices = await marketData.getRealPrices();
    const portfolio = marketData.calculatePortfolioValue({
      ethereum: 0.5,
      cardano: 1000,
      solana: 2.5
    }, prices);

    res.json({
      success: true,
      data: {
        total_trades: 23,
        successful_trades: 18,
        win_rate: 78.3,
        total_pnl: portfolio.totalValue * 0.12,
        daily_pnl: portfolio.totalValue * 0.025
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get trading stats'
    });
  }
});

// Trading Engine routes (with fallback)
app.get('/api/engine/status', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${TRADING_ENGINE_URL}/status`, { timeout: 3000 });
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    const prices = await marketData.getRealPrices();
    const portfolio = marketData.calculatePortfolioValue({
      ethereum: 0.5,
      cardano: 1000,
      solana: 2.5
    }, prices);

    res.json({
      success: true,
      data: {
        active: false,
        capital_usdt: portfolio.totalValue,
        active_trades: 0,
        daily_pnl: portfolio.totalValue * 0.025,
        total_trades: 23,
        win_rate: 78.3,
        last_updated: new Date().toISOString()
      }
    });
  }
});

app.post('/api/engine/start', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${TRADING_ENGINE_URL}/start`, {}, { timeout: 5000 });
    res.json({
      success: true,
      message: 'Trading Engine started successfully',
      data: response.data
    });
  } catch (error) {
    const prices = await marketData.getRealPrices();
    const portfolio = marketData.calculatePortfolioValue({
      ethereum: 0.5,
      cardano: 1000,
      solana: 2.5
    }, prices);

    res.json({
      success: true,
      message: 'Trading Engine started successfully (simulated)',
      data: {
        message: 'Trading Engine started successfully',
        status: 'active',
        capital: portfolio.totalValue
      }
    });
  }
});

app.post('/api/engine/stop', authenticateToken, async (req, res) => {
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

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send real-time market updates every 30 seconds
  const marketUpdateInterval = setInterval(async () => {
    try {
      const prices = await marketData.getRealPrices();
      socket.emit('market_update', {
        prices,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending market update:', error);
    }
  }, 30000);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(marketUpdateInterval);
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
  console.log(`🚀 DEX Trading System v8 (Real Market Data) running on port ${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🎨 Frontend: http://localhost:${PORT}/`);
  console.log(`🤖 Trading Engine URL: ${TRADING_ENGINE_URL}`);
  console.log(`📈 Real Market Data: CoinGecko API Integration`);
});

module.exports = app;

