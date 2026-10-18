require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./db');
const routes = require('./routes');
const { errorHandler, requestLogger } = require('./middleware');
const { startRetryPoller } = require('./webhooks/service');

const app = express();
app.set('trust proxy', 1); 
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    startRetryPoller();
    app.listen(PORT, () => {
      console.log(`\n🚀 Payment Gateway API running on http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:3000`);
      console.log(`📖 API Base: http://localhost:${PORT}/api\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
