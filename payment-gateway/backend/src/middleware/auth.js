const jwt = require('jsonwebtoken');
const { query } = require('../db');

// JWT Authentication (for dashboard/UI)
const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, email, name FROM users WHERE id = $1', [decoded.userId]);
    if (!result.rows.length) return res.status(401).json({ error: 'User not found' });
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// API Key Authentication (for programmatic/API access)
const authenticateAPIKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'Missing X-Api-Key header' });

  const result = await query('SELECT id, email, name FROM users WHERE api_key = $1', [apiKey]);
  if (!result.rows.length) return res.status(401).json({ error: 'Invalid API key' });

  req.user = result.rows[0];
  next();
};

// Flexible: accepts either JWT or API Key
const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey) return authenticateAPIKey(req, res, next);
  return authenticateJWT(req, res, next);
};

module.exports = { authenticate, authenticateJWT, authenticateAPIKey };
