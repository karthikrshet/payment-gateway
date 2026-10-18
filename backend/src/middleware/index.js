// Global error handler
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.code === '23505') { // Postgres unique violation
    return res.status(409).json({ error: 'Duplicate resource', detail: err.detail });
  }
  if (err.code === '23503') { // Foreign key violation
    return res.status(400).json({ error: 'Referenced resource not found' });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Idempotency key cache (in-memory for dev; use Redis in production)
const idempotencyCache = new Map();

const idempotencyMiddleware = (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // Idempotency key is optional

  if (idempotencyCache.has(key)) {
    const cached = idempotencyCache.get(key);
    console.log(`♻️  Returning cached response for idempotency key: ${key}`);
    return res.status(cached.status).json(cached.body);
  }

  // Intercept response to cache it
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 500) {
      idempotencyCache.set(key, { status: res.statusCode, body });
      // Clear cache entry after 24 hours
      setTimeout(() => idempotencyCache.delete(key), 24 * 60 * 60 * 1000);
    }
    return originalJson(body);
  };

  next();
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

module.exports = { errorHandler, idempotencyMiddleware, requestLogger };
