const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview data
 * @access  Private
 */
router.get('/overview', (req, res) => {
    try {
        // Mock dashboard data
        const overview = {
            portfolio: {
                totalValue: 1250.75,
                totalPnL: 250.75,
                totalPnLPercent: 25.08,
                dayChange: 45.32,
                dayChangePercent: 3.76
            },
            trading: {
                totalTrades: 127,
                successfulTrades: 89,
                winRate: 70.08,
                totalVolume: 15420.50,
                avgTradeSize: 121.42
            },
            positions: [
                {
                    pair: 'ETH/USDC',
                    amount: 2.5,
                    value: 6250.00,
                    pnl: 312.50,
                    pnlPercent: 5.26,
                    dex: '1inch'
                },
                {
                    pair: 'SOL/USDC',
                    amount: 15.0,
                    value: 3750.00,
                    pnl: -125.00,
                    pnlPercent: -3.23,
                    dex: 'Jupiter'
                }
            ],
            recentTrades: [
                {
                    id: 1,
                    pair: 'BNB/USDT',
                    side: 'buy',
                    amount: 5.0,
                    price: 310.50,
                    status: 'completed',
                    timestamp: new Date(Date.now() - 300000).toISOString(),
                    dex: 'PancakeSwap'
                },
                {
                    id: 2,
                    pair: 'MATIC/USDC',
                    side: 'sell',
                    amount: 100.0,
                    price: 0.85,
                    status: 'completed',
                    timestamp: new Date(Date.now() - 600000).toISOString(),
                    dex: '1inch'
                }
            ],
            marketData: {
                totalMarketCap: 2.1e12,
                btcDominance: 42.5,
                ethDominance: 18.3,
                fearGreedIndex: 75,
                altseasonIndex: 82
            }
        };

        res.json({
            success: true,
            data: overview
        });
    } catch (error) {
        logger.error('Error getting dashboard overview:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting dashboard overview',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dashboard/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get('/performance', (req, res) => {
    try {
        const { period = '7d' } = req.query;
        
        // Mock performance data based on period
        const performanceData = generatePerformanceData(period);
        
        res.json({
            success: true,
            data: performanceData
        });
    } catch (error) {
        logger.error('Error getting performance data:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting performance data',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dashboard/dex-comparison
 * @desc    Get DEX performance comparison
 * @access  Private
 */
router.get('/dex-comparison', (req, res) => {
    try {
        const dexComparison = {
            dexs: [
                {
                    name: '1inch',
                    volume24h: 125000000,
                    trades: 45,
                    avgSlippage: 0.12,
                    avgGasCost: 25.50,
                    successRate: 98.5,
                    totalPnL: 1250.75
                },
                {
                    name: 'Uniswap',
                    volume24h: 89000000,
                    trades: 23,
                    avgSlippage: 0.18,
                    avgGasCost: 35.20,
                    successRate: 96.8,
                    totalPnL: 890.25
                },
                {
                    name: 'Jupiter',
                    volume24h: 67000000,
                    trades: 67,
                    avgSlippage: 0.08,
                    avgGasCost: 0.15,
                    successRate: 99.2,
                    totalPnL: 2150.50
                },
                {
                    name: 'PancakeSwap',
                    volume24h: 156000000,
                    trades: 34,
                    avgSlippage: 0.15,
                    avgGasCost: 0.85,
                    successRate: 97.1,
                    totalPnL: 675.30
                }
            ],
            summary: {
                bestPerformance: 'Jupiter',
                lowestCosts: 'Jupiter',
                highestVolume: 'PancakeSwap',
                mostTrades: 'Jupiter'
            }
        };

        res.json({
            success: true,
            data: dexComparison
        });
    } catch (error) {
        logger.error('Error getting DEX comparison:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting DEX comparison',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dashboard/market-overview
 * @desc    Get market overview data
 * @access  Private
 */
router.get('/market-overview', (req, res) => {
    try {
        const marketOverview = {
            indices: {
                fearGreed: {
                    value: 75,
                    label: 'Greed',
                    change: 5
                },
                altseason: {
                    value: 82,
                    label: 'Altseason Active',
                    change: 12
                },
                defiPulse: {
                    value: 156.7,
                    label: 'DeFi Pulse Index',
                    change: 8.5
                }
            },
            topGainers: [
                { symbol: 'SOL', price: 250.75, change: 15.2 },
                { symbol: 'AVAX', price: 89.50, change: 12.8 },
                { symbol: 'MATIC', price: 0.85, change: 9.5 }
            ],
            topLosers: [
                { symbol: 'ADA', price: 0.45, change: -5.2 },
                { symbol: 'DOT', price: 12.30, change: -3.8 },
                { symbol: 'LINK', price: 18.75, change: -2.1 }
            ],
            dexVolumes: [
                { name: 'Uniswap', volume: 2100000000, change: 5.2 },
                { name: '1inch', volume: 890000000, change: 12.8 },
                { name: 'PancakeSwap', volume: 756000000, change: -2.1 },
                { name: 'Jupiter', volume: 445000000, change: 25.6 }
            ]
        };

        res.json({
            success: true,
            data: marketOverview
        });
    } catch (error) {
        logger.error('Error getting market overview:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting market overview',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dashboard/alerts
 * @desc    Get active alerts and notifications
 * @access  Private
 */
router.get('/alerts', (req, res) => {
    try {
        const alerts = [
            {
                id: 1,
                type: 'success',
                title: 'Trade Executed',
                message: 'SOL/USDC buy order completed at $250.75',
                timestamp: new Date(Date.now() - 300000).toISOString(),
                read: false
            },
            {
                id: 2,
                type: 'warning',
                title: 'High Slippage Detected',
                message: 'ETH/USDC trade had 2.5% slippage on Uniswap',
                timestamp: new Date(Date.now() - 900000).toISOString(),
                read: false
            },
            {
                id: 3,
                type: 'info',
                title: 'Market Update',
                message: 'Altseason index increased to 82 (+12%)',
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                read: true
            }
        ];

        res.json({
            success: true,
            data: alerts
        });
    } catch (error) {
        logger.error('Error getting alerts:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting alerts',
            error: error.message
        });
    }
});

/**
 * Helper function to generate performance data
 */
function generatePerformanceData(period) {
    const periods = {
        '1d': { points: 24, interval: 'hour' },
        '7d': { points: 7, interval: 'day' },
        '30d': { points: 30, interval: 'day' },
        '90d': { points: 90, interval: 'day' }
    };

    const config = periods[period] || periods['7d'];
    const data = [];
    let baseValue = 1000;

    for (let i = 0; i < config.points; i++) {
        const change = (Math.random() - 0.5) * 50; // Random change between -25 and +25
        baseValue += change;
        
        data.push({
            timestamp: new Date(Date.now() - (config.points - i) * (period === '1d' ? 3600000 : 86400000)).toISOString(),
            value: Math.round(baseValue * 100) / 100,
            pnl: Math.round((baseValue - 1000) * 100) / 100,
            pnlPercent: Math.round(((baseValue - 1000) / 1000) * 10000) / 100
        });
    }

    return {
        period,
        data,
        summary: {
            startValue: data[0].value,
            endValue: data[data.length - 1].value,
            totalReturn: data[data.length - 1].pnl,
            totalReturnPercent: data[data.length - 1].pnlPercent,
            maxValue: Math.max(...data.map(d => d.value)),
            minValue: Math.min(...data.map(d => d.value))
        }
    };
}

module.exports = router;

