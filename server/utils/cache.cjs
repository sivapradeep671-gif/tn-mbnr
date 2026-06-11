/**
 * API Caching Layer (In-Memory Fallback to Redis)
 * Fulfills Section 3: API Caching for frequently accessed registry endpoints.
 */

const logger = require('./logger.cjs');

// In a real production environment, this would integrate with a Redis client.
// We use a robust in-memory Map for the prototype to avoid complex Redis infrastructure setups.
const cacheStore = new Map();

const DEFAULT_TTL = 60 * 5; // 5 minutes in seconds

/**
 * Middleware to cache GET requests.
 * Speeds up response times for public directories and map data.
 */
function apiCache(duration = DEFAULT_TTL) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;
    const cachedResponse = cacheStore.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      res.setHeader('X-Cache-Status', 'HIT');
      logger.info(`Cache HIT for ${key}`);
      return res.json(cachedResponse.data);
    } else {
      // Clear expired
      if (cachedResponse) cacheStore.delete(key);
      
      res.setHeader('X-Cache-Status', 'MISS');
      logger.info(`Cache MISS for ${key}`);
      
      // Monkey-patch res.json to capture the outgoing data
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        cacheStore.set(key, {
          data: body,
          expiry: Date.now() + (duration * 1000)
        });
        return originalJson(body);
      };
      
      next();
    }
  };
}

/**
 * Invalidates specific cache keys when mutations occur.
 */
function invalidateCache(endpointPrefix) {
  for (const key of cacheStore.keys()) {
    if (key.includes(endpointPrefix)) {
      cacheStore.delete(key);
    }
  }
}

module.exports = {
  apiCache,
  invalidateCache
};
