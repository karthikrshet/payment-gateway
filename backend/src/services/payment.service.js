const { query, withTransaction } = require('../db');
const { v4: uuidv4 } = require('uuid');
const webhookService = require('../webhooks/service');

// State machine: allowed transitions
const ALLOWED_TRANSITIONS = {
  created: ['authorized', 'failed', 'cancelled'],
  authorized: ['captured', 'failed', 'cancelled'],
  captured: ['refunded'],
  refunded: [],
  failed: [],
  cancelled: [],
};

function canTransition(from, to) {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

async function createPaymentIntent({ merchantId, amount, currency, description, customerEmail, customerName, metadata, idempotencyKey }) {
  // Check idempotency key first (DB-level unique constraint handles this too)
  if (idempotencyKey) {
    const existing = await query(
      'SELECT * FROM payment_intents WHERE idempotency_key = $1 AND merchant_id = $2',
      [idempotencyKey, merchantId]
    );
    if (existing.rows.length) {
      console.log(`♻️  Idempotent response for key: ${idempotencyKey}`);
      return { data: existing.rows[0], idempotent: true };
    }
  }

  return withTransaction(async (client) => {
    const result = await client.query(
      `INSERT INTO payment_intents 
        (merchant_id, idempotency_key, amount, currency, description, customer_email, customer_name, metadata, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'created')
       RETURNING *`,
      [merchantId, idempotencyKey || null, amount, currency || 'INR', description, customerEmail, customerName, JSON.stringify(metadata || {})]
    );
    const intent = result.rows[0];

    await client.query(
      `INSERT INTO audit_logs (payment_intent_id, event, from_status, to_status) VALUES ($1,'payment.created',null,'created')`,
      [intent.id]
    );

    // Fire webhook async (don't await — non-blocking)
    webhookService.fireEvent(merchantId, 'payment.created', intent).catch(console.error);

    return { data: intent, idempotent: false };
  });
}

async function authorizePayment(paymentIntentId, merchantId) {
  return withTransaction(async (client) => {
    const res = await client.query(
      'SELECT * FROM payment_intents WHERE id = $1 AND merchant_id = $2 FOR UPDATE',
      [paymentIntentId, merchantId]
    );
    if (!res.rows.length) throw Object.assign(new Error('Payment intent not found'), { status: 404 });

    const intent = res.rows[0];
    if (!canTransition(intent.status, 'authorized')) {
      throw Object.assign(
        new Error(`Cannot authorize payment in status '${intent.status}'`),
        { status: 409 }
      );
    }

    // Simulate authorization (90% success rate)
    const authorized = Math.random() > 0.1;
    const newStatus = authorized ? 'authorized' : 'failed';
    const failureReason = authorized ? null : 'Insufficient funds (simulated)';

    const updated = await client.query(
      `UPDATE payment_intents SET status=$1, authorized_at=$2, failure_reason=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [newStatus, authorized ? new Date() : null, failureReason, paymentIntentId]
    );

    await client.query(
      `INSERT INTO audit_logs (payment_intent_id, event, from_status, to_status, metadata) 
       VALUES ($1,$2,$3,$4,$5)`,
      [paymentIntentId, `payment.${newStatus}`, intent.status, newStatus, JSON.stringify({ failureReason })]
    );

    const eventType = authorized ? 'payment.authorized' : 'payment.failed';
    webhookService.fireEvent(merchantId, eventType, updated.rows[0]).catch(console.error);

    return updated.rows[0];
  });
}

async function capturePayment(paymentIntentId, merchantId) {
  return withTransaction(async (client) => {
    const res = await client.query(
      'SELECT * FROM payment_intents WHERE id = $1 AND merchant_id = $2 FOR UPDATE',
      [paymentIntentId, merchantId]
    );
    if (!res.rows.length) throw Object.assign(new Error('Payment intent not found'), { status: 404 });

    const intent = res.rows[0];
    if (!canTransition(intent.status, 'captured')) {
      throw Object.assign(
        new Error(`Cannot capture payment in status '${intent.status}'`),
        { status: 409 }
      );
    }

    const updated = await client.query(
      `UPDATE payment_intents SET status='captured', captured_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [paymentIntentId]
    );

    await client.query(
      `INSERT INTO audit_logs (payment_intent_id, event, from_status, to_status) VALUES ($1,'payment.captured',$2,'captured')`,
      [paymentIntentId, intent.status]
    );

    webhookService.fireEvent(merchantId, 'payment.captured', updated.rows[0]).catch(console.error);

    return updated.rows[0];
  });
}

async function refundPayment(paymentIntentId, merchantId, { amount, reason } = {}) {
  return withTransaction(async (client) => {
    const res = await client.query(
      'SELECT * FROM payment_intents WHERE id = $1 AND merchant_id = $2 FOR UPDATE',
      [paymentIntentId, merchantId]
    );
    if (!res.rows.length) throw Object.assign(new Error('Payment intent not found'), { status: 404 });

    const intent = res.rows[0];
    if (!canTransition(intent.status, 'refunded')) {
      throw Object.assign(
        new Error(`Cannot refund payment in status '${intent.status}'`),
        { status: 409 }
      );
    }

    const refundAmount = amount || intent.amount;
    if (refundAmount > intent.amount) {
      throw Object.assign(new Error('Refund amount exceeds payment amount'), { status: 400 });
    }

    // Create refund record
    const refund = await client.query(
      `INSERT INTO refunds (payment_intent_id, amount, reason, status) VALUES ($1,$2,$3,'succeeded') RETURNING *`,
      [paymentIntentId, refundAmount, reason || 'requested_by_customer']
    );

    const updated = await client.query(
      `UPDATE payment_intents SET status='refunded', refunded_at=NOW(), updated_at=NOW()
       WHERE id=$1 RETURNING *`,
      [paymentIntentId]
    );

    await client.query(
      `INSERT INTO audit_logs (payment_intent_id, event, from_status, to_status, metadata) VALUES ($1,'payment.refunded',$2,'refunded',$3)`,
      [paymentIntentId, intent.status, JSON.stringify({ refundAmount, reason })]
    );

    webhookService.fireEvent(merchantId, 'payment.refunded', { ...updated.rows[0], refund: refund.rows[0] }).catch(console.error);

    return { payment: updated.rows[0], refund: refund.rows[0] };
  });
}

async function getPaymentIntent(id, merchantId) {
  const res = await query(
    `SELECT pi.*, 
       (SELECT json_agg(r.*) FROM refunds r WHERE r.payment_intent_id = pi.id) as refunds,
       (SELECT json_agg(al.* ORDER BY al.created_at) FROM audit_logs al WHERE al.payment_intent_id = pi.id) as audit_trail
     FROM payment_intents pi
     WHERE pi.id = $1 AND pi.merchant_id = $2`,
    [id, merchantId]
  );
  if (!res.rows.length) throw Object.assign(new Error('Payment intent not found'), { status: 404 });
  return res.rows[0];
}

async function listPaymentIntents(merchantId, { status, limit = 20, offset = 0 } = {}) {
  const conditions = ['merchant_id = $1'];
  const values = [merchantId];
  let idx = 2;

  if (status) {
    conditions.push(`status = $${idx++}`);
    values.push(status);
  }

  const where = conditions.join(' AND ');
  const [data, total] = await Promise.all([
    query(
      `SELECT * FROM payment_intents WHERE ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    ),
    query(`SELECT COUNT(*) FROM payment_intents WHERE ${where}`, values),
  ]);

  return {
    data: data.rows,
    total: parseInt(total.rows[0].count),
    limit: parseInt(limit),
    offset: parseInt(offset),
  };
}

async function getStats(merchantId) {
  const res = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'created') as created,
       COUNT(*) FILTER (WHERE status = 'authorized') as authorized,
       COUNT(*) FILTER (WHERE status = 'captured') as captured,
       COUNT(*) FILTER (WHERE status = 'refunded') as refunded,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       COUNT(*) as total,
       COALESCE(SUM(amount) FILTER (WHERE status = 'captured'), 0) as total_captured_amount,
       COALESCE(SUM(amount) FILTER (WHERE status = 'refunded'), 0) as total_refunded_amount
     FROM payment_intents
     WHERE merchant_id = $1`,
    [merchantId]
  );
  return res.rows[0];
}

module.exports = { createPaymentIntent, authorizePayment, capturePayment, refundPayment, getPaymentIntent, listPaymentIntents, getStats };
