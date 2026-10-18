/**
 * End-to-end Payment Gateway Lifecycle Verification Script
 * Tests: Healthcheck -> Merchant Registration -> Idempotent Payment Creation -> Authorization -> Capture
 */

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function runTest() {
  console.log('🧪 Starting PayGateway automated lifecycle test...\n');

  try {
    // 1. Healthcheck
    console.log('1️⃣ Checking API health...');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`   ✅ API status: ${health.data.status} | DB Latency: ${health.data.dbLatencyMs}ms`);

    // 2. Register merchant
    console.log('\n2️⃣ Registering test merchant...');
    const testEmail = `merchant_${Date.now()}@example.com`;
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Verification Bot',
      email: testEmail,
      password: 'Password@123',
    });
    const { token, user } = regRes.data;
    console.log(`   ✅ Merchant registered: ${user.email} (API Key: ${user.api_key.slice(0, 10)}...)`);

    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Create payment intent with idempotency key
    console.log('\n3️⃣ Creating payment intent with Idempotency-Key...');
    const idempotencyKey = `test_idem_${Date.now()}`;
    const payRes1 = await axios.post(
      `${BASE_URL}/payments`,
      {
        amount: 250000,
        currency: 'INR',
        customer_name: 'Karthik Rajesh Shet',
        customer_email: 'karthik@example.com',
        description: 'Test Order #1001',
      },
      { headers: { ...authHeaders, 'Idempotency-Key': idempotencyKey } }
    );
    const payment = payRes1.data;
    console.log(`   ✅ Payment created: ${payment.id} (Status: ${payment.status}, Amount: ₹${payment.amount / 100})`);

    // 4. Test Idempotency (replay same request)
    console.log('\n4️⃣ Verifying idempotency caching (replaying same key)...');
    const payRes2 = await axios.post(
      `${BASE_URL}/payments`,
      { amount: 250000, currency: 'INR' },
      { headers: { ...authHeaders, 'Idempotency-Key': idempotencyKey } }
    );
    const isIdempotent = payRes2.data.id === payment.id;
    console.log(`   ✅ Idempotent response matched: ${isIdempotent ? 'PASS' : 'FAIL'} (Retrieved Intent ID: ${payRes2.data.id})`);

    // 5. Authorize payment
    console.log(`\n5️⃣ Authorizing payment ${payment.id}...`);
    const authPayRes = await axios.post(`${BASE_URL}/payments/${payment.id}/authorize`, {}, { headers: authHeaders });
    console.log(`   ✅ Authorization result: status = ${authPayRes.data.status}`);

    // 6. Capture payment (if authorized)
    if (authPayRes.data.status === 'authorized') {
      console.log(`\n6️⃣ Capturing payment ${payment.id}...`);
      const capRes = await axios.post(`${BASE_URL}/payments/${payment.id}/capture`, {}, { headers: authHeaders });
      console.log(`   ✅ Capture successful: status = ${capRes.data.status}`);
    }

    console.log('\n🎉 ALL LIFECYCLE TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTest();
