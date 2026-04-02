const { query, withTransaction } = require('../db');
const crypto = require('crypto');

const RETRY_DELAYS_MS = [
  5_000,      // 1st retry: 5s
  30_000,     // 2nd retry: 30s
  300_000,    // 3rd retry: 5 min
  1_800_000,  // 4th retry: 30 min
  3_600_000,  // 5th retry: 1 hour
];

// Sign webhook payload (HMAC-SHA256, Stripe-style)
function signPayload(secret, payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = `${timestamp}.${payload}`;
  const signature = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

// Deliver a single webhook event
async function deliverWebhookEvent(event, endpoint) {
  const payloadStr = JSON.stringify(event.payload);
  const signature = signPayload(endpoint.secret, payloadStr);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event.event_type,
        'X-Webhook-Delivery': event.id,
      },
      body: payloadStr,
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return { success: response.ok, statusCode: response.status, body: await response.text().catch(() => '') };
  } catch (err) {
    clearTimeout(timeout);
    return { success: false, statusCode: null, body: err.message };
  }
}

// Fire an event to all matching webhook endpoints for a merchant
async function fireEvent(merchantId, eventType, paymentData) {
  const endpoints = await query(
    `SELECT * FROM webhook_endpoints WHERE merchant_id = $1 AND is_active = TRUE AND $2 = ANY(events)`,
    [merchantId, eventType]
  );

  for (const endpoint of endpoints.rows) {
    const payload = {
      id: `evt_${Date.now()}`,
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: { object: paymentData },
    };

    const eventRes = await query(
      `INSERT INTO webhook_events (endpoint_id, payment_intent_id, event_type, payload, status, max_attempts)
       VALUES ($1,$2,$3,$4,'pending',$5) RETURNING *`,
      [endpoint.id, paymentData.id, eventType, JSON.stringify(payload), RETRY_DELAYS_MS.length + 1]
    );

    // Deliver immediately (async)
    processWebhookEvent(eventRes.rows[0], endpoint).catch(console.error);
  }
}

async function processWebhookEvent(event, endpoint) {
  const result = await deliverWebhookEvent(event, endpoint);
  const attempts = event.attempts + 1;

  if (result.success) {
    await query(
      `UPDATE webhook_events SET status='delivered', attempts=$1, last_response_code=$2, last_response_body=$3, delivered_at=NOW(), updated_at=NOW() WHERE id=$4`,
      [attempts, result.statusCode, result.body, event.id]
    );
    console.log(`✅ Webhook delivered: ${event.event_type} to ${endpoint.url}`);
  } else {
    const retryDelay = RETRY_DELAYS_MS[attempts - 1];
    if (retryDelay !== undefined) {
      const nextRetry = new Date(Date.now() + retryDelay);
      await query(
        `UPDATE webhook_events SET status='retrying', attempts=$1, last_response_code=$2, last_response_body=$3, next_retry_at=$4, updated_at=NOW() WHERE id=$5`,
        [attempts, result.statusCode, result.body, nextRetry, event.id]
      );
      console.log(`⏰ Webhook retry scheduled in ${retryDelay / 1000}s: ${event.event_type}`);

      setTimeout(() => retryWebhookEvent(event.id, endpoint).catch(console.error), retryDelay);
    } else {
      await query(
        `UPDATE webhook_events SET status='failed', attempts=$1, last_response_code=$2, last_response_body=$3, updated_at=NOW() WHERE id=$4`,
        [attempts, result.statusCode, result.body, event.id]
      );
      console.log(`❌ Webhook permanently failed after ${attempts} attempts: ${event.event_type}`);
    }
  }
}

async function retryWebhookEvent(eventId, endpoint) {
  const res = await query('SELECT * FROM webhook_events WHERE id = $1', [eventId]);
  if (!res.rows.length) return;
  const event = res.rows[0];
  if (event.status === 'delivered') return; // Already succeeded
  await processWebhookEvent(event, endpoint);
}

// Background poller: retry missed/stuck events on server restart
async function startRetryPoller() {
  setInterval(async () => {
    try {
      const stuckEvents = await query(
        `SELECT we.*, wep.url, wep.secret FROM webhook_events we
         JOIN webhook_endpoints wep ON wep.id = we.endpoint_id
         WHERE we.status IN ('pending','retrying') AND (we.next_retry_at IS NULL OR we.next_retry_at <= NOW())
         LIMIT 10`
      );

      for (const row of stuckEvents.rows) {
        const event = { id: row.id, attempts: row.attempts, payload: row.payload, event_type: row.event_type };
        const endpoint = { id: row.endpoint_id, url: row.url, secret: row.secret };
        processWebhookEvent(event, endpoint).catch(console.error);
      }
    } catch (err) {
      console.error('Retry poller error:', err);
    }
  }, 60_000); // Check every minute
}

module.exports = { fireEvent, startRetryPoller };
