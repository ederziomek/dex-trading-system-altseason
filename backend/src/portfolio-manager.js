/**
 * Real Portfolio Manager - Manages real portfolio data and trades
 */

const fs = require('fs').promises;
const path = require('path');

class RealPortfolioManager {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.portfolioFile = path.join(this.dataDir, 'portfolio.json');
    this.tradesFile = path.join(this.dataDir, 'trades.json');
    this.balancesFile = path.join(this.dataDir, 'balances.json');
    
    this.portfolio = null;
    this.trades = [];
    this.balances = {};
    
    this.initializeData();
  }

  async initializeData() {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(this.dataDir, { recursive: true });
      
      // Load existing data or create defaults
      await this.loadPortfolio();
      await this.loadTrades();
      await this.loadBalances();
      
      console.log('✅ Portfolio Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing Portfolio Manager:', error);
      await this.createDefaultData();
    }
  }

  async loadPortfolio() {
    try {
      const data = await fs.readFile(this.portfolioFile, 'utf8');
      this.portfolio = JSON.parse(data);
    } catch (error) {
      // Create default portfolio
      this.portfolio = {
        userId: 1,
        totalInvested: 10000, // Initial investment in USDT
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      await this.savePortfolio();
    }
  }

  async loadTrades() {
    try {
      const data = await fs.readFile(this.tradesFile, 'utf8');
      this.trades = JSON.parse(data);
    } catch (error) {
      this.trades = [];
      await this.saveTrades();
    }
  }

  async loadBalances() {
    try {
      const data = await fs.readFile(this.balancesFile, 'utf8');
      this.balances = JSON.parse(data);
    } catch (error) {
      // Create default balances - starting with some initial holdings
      this.balances = {
        'usdt': 5000, // 5000 USDT cash
        'ethereum': 1.2, // 1.2 ETH
        'cardano': 2500, // 2500 ADA
        'solana': 8.5, // 8.5 SOL
        'polkadot': 150, // 150 DOT
        'chainlink': 75 // 75 LINK
      };
      await this.saveBalances();
    }
  }

  async createDefaultData() {
    console.log('🔧 Creating default portfolio data...');
    
    // Default portfolio
    this.portfolio = {
      userId: 1,
      totalInvested: 10000,
      totalValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };

    // Default balances
    this.balances = {
      'usdt': 5000,
      'ethereum': 1.2,
      'cardano': 2500,
      'solana': 8.5,
      'polkadot': 150,
      'chainlink': 75
    };

    // Empty trades
    this.trades = [];

    await Promise.all([
      this.savePortfolio(),
      this.saveBalances(),
      this.saveTrades()
    ]);
  }

  async savePortfolio() {
    await fs.writeFile(this.portfolioFile, JSON.stringify(this.portfolio, null, 2));
  }

  async saveTrades() {
    await fs.writeFile(this.tradesFile, JSON.stringify(this.trades, null, 2));
  }

  async saveBalances() {
    await fs.writeFile(this.balancesFile, JSON.stringify(this.balances, null, 2));
  }

  // Calculate portfolio value using real prices
  async calculatePortfolioValue(marketPrices) {
    let totalValue = 0;
    const positions = [];

    // USDT is always 1:1
    const usdtBalance = this.balances.usdt || 0;
    totalValue += usdtBalance;
    
    if (usdtBalance > 0) {
      positions.push({
        symbol: 'USDT',
        tokenId: 'usdt',
        amount: usdtBalance,
        price: 1,
        value: usdtBalance,
        change_24h: 0,
        percentage: 0 // Will be calculated later
      });
    }

    // Calculate value for each crypto holding
    for (const [tokenId, amount] of Object.entries(this.balances)) {
      if (tokenId === 'usdt' || amount <= 0) continue;

      const tokenPrice = marketPrices[tokenId]?.usd || 0;
      const value = tokenPrice * amount;
      const change24h = marketPrices[tokenId]?.usd_24h_change || 0;

      totalValue += value;

      if (value > 0) {
        positions.push({
          symbol: tokenId.toUpperCase(),
          tokenId,
          amount,
          price: tokenPrice,
          value,
          change_24h: change24h,
          percentage: 0 // Will be calculated later
        });
      }
    }

    // Calculate percentages
    positions.forEach(position => {
      position.percentage = totalValue > 0 ? (position.value / totalValue) * 100 : 0;
    });

    // Update portfolio
    const totalPnL = totalValue - this.portfolio.totalInvested;
    const totalPnLPercent = this.portfolio.totalInvested > 0 ? 
      (totalPnL / this.portfolio.totalInvested) * 100 : 0;

    this.portfolio.totalValue = totalValue;
    this.portfolio.totalPnL = totalPnL;
    this.portfolio.totalPnLPercent = totalPnLPercent;
    this.portfolio.lastUpdated = new Date().toISOString();

    await this.savePortfolio();

    return {
      totalValue,
      totalPnL,
      totalPnLPercent,
      positions,
      capital_usdt: usdtBalance,
      active_trades: this.getActiveTrades().length,
      daily_pnl: this.calculateDailyPnL(),
      total_trades: this.trades.length,
      win_rate: this.calculateWinRate(),
      last_updated: this.portfolio.lastUpdated
    };
  }

  // Execute a trade and update balances
  async executeTrade(tradeData) {
    const { pair, side, amount, price, dex = '1inch' } = tradeData;
    
    // Parse pair (e.g., "ETH/USDT" -> base: "ethereum", quote: "usdt")
    const [baseSymbol, quoteSymbol] = pair.split('/');
    const baseToken = this.symbolToTokenId(baseSymbol);
    const quoteToken = this.symbolToTokenId(quoteSymbol);
    
    const totalCost = amount * price;
    const fee = totalCost * 0.003; // 0.3% fee
    
    // Create trade record
    const trade = {
      id: Date.now(),
      pair,
      side,
      amount,
      price,
      totalCost,
      fee,
      dex,
      status: 'completed',
      createdAt: new Date().toISOString(),
      executedAt: new Date().toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}` // Mock tx hash
    };

    try {
      if (side === 'buy') {
        // Check if we have enough quote token (usually USDT)
        const quoteBalance = this.balances[quoteToken] || 0;
        const totalRequired = totalCost + fee;
        
        if (quoteBalance < totalRequired) {
          throw new Error(`Insufficient ${quoteSymbol} balance. Required: ${totalRequired}, Available: ${quoteBalance}`);
        }

        // Execute buy: decrease quote token, increase base token
        this.balances[quoteToken] = (this.balances[quoteToken] || 0) - totalRequired;
        this.balances[baseToken] = (this.balances[baseToken] || 0) + amount;
        
      } else if (side === 'sell') {
        // Check if we have enough base token
        const baseBalance = this.balances[baseToken] || 0;
        
        if (baseBalance < amount) {
          throw new Error(`Insufficient ${baseSymbol} balance. Required: ${amount}, Available: ${baseBalance}`);
        }

        // Execute sell: decrease base token, increase quote token
        this.balances[baseToken] = (this.balances[baseToken] || 0) - amount;
        this.balances[quoteToken] = (this.balances[quoteToken] || 0) + (totalCost - fee);
      }

      // Save trade and updated balances
      this.trades.push(trade);
      await Promise.all([
        this.saveTrades(),
        this.saveBalances()
      ]);

      console.log(`✅ Trade executed: ${side} ${amount} ${baseSymbol} at ${price} ${quoteSymbol}`);
      return trade;

    } catch (error) {
      trade.status = 'failed';
      trade.error = error.message;
      this.trades.push(trade);
      await this.saveTrades();
      throw error;
    }
  }

  // Helper methods
  symbolToTokenId(symbol) {
    const mapping = {
      'ETH': 'ethereum',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'USDT': 'usdt',
      'USDC': 'usdc',
      'BTC': 'bitcoin'
    };
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  getActiveTrades() {
    return this.trades.filter(trade => trade.status === 'pending');
  }

  calculateDailyPnL() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = this.trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt);
      return tradeDate >= today && trade.status === 'completed';
    });

    return todayTrades.reduce((pnl, trade) => {
      // Simple calculation: assume profit/loss based on trade direction
      const tradePnL = trade.side === 'buy' ? -trade.fee : trade.totalCost * 0.02; // Mock 2% profit on sells
      return pnl + tradePnL;
    }, 0);
  }

  calculateWinRate() {
    const completedTrades = this.trades.filter(trade => trade.status === 'completed');
    if (completedTrades.length === 0) return 0;

    // Mock win rate calculation - in real system, would track actual P&L per trade
    const winningTrades = completedTrades.filter(trade => {
      // Simple heuristic: sells are usually profitable, buys are entries
      return trade.side === 'sell';
    });

    return (winningTrades.length / completedTrades.length) * 100;
  }

  // Get portfolio summary
  getPortfolioSummary() {
    return {
      ...this.portfolio,
      totalTrades: this.trades.length,
      activeTrades: this.getActiveTrades().length,
      completedTrades: this.trades.filter(t => t.status === 'completed').length,
      failedTrades: this.trades.filter(t => t.status === 'failed').length
    };
  }

  // Get recent trades
  getRecentTrades(limit = 10) {
    return this.trades
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  // Get balances
  getBalances() {
    return { ...this.balances };
  }

  // Update balance (for manual adjustments)
  async updateBalance(tokenId, amount) {
    this.balances[tokenId] = amount;
    await this.saveBalances();
  }

  // Add funds (simulate deposit)
  async addFunds(tokenId, amount) {
    this.balances[tokenId] = (this.balances[tokenId] || 0) + amount;
    await this.saveBalances();
    
    console.log(`💰 Added ${amount} ${tokenId.toUpperCase()} to portfolio`);
  }
}

module.exports = RealPortfolioManager;

