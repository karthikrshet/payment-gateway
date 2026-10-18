const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { idempotencyMiddleware } = require('../middleware');
const authCtrl = require('../controllers/auth.controller');
const paymentCtrl = require('../controllers/payment.controller');
const webhookCtrl = require('../controllers/webhook.controller');

// ── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);

// ── Payments ─────────────────────────────────────────────────────────────────
router.get('/payments/stats', authenticate, paymentCtrl.getStats);
router.get('/payments', authenticate, paymentCtrl.listPaymentIntents);
router.post('/payments', authenticate, idempotencyMiddleware, paymentCtrl.createPaymentIntent);
router.get('/payments/:id', authenticate, paymentCtrl.getPaymentIntent);
router.post('/payments/:id/authorize', authenticate, paymentCtrl.authorizePayment);
router.post('/payments/:id/capture', authenticate, paymentCtrl.capturePayment);
router.post('/payments/:id/refund', authenticate, paymentCtrl.refundPayment);

// ── Webhooks ─────────────────────────────────────────────────────────────────
router.get('/webhooks/endpoints', authenticate, webhookCtrl.listEndpoints);
router.post('/webhooks/endpoints', authenticate, webhookCtrl.registerEndpoint);
router.delete('/webhooks/endpoints/:id', authenticate, webhookCtrl.deleteEndpoint);
router.get('/webhooks/events', authenticate, webhookCtrl.listEvents);
router.post('/webhooks/events/:id/retry', authenticate, webhookCtrl.retryEvent);

const { query } = require('../db');

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const start = Date.now();
    await query('SELECT 1');
    const latency = Date.now() - start;
    res.json({
      status: 'ok',
      database: 'connected',
      dbLatencyMs: latency,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
