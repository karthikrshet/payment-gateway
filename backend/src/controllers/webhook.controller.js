const crypto = require('crypto');
const { query } = require('../db');

async function registerEndpoint(req, res, next) {
  try {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    try { new URL(url); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

    const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;
    const defaultEvents = ['payment.created', 'payment.authorized', 'payment.captured', 'payment.refunded', 'payment.failed'];

    const result = await query(
      `INSERT INTO webhook_endpoints (merchant_id, url, events, secret) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, url, events || defaultEvents, secret]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

async function listEndpoints(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM webhook_endpoints WHERE merchant_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function deleteEndpoint(req, res, next) {
  try {
    const result = await query(
      'DELETE FROM webhook_endpoints WHERE id = $1 AND merchant_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Endpoint not found' });
    res.json({ message: 'Endpoint deleted' });
  } catch (err) {
    next(err);
  }
}

async function listEvents(req, res, next) {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const conditions = ['wep.merchant_id = $1'];
    const values = [req.user.id];
    let idx = 2;

    if (status) { conditions.push(`we.status = $${idx++}`); values.push(status); }

    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT we.*, wep.url as endpoint_url
       FROM webhook_events we
       JOIN webhook_endpoints wep ON wep.id = we.endpoint_id
       WHERE ${where}
       ORDER BY we.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

async function retryEvent(req, res, next) {
  try {
    const result = await query(
      `SELECT we.*, wep.url, wep.secret FROM webhook_events we
       JOIN webhook_endpoints wep ON wep.id = we.endpoint_id
       WHERE we.id = $1 AND wep.merchant_id = $2`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });

    const row = result.rows[0];
    await query(`UPDATE webhook_events SET status='pending', next_retry_at=NOW(), updated_at=NOW() WHERE id=$1`, [row.id]);

    res.json({ message: 'Retry scheduled' });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerEndpoint, listEndpoints, deleteEndpoint, listEvents, retryEvent };
