const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const OneInchIntegration = require('../integrations/oneinch');

// Initialize 1inch integration
const oneinch = new OneInchIntegration();

/**
 * @route   GET /api/dex/health
 * @desc    Check DEX integrations health
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        const oneinchHealth = await oneinch.healthCheck();
        
        const health = {
            timestamp: new Date().toISOString(),
            dexs: {
                oneinch: oneinchHealth
            },
            overall: oneinchHealth.status === 'healthy' ? 'healthy' : 'degraded'
        };

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('DEX health check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking DEX health',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/chains
 * @desc    Get supported blockchain networks
 * @access  Public
 */
router.get('/chains', async (req, res) => {
    try {
        const chains = await oneinch.getSupportedChains();
        
        res.json({
            success: true,
            data: chains
        });
    } catch (error) {
        logger.error('Error getting supported chains:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting supported chains',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/tokens/:chainId
 * @desc    Get tokens for a specific chain
 * @access  Public
 */
router.get('/tokens/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const tokens = await oneinch.getTokens(chainId);
        
        res.json({
            success: true,
            data: tokens
        });
    } catch (error) {
        logger.error('Error getting tokens:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting tokens',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/quote
 * @desc    Get quote for token swap
 * @access  Public
 */
router.get('/quote', async (req, res) => {
    try {
        const { chainId, src, dst, amount, slippage } = req.query;
        
        // Validate required parameters
        if (!chainId || !src || !dst || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: chainId, src, dst, amount'
            });
        }

        const options = {};
        if (slippage) options.slippage = parseFloat(slippage);

        const quote = await oneinch.getQuote(chainId, src, dst, amount, options);
        
        res.json({
            success: true,
            data: quote
        });
    } catch (error) {
        logger.error('Error getting quote:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting quote',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/swap
 * @desc    Get swap transaction data
 * @access  Public
 */
router.get('/swap', async (req, res) => {
    try {
        const { chainId, src, dst, amount, from, slippage } = req.query;
        
        // Validate required parameters
        if (!chainId || !src || !dst || !amount || !from) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: chainId, src, dst, amount, from'
            });
        }

        const options = {};
        if (slippage) options.slippage = parseFloat(slippage);

        const swap = await oneinch.getSwap(chainId, src, dst, amount, from, options);
        
        res.json({
            success: true,
            data: swap
        });
    } catch (error) {
        logger.error('Error getting swap data:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting swap data',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/prices/:chainId
 * @desc    Get token prices
 * @access  Public
 */
router.get('/prices/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { tokens, currency } = req.query;
        
        if (!tokens) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: tokens'
            });
        }

        const prices = await oneinch.getTokenPrices(chainId, tokens, currency);
        
        res.json({
            success: true,
            data: prices
        });
    } catch (error) {
        logger.error('Error getting token prices:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting token prices',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/liquidity/:chainId
 * @desc    Get liquidity sources for a chain
 * @access  Public
 */
router.get('/liquidity/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const liquiditySources = await oneinch.getLiquiditySources(chainId);
        
        res.json({
            success: true,
            data: liquiditySources
        });
    } catch (error) {
        logger.error('Error getting liquidity sources:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting liquidity sources',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/spender/:chainId
 * @desc    Get spender address for token approvals
 * @access  Public
 */
router.get('/spender/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const spender = await oneinch.getSpenderAddress(chainId);
        
        res.json({
            success: true,
            data: spender
        });
    } catch (error) {
        logger.error('Error getting spender address:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting spender address',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/approve/:chainId
 * @desc    Get approval transaction data
 * @access  Public
 */
router.get('/approve/:chainId', async (req, res) => {
    try {
        const { chainId } = req.params;
        const { tokenAddress, amount } = req.query;
        
        if (!tokenAddress) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: tokenAddress'
            });
        }

        const approval = await oneinch.getApprovalTx(chainId, tokenAddress, amount);
        
        res.json({
            success: true,
            data: approval
        });
    } catch (error) {
        logger.error('Error getting approval transaction:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting approval transaction',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dex/best-route
 * @desc    Get best route across multiple DEXs
 * @access  Public
 */
router.get('/best-route', async (req, res) => {
    try {
        const { chainId, src, dst, amount, slippage } = req.query;
        
        // Validate required parameters
        if (!chainId || !src || !dst || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: chainId, src, dst, amount'
            });
        }

        const options = {};
        if (slippage) options.slippage = parseFloat(slippage);

        const route = await oneinch.getBestRoute(chainId, src, dst, amount, options);
        
        res.json({
            success: true,
            data: route
        });
    } catch (error) {
        logger.error('Error getting best route:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting best route',
            error: error.message
        });
    }
});

module.exports = router;

