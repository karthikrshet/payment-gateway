const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../db');

async function register(req, res, next) {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const apiKey = `pk_${crypto.randomBytes(24).toString('hex')}`;

    const result = await query(
      `INSERT INTO users (email, password_hash, name, api_key) VALUES ($1,$2,$3,$4) RETURNING id, email, name, api_key, created_at`,
      [email.toLowerCase(), passwordHash, name, apiKey]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, api_key: user.api_key } });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  const result = await query('SELECT id, email, name, api_key, created_at FROM users WHERE id = $1', [req.user.id]);
  res.json(result.rows[0]);
}

module.exports = { register, login, getMe };
