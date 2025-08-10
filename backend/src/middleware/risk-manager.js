/**
 * Risk Management System for DEX Trading
 * Implements safety controls and limits for trading operations
 */

class RiskManager {
  constructor(portfolioManager) {
    this.portfolioManager = portfolioManager;
    
    // Risk management rules
    this.rules = {
      // Maximum trade size as percentage of portfolio
      maxTradePercent: 10, // 10% of portfolio per trade
      
      // Maximum daily trading volume
      maxDailyVolumePercent: 50, // 50% of portfolio per day
      
      // Minimum balance requirements
      minUSDTBalance: 100, // Always keep at least $100 USDT
      
      // Maximum position size per token
      maxPositionPercent: 30, // Max 30% in any single token
      
      // Stop-loss settings
      stopLossPercent: 15, // 15% stop-loss
      
      // Maximum number of trades per hour
      maxTradesPerHour: 5,
      
      // Minimum time between trades (seconds)
      minTimeBetweenTrades: 60, // 1 minute
      
      // Maximum slippage tolerance
      maxSlippagePercent: 5, // 5% max slippage
      
      // Blacklisted tokens (high risk)
      blacklistedTokens: ['shib', 'doge', 'safemoon'],
      
      // Minimum trade size (to avoid dust trades)
      minTradeUSD: 10
    };
    
    // Track recent trades for rate limiting
    this.recentTrades = [];
    
    console.log('✅ Risk Manager initialized');
  }

  // Validate trade before execution
  async validateTrade(tradeData, marketPrices) {
    const { pair, side, amount, price } = tradeData;
    const [baseSymbol, quoteSymbol] = pair.split('/');
    const baseToken = this.portfolioManager.symbolToTokenId(baseSymbol);
    const quoteToken = this.portfolioManager.symbolToTokenId(quoteSymbol);
    
    const validationResults = {
      valid: true,
      warnings: [],
      errors: [],
      adjustments: {}
    };

    try {
      // Get current portfolio data
      const portfolioData = await this.portfolioManager.calculatePortfolioValue(marketPrices);
      const balances = this.portfolioManager.getBalances();
      
      // 1. Check blacklisted tokens
      if (this.rules.blacklistedTokens.includes(baseToken)) {
        validationResults.errors.push(`Token ${baseSymbol} is blacklisted for trading`);
        validationResults.valid = false;
      }

      // 2. Check minimum trade size
      const tradeValueUSD = amount * price;
      if (tradeValueUSD < this.rules.minTradeUSD) {
        validationResults.errors.push(`Trade size too small. Minimum: $${this.rules.minTradeUSD}`);
        validationResults.valid = false;
      }

      // 3. Check maximum trade size
      const maxTradeValue = portfolioData.totalValue * (this.rules.maxTradePercent / 100);
      if (tradeValueUSD > maxTradeValue) {
        validationResults.warnings.push(`Trade size exceeds ${this.rules.maxTradePercent}% of portfolio`);
        // Suggest adjustment
        const adjustedAmount = maxTradeValue / price;
        validationResults.adjustments.suggestedAmount = adjustedAmount;
      }

      // 4. Check daily volume limits
      const dailyVolume = this.calculateDailyVolume();
      const maxDailyVolume = portfolioData.totalValue * (this.rules.maxDailyVolumePercent / 100);
      if (dailyVolume + tradeValueUSD > maxDailyVolume) {
        validationResults.errors.push(`Daily volume limit exceeded. Limit: $${maxDailyVolume.toFixed(2)}`);
        validationResults.valid = false;
      }

      // 5. Check balance requirements
      if (side === 'buy') {
        const quoteBalance = balances[quoteToken] || 0;
        const totalCost = tradeValueUSD * 1.003; // Include 0.3% fee
        
        if (quoteBalance < totalCost) {
          validationResults.errors.push(`Insufficient ${quoteSymbol} balance. Required: ${totalCost.toFixed(2)}, Available: ${quoteBalance.toFixed(2)}`);
          validationResults.valid = false;
        }
        
        // Check if this would leave minimum USDT balance
        if (quoteToken === 'usdt' && (quoteBalance - totalCost) < this.rules.minUSDTBalance) {
          validationResults.warnings.push(`Trade would leave less than $${this.rules.minUSDTBalance} USDT`);
        }
        
      } else if (side === 'sell') {
        const baseBalance = balances[baseToken] || 0;
        
        if (baseBalance < amount) {
          validationResults.errors.push(`Insufficient ${baseSymbol} balance. Required: ${amount}, Available: ${baseBalance}`);
          validationResults.valid = false;
        }
      }

      // 6. Check position size limits
      if (side === 'buy') {
        const currentPosition = portfolioData.positions.find(p => p.tokenId === baseToken);
        const currentValue = currentPosition ? currentPosition.value : 0;
        const newPositionValue = currentValue + tradeValueUSD;
        const positionPercent = (newPositionValue / portfolioData.totalValue) * 100;
        
        if (positionPercent > this.rules.maxPositionPercent) {
          validationResults.warnings.push(`Position would exceed ${this.rules.maxPositionPercent}% of portfolio`);
        }
      }

      // 7. Check trade frequency
      const tradesLastHour = this.getTradesInLastHour();
      if (tradesLastHour >= this.rules.maxTradesPerHour) {
        validationResults.errors.push(`Maximum trades per hour exceeded (${this.rules.maxTradesPerHour})`);
        validationResults.valid = false;
      }

      // 8. Check minimum time between trades
      const lastTrade = this.getLastTrade();
      if (lastTrade) {
        const timeSinceLastTrade = (Date.now() - new Date(lastTrade.createdAt).getTime()) / 1000;
        if (timeSinceLastTrade < this.rules.minTimeBetweenTrades) {
          const waitTime = this.rules.minTimeBetweenTrades - timeSinceLastTrade;
          validationResults.errors.push(`Must wait ${waitTime.toFixed(0)} seconds before next trade`);
          validationResults.valid = false;
        }
      }

      // 9. Check price slippage
      const marketPrice = marketPrices[baseToken]?.usd;
      if (marketPrice) {
        const slippage = Math.abs((price - marketPrice) / marketPrice) * 100;
        if (slippage > this.rules.maxSlippagePercent) {
          validationResults.warnings.push(`High slippage detected: ${slippage.toFixed(2)}%`);
        }
      }

      // 10. Check for stop-loss triggers
      const stopLossChecks = this.checkStopLoss(portfolioData, marketPrices);
      if (stopLossChecks.length > 0) {
        validationResults.warnings.push(...stopLossChecks);
      }

    } catch (error) {
      validationResults.errors.push(`Risk validation error: ${error.message}`);
      validationResults.valid = false;
    }

    return validationResults;
  }

