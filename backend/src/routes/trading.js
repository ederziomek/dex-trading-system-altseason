const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock trading data
let trades = [];
let portfolio = {
    totalValue: 1000,
    totalPnL: 0,
    totalPnLPercent: 0,
    positions: []
};

/**
 * @route   GET /api/trading/portfolio
 * @desc    Get user portfolio
 * @access  Private
 */
router.get('/portfolio', (req, res) => {
    try {
        res.json({
            success: true,
            data: portfolio
        });
    } catch (error) {
        logger.error('Error getting portfolio:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting portfolio',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/trading/trades
 * @desc    Get trading history
 * @access  Private
 */
router.get('/trades', (req, res) => {
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
        logger.error('Error getting trades:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting trades',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/trading/execute
 * @desc    Execute a trade
 * @access  Private
 */
router.post('/execute', (req, res) => {
    try {
        const { 
            pair, 
            side, 
            amount, 
            price, 
            dex, 
            chainId, 
            slippage = 1 
        } = req.body;
        
        // Validate required fields
        if (!pair || !side || !amount || !dex || !chainId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: pair, side, amount, dex, chainId'
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
        
        // Simulate trade execution (in production, this would interact with actual DEX)
        setTimeout(() => {
            const trade = trades.find(t => t.id === newTrade.id);
            if (trade) {
                trade.status = 'completed';
                trade.txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
                trade.executedPrice = price || Math.random() * 1000;
                trade.executedAmount = amount * (1 - slippage / 100);
                trade.fees = amount * 0.003; // 0.3% fee
                trade.updatedAt = new Date().toISOString();
                
                // Update portfolio
                updatePortfolio(trade);
                
                // Emit WebSocket event
                const io = req.app.get('io');
                if (io) {
                    io.to('trading_data').emit('trade_executed', trade);
                    io.to('portfolio_updates').emit('portfolio_updated', portfolio);
                }
                
                logger.info(`Trade executed: ${trade.id} - ${trade.pair} ${trade.side} ${trade.amount}`);
            }
        }, 2000); // 2 second delay to simulate execution
        
        res.status(201).json({
            success: true,
            message: 'Trade submitted successfully',
            data: newTrade
        });
    } catch (error) {
        logger.error('Error executing trade:', error);
        res.status(500).json({
            success: false,
            message: 'Error executing trade',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/trading/trade/:id
 * @desc    Get specific trade details
 * @access  Private
 */
router.get('/trade/:id', (req, res) => {
    try {
        const { id } = req.params;
        const trade = trades.find(t => t.id === parseInt(id));
        
        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found'
            });
        }
        
        res.json({
            success: true,
            data: trade
        });
    } catch (error) {
        logger.error('Error getting trade:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting trade',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/trading/cancel/:id
 * @desc    Cancel a pending trade
 * @access  Private
 */
router.post('/cancel/:id', (req, res) => {
    try {
        const { id } = req.params;
        const trade = trades.find(t => t.id === parseInt(id));
        
        if (!trade) {
            return res.status(404).json({
                success: false,
                message: 'Trade not found'
            });
        }
        
        if (trade.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only cancel pending trades'
            });
        }
        
        trade.status = 'cancelled';
        trade.updatedAt = new Date().toISOString();
        
        logger.info(`Trade cancelled: ${trade.id}`);
        
        res.json({
            success: true,
            message: 'Trade cancelled successfully',
            data: trade
        });
    } catch (error) {
        logger.error('Error cancelling trade:', error);
        res.status(500).json({
            success: false,
            message: 'Error cancelling trade',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/trading/stats
 * @desc    Get trading statistics
 * @access  Private
 */
router.get('/stats', (req, res) => {
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
            winRate: calculateWinRate(completedTrades),
            profitLoss: portfolio.totalPnL,
            profitLossPercent: portfolio.totalPnLPercent
        };
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        logger.error('Error getting trading stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting trading stats',
            error: error.message
        });
    }
});

/**
 * Helper function to update portfolio
 */
function updatePortfolio(trade) {
    // Simplified portfolio update logic
    const pnl = (trade.executedPrice - (trade.price || trade.executedPrice)) * trade.executedAmount;
    portfolio.totalPnL += pnl;
    portfolio.totalPnLPercent = (portfolio.totalPnL / portfolio.totalValue) * 100;
    
    // Update or create position
    let position = portfolio.positions.find(p => p.pair === trade.pair);
    if (!position) {
        position = {
            pair: trade.pair,
            amount: 0,
            averagePrice: 0,
            unrealizedPnL: 0
        };
        portfolio.positions.push(position);
    }
    
    if (trade.side === 'buy') {
        const newAmount = position.amount + trade.executedAmount;
        position.averagePrice = ((position.averagePrice * position.amount) + (trade.executedPrice * trade.executedAmount)) / newAmount;
        position.amount = newAmount;
    } else {
        position.amount -= trade.executedAmount;
        if (position.amount <= 0) {
            portfolio.positions = portfolio.positions.filter(p => p.pair !== trade.pair);
        }
    }
}

/**
 * Helper function to calculate win rate
 */
function calculateWinRate(completedTrades) {
    if (completedTrades.length === 0) return 0;
    
    const winningTrades = completedTrades.filter(trade => {
        // Simplified win calculation
        return trade.executedPrice > (trade.price || trade.executedPrice);
    });
    
    return (winningTrades.length / completedTrades.length) * 100;
}

module.exports = router;

