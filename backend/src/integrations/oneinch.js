const axios = require('axios');
const logger = require('../utils/logger');

class OneInchIntegration {
    constructor() {
        this.apiKey = process.env.ONEINCH_API_KEY;
        this.baseURL = 'https://api.1inch.dev';
        this.version = 'v6.0';
        
        if (!this.apiKey) {
            throw new Error('1inch API key not found in environment variables');
        }

        this.client = axios.create({
            baseURL: `${this.baseURL}/${this.version}`,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                logger.info(`1inch API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                logger.error('1inch API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                logger.info(`1inch API Response: ${response.status} ${response.config.url}`);
                return response;
            },
            (error) => {
                logger.error('1inch API Response Error:', {
                    status: error.response?.status,
                    data: error.response?.data,
                    url: error.config?.url
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Get supported chains
     */
    async getSupportedChains() {
        try {
            const response = await this.client.get('/chains');
            return response.data;
        } catch (error) {
            logger.error('Error getting supported chains:', error);
            throw error;
        }
    }

    /**
     * Get quote for token swap
     */
    async getQuote(chainId, src, dst, amount, options = {}) {
        try {
            const params = {
                src,
                dst,
                amount,
                includeTokensInfo: true,
                includeProtocols: true,
                includeGas: true,
                ...options
            };

            const response = await this.client.get(`/${chainId}/quote`, { params });
            return response.data;
        } catch (error) {
            logger.error('Error getting quote:', error);
            throw error;
        }
    }

    /**
     * Get swap transaction data
     */
    async getSwap(chainId, src, dst, amount, from, options = {}) {
        try {
            const params = {
                src,
                dst,
                amount,
                from,
                slippage: options.slippage || 1,
                disableEstimate: false,
                allowPartialFill: true,
                ...options
            };

            const response = await this.client.get(`/${chainId}/swap`, { params });
            return response.data;
        } catch (error) {
            logger.error('Error getting swap data:', error);
            throw error;
        }
    }

    /**
     * Get token list for a chain
     */
    async getTokens(chainId) {
        try {
            const response = await this.client.get(`/${chainId}/tokens`);
            return response.data;
        } catch (error) {
            logger.error('Error getting tokens:', error);
            throw error;
        }
    }

    /**
     * Get token prices
     */
    async getTokenPrices(chainId, tokens, currency = 'USD') {
        try {
            const tokenAddresses = Array.isArray(tokens) ? tokens.join(',') : tokens;
            const params = {
                tokens: tokenAddresses,
                currency
            };

            const response = await this.client.get(`/${chainId}/tokens/prices`, { params });
            return response.data;
        } catch (error) {
            logger.error('Error getting token prices:', error);
            throw error;
        }
    }

    /**
     * Get liquidity sources
     */
    async getLiquiditySources(chainId) {
        try {
            const response = await this.client.get(`/${chainId}/liquidity-sources`);
            return response.data;
        } catch (error) {
            logger.error('Error getting liquidity sources:', error);
            throw error;
        }
    }

    /**
     * Get spender address for approvals
     */
    async getSpenderAddress(chainId) {
        try {
            const response = await this.client.get(`/${chainId}/approve/spender`);
            return response.data;
        } catch (error) {
            logger.error('Error getting spender address:', error);
            throw error;
        }
    }

    /**
     * Get approval transaction data
     */
    async getApprovalTx(chainId, tokenAddress, amount = null) {
        try {
            const params = {
                tokenAddress,
                ...(amount && { amount })
            };

            const response = await this.client.get(`/${chainId}/approve/transaction`, { params });
            return response.data;
        } catch (error) {
            logger.error('Error getting approval transaction:', error);
            throw error;
        }
    }

    /**
     * Health check for 1inch API
     */
    async healthCheck() {
        try {
            const response = await this.client.get('/healthcheck');
            return {
                status: 'healthy',
                data: response.data
            };
        } catch (error) {
            logger.error('1inch API health check failed:', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }

    /**
     * Get best route for multiple DEXs comparison
     */
    async getBestRoute(chainId, src, dst, amount, options = {}) {
        try {
            // Get quote first
            const quote = await this.getQuote(chainId, src, dst, amount, options);
            
            return {
                dex: '1inch',
                chainId,
                src,
                dst,
                amount,
                toAmount: quote.toAmount,
                estimatedGas: quote.gas,
                protocols: quote.protocols,
                price: parseFloat(quote.toAmount) / parseFloat(amount),
                priceImpact: this.calculatePriceImpact(quote),
                route: quote.protocols
            };
        } catch (error) {
            logger.error('Error getting best route:', error);
            throw error;
        }
    }

    /**
     * Calculate price impact from quote
     */
    calculatePriceImpact(quote) {
        // This is a simplified calculation
        // In production, you'd want more sophisticated price impact calculation
        if (quote.estimatedGas && quote.toAmount) {
            const gasInUSD = parseFloat(quote.estimatedGas) * 0.00001; // Rough estimate
            const outputInUSD = parseFloat(quote.toAmount) * 0.001; // Rough estimate
            return (gasInUSD / outputInUSD) * 100;
        }
        return 0;
    }

    /**
     * Format token amount based on decimals
     */
    formatTokenAmount(amount, decimals = 18) {
        return (parseFloat(amount) / Math.pow(10, decimals)).toString();
    }

    /**
     * Parse token amount to wei/smallest unit
     */
    parseTokenAmount(amount, decimals = 18) {
        return (parseFloat(amount) * Math.pow(10, decimals)).toString();
    }
}

module.exports = OneInchIntegration;