  // Calculate daily trading volume
  calculateDailyVolume() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = this.portfolioManager.trades.filter(trade => {
      const tradeDate = new Date(trade.createdAt);
      return tradeDate >= today && trade.status === 'completed';
    });

    return todayTrades.reduce((volume, trade) => volume + trade.totalCost, 0);
  }

  // Get trades in the last hour
  getTradesInLastHour() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    return this.portfolioManager.trades.filter(trade => {
      const tradeTime = new Date(trade.createdAt).getTime();
      return tradeTime > oneHourAgo;
    }).length;
  }

  // Get last trade
  getLastTrade() {
    const trades = this.portfolioManager.trades;
    if (trades.length === 0) return null;
    
    return trades.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  }

  // Check for stop-loss conditions
  checkStopLoss(portfolioData, marketPrices) {
    const warnings = [];
    
    for (const position of portfolioData.positions) {
      if (position.tokenId === 'usdt') continue;
      
      // Simple stop-loss check based on 24h change
      if (position.change_24h < -this.rules.stopLossPercent) {
        warnings.push(`${position.symbol} is down ${Math.abs(position.change_24h).toFixed(2)}% - consider stop-loss`);
      }
    }
    
    return warnings;
  }

  // Emergency stop-loss execution
  async executeEmergencyStopLoss(tokenId, marketPrices) {
    try {
      const balances = this.portfolioManager.getBalances();
      const balance = balances[tokenId];
      
      if (!balance || balance <= 0) {
        return { success: false, message: 'No balance to sell' };
      }
      
      const price = marketPrices[tokenId]?.usd;
      if (!price) {
        return { success: false, message: 'Price not available' };
      }
      
      const symbol = tokenId.toUpperCase();
      const tradeData = {
        pair: `${symbol}/USDT`,
        side: 'sell',
        amount: balance,
        price: price * 0.95, // 5% below market for quick execution
        emergency: true
      };
      
      const trade = await this.portfolioManager.executeTrade(tradeData);
      
      console.log(`🚨 Emergency stop-loss executed for ${symbol}: ${balance} @ $${price}`);
      
      return { success: true, trade };
      
    } catch (error) {
      console.error(`❌ Emergency stop-loss failed for ${tokenId}:`, error);
      return { success: false, message: error.message };
    }
  }

  // Portfolio health check
  async checkPortfolioHealth(marketPrices) {
    const portfolioData = await this.portfolioManager.calculatePortfolioValue(marketPrices);
    const health = {
      score: 100,
      issues: [],
      recommendations: []
    };

    // Check diversification
    const positions = portfolioData.positions.filter(p => p.tokenId !== 'usdt');
    if (positions.length < 3) {
      health.score -= 10;
      health.issues.push('Low diversification - consider adding more positions');
    }

    // Check for over-concentration
    for (const position of positions) {
      if (position.percentage > this.rules.maxPositionPercent) {
        health.score -= 15;
        health.issues.push(`Over-concentrated in ${position.symbol} (${position.percentage.toFixed(1)}%)`);
        health.recommendations.push(`Consider reducing ${position.symbol} position`);
      }
    }

    // Check cash reserves
    const usdtPosition = portfolioData.positions.find(p => p.tokenId === 'usdt');
    const cashPercent = usdtPosition ? usdtPosition.percentage : 0;
    
    if (cashPercent < 10) {
      health.score -= 10;
      health.issues.push('Low cash reserves - consider keeping more USDT');
    }

    // Check for declining positions
    const decliningPositions = positions.filter(p => p.change_24h < -10);
    if (decliningPositions.length > 0) {
      health.score -= 5 * decliningPositions.length;
      health.issues.push(`${decliningPositions.length} positions declining >10%`);
    }

    // Overall P&L check
    if (portfolioData.totalPnLPercent < -20) {
      health.score -= 20;
      health.issues.push('Portfolio down >20% - consider risk reduction');
    }

    return health;
  }

  // Update risk rules (admin function)
  updateRules(newRules) {
    this.rules = { ...this.rules, ...newRules };
    console.log('🔧 Risk management rules updated');
  }

  // Get risk statistics
  getRiskStats() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    const recentTrades = this.portfolioManager.trades.filter(trade => {
      const tradeTime = new Date(trade.createdAt).getTime();
      return tradeTime > (now - oneDay);
    });

    const dailyVolume = recentTrades.reduce((vol, trade) => vol + trade.totalCost, 0);
    const tradesLastHour = this.getTradesInLastHour();
    
    return {
      dailyVolume,
      dailyTrades: recentTrades.length,
      tradesLastHour,
      lastTradeTime: this.getLastTrade()?.createdAt,
      riskRules: this.rules
    };
  }
}

module.exports = RiskManager;

