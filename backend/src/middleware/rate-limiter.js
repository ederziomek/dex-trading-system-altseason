/**
 * Rate Limiting Middleware for DEX Trading System
 * Protects APIs from abuse and implements intelligent caching
 */

class RateLimiter {
  constructor() {
    // Store for tracking requests per IP/user
    this.requests = new Map();
    this.blockedIPs = new Set();
    
    // Rate limiting rules
    this.rules = {
      // General API endpoints
      general: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100,
        message: 'Too many requests, please try again later'
      },
      
      // Trading endpoints (more restrictive)
      trading: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 10,
        message: 'Too many trading requests, please wait before trading again'
      },
      
      // Authentication endpoints
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5,
        message: 'Too many login attempts, please try again in 15 minutes'
      },
      
      // Market data endpoints (less restrictive, cached)
      market: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200,
        message: 'Too many market data requests'
      }
    };
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
    
    console.log('✅ Rate Limiter initialized');
  }

  // Get client identifier (IP + User ID if available)
  getClientId(req) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }

  // Check if request should be rate limited
  shouldLimit(clientId, rule) {
    const now = Date.now();
    const windowStart = now - rule.windowMs;
    
    if (!this.requests.has(clientId)) {
      this.requests.set(clientId, []);
    }
    
    const clientRequests = this.requests.get(clientId);
    
    // Remove old requests outside the window
    const validRequests = clientRequests.filter(timestamp => timestamp > windowStart);
    this.requests.set(clientId, validRequests);
    
    // Check if limit exceeded
    if (validRequests.length >= rule.maxRequests) {
      return true;
    }
    
    // Add current request
    validRequests.push(now);
    return false;
  }

  // Create rate limiting middleware for specific rule
  createMiddleware(ruleType = 'general') {
    return (req, res, next) => {
      const clientId = this.getClientId(req);
      const rule = this.rules[ruleType];
      
      // Check if IP is blocked
      const ip = req.ip || req.connection.remoteAddress;
      if (this.blockedIPs.has(ip)) {
        return res.status(429).json({
          success: false,
          message: 'IP temporarily blocked due to excessive requests',
          retryAfter: 3600 // 1 hour
        });
      }
      
      // Check rate limit
      if (this.shouldLimit(clientId, rule)) {
        // Log potential abuse
        console.warn(`⚠️ Rate limit exceeded for ${clientId} on ${ruleType} endpoints`);
        
        // Block IP if too many violations
        this.checkForAbuse(clientId, ip);
        
        return res.status(429).json({
          success: false,
          message: rule.message,
          retryAfter: Math.ceil(rule.windowMs / 1000)
        });
      }
      
      // Add rate limit headers
      const clientRequests = this.requests.get(clientId) || [];
      const remaining = Math.max(0, rule.maxRequests - clientRequests.length);
      const resetTime = Math.ceil((Date.now() + rule.windowMs) / 1000);
      
      res.set({
        'X-RateLimit-Limit': rule.maxRequests,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': resetTime
      });
      
      next();
    };
  }

  // Check for abuse patterns and block if necessary
  checkForAbuse(clientId, ip) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    // Count violations in the last hour
    const clientRequests = this.requests.get(clientId) || [];
    const recentRequests = clientRequests.filter(timestamp => timestamp > (now - oneHour));
    
    // If more than 500 requests in an hour, block the IP
    if (recentRequests.length > 500) {
      this.blockedIPs.add(ip);
      console.warn(`🚫 IP ${ip} blocked for excessive requests`);
      
      // Unblock after 1 hour
      setTimeout(() => {
        this.blockedIPs.delete(ip);
        console.log(`✅ IP ${ip} unblocked`);
      }, oneHour);
    }
  }

  // Cleanup old entries
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [clientId, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > (now - maxAge));
      
      if (validRequests.length === 0) {
        this.requests.delete(clientId);
      } else {
        this.requests.set(clientId, validRequests);
      }
    }
    
    console.log(`🧹 Rate limiter cleanup: ${this.requests.size} active clients`);
  }

  // Get statistics
  getStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    let totalRequests = 0;
    let activeClients = 0;
    
    for (const [clientId, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(timestamp => timestamp > (now - oneHour));
      if (recentRequests.length > 0) {
        activeClients++;
        totalRequests += recentRequests.length;
      }
    }
    
    return {
      activeClients,
      totalRequestsLastHour: totalRequests,
      blockedIPs: this.blockedIPs.size,
      averageRequestsPerClient: activeClients > 0 ? Math.round(totalRequests / activeClients) : 0
    };
  }

  // Manual IP blocking/unblocking
  blockIP(ip, duration = 3600000) { // Default 1 hour
    this.blockedIPs.add(ip);
    console.log(`🚫 Manually blocked IP: ${ip}`);
    
    if (duration > 0) {
      setTimeout(() => {
        this.blockedIPs.delete(ip);
        console.log(`✅ Manually unblocked IP: ${ip}`);
      }, duration);
    }
  }

  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    console.log(`✅ Manually unblocked IP: ${ip}`);
  }

  // Reset limits for a client (admin function)
  resetClient(clientId) {
    this.requests.delete(clientId);
    console.log(`🔄 Reset rate limits for client: ${clientId}`);
  }
}

// Enhanced API Cache for market data
class APICache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 60000; // 1 minute default
    
    // Different TTL for different data types
    this.ttlRules = {
      'market-prices': 30000,      // 30 seconds for prices
      'global-market': 300000,     // 5 minutes for global data
      'trending': 600000,          // 10 minutes for trending
      'portfolio': 10000,          // 10 seconds for portfolio
      'trades': 5000               // 5 seconds for trades
    };
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
    
    console.log('✅ API Cache initialized');
  }

  // Generate cache key
  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return paramString ? `${prefix}:${paramString}` : prefix;
  }

  // Get from cache
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  // Set cache entry
  set(key, data, ttl = null) {
    // Determine TTL based on key prefix
    if (!ttl) {
      const prefix = key.split(':')[0];
      ttl = this.ttlRules[prefix] || this.defaultTTL;
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      created: Date.now()
    });
  }

  // Cache middleware
  middleware(keyPrefix, ttl = null) {
    return (req, res, next) => {
      const cacheKey = this.generateKey(keyPrefix, req.query);
      const cached = this.get(cacheKey);
      
      if (cached) {
        // Add cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });
        
        return res.json(cached);
      }
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to cache response
      res.json = (data) => {
        if (res.statusCode === 200 && data.success) {
          this.set(cacheKey, data, ttl);
        }
        
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey
        });
        
        return originalJson.call(res, data);
      };
      
      next();
    };
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 API Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalEntries = 0;
    let expiredEntries = 0;
    const typeStats = {};
    
    for (const [key, entry] of this.cache.entries()) {
      totalEntries++;
      
      if (now > entry.expires) {
        expiredEntries++;
      }
      
      const type = key.split(':')[0];
      typeStats[type] = (typeStats[type] || 0) + 1;
    }
    
    return {
      totalEntries,
      expiredEntries,
      activeEntries: totalEntries - expiredEntries,
      typeBreakdown: typeStats,
      memoryUsage: this.cache.size
    };
  }

  // Clear cache (admin function)
  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      console.log('🗑️ Cache cleared completely');
      return;
    }
    
    let cleared = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    console.log(`🗑️ Cache cleared: ${cleared} entries matching "${pattern}"`);
  }
}

module.exports = {
  RateLimiter,
  APICache
};

