const paymentService = require('../services/payment.service');

async function createPaymentIntent(req, res, next) {
  try {
    const { amount, currency, description, customer_email, customer_name, metadata } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'amount must be a positive integer (in paise)' });
    }

    const { data, idempotent } = await paymentService.createPaymentIntent({
      merchantId: req.user.id,
      amount: parseInt(amount),
      currency,
      description,
      customerEmail: customer_email,
      customerName: customer_name,
      metadata,
      idempotencyKey,
    });

    res.status(idempotent ? 200 : 201).json({
      ...data,
      _idempotent: idempotent,
    });
  } catch (err) {
    next(err);
  }
}

async function authorizePayment(req, res, next) {
  try {
    const intent = await paymentService.authorizePayment(req.params.id, req.user.id);
    res.json(intent);
  } catch (err) {
    next(err);
  }
}

async function capturePayment(req, res, next) {
  try {
    const intent = await paymentService.capturePayment(req.params.id, req.user.id);
    res.json(intent);
  } catch (err) {
    next(err);
  }
}

async function refundPayment(req, res, next) {
  try {
    const result = await paymentService.refundPayment(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getPaymentIntent(req, res, next) {
  try {
    const intent = await paymentService.getPaymentIntent(req.params.id, req.user.id);
    res.json(intent);
  } catch (err) {
    next(err);
  }
}

async function listPaymentIntents(req, res, next) {
  try {
    const { status, limit, offset } = req.query;
    const result = await paymentService.listPaymentIntents(req.user.id, { status, limit, offset });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const stats = await paymentService.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = { createPaymentIntent, authorizePayment, capturePayment, refundPayment, getPaymentIntent, listPaymentIntents, getStats };
