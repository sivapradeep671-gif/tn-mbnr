// TN-MBNR Server Idempotency Middleware
// Prevents duplicate execution of critical mutations during offline sync retry

const processedKeys = new Map(); // Key -> { status, body, headers, timestamp }
const TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

// Periodically clean up expired keys
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of processedKeys.entries()) {
        if (now - record.timestamp > TTL_MS) {
            processedKeys.delete(key);
        }
    }
}, 60 * 60 * 1000);

const idempotencyMiddleware = (req, res, next) => {
    // Only apply idempotency checking to mutation operations (POST, PUT, DELETE, PATCH)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const idempotencyKey = req.headers['x-idempotency-key'] || req.headers['idempotency-key'];
    if (!idempotencyKey) {
        return next();
    }

    if (processedKeys.has(idempotencyKey)) {
        const cached = processedKeys.get(idempotencyKey);
        res.setHeader('X-Cache-Lookup', 'IDEMPOTENT_REPLAY');
        return res.status(cached.status).json(cached.body);
    }

    // Capture response for caching
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            processedKeys.set(idempotencyKey, {
                status: res.statusCode,
                body,
                timestamp: Date.now()
            });
        }
        return originalJson(body);
    };

    next();
};

module.exports = { idempotencyMiddleware };
