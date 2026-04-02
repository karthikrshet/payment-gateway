# 💳 PayGateway — Stripe-Inspired Payment Gateway

> Built by **Karthik Rajesh Shet** · MCA Graduate · Bengaluru

A full-stack, production-grade payment gateway simulation replicating how Stripe works under the hood — idempotent APIs, payment lifecycle state machine, webhook delivery with retry logic, and a beautiful React dashboard.

---

## 🏗️ Architecture

```
payment-gateway/
├── backend/                   # Node.js + Express API
│   └── src/
│       ├── controllers/       # HTTP handlers
│       │   ├── auth.controller.js
│       │   ├── payment.controller.js
│       │   └── webhook.controller.js
│       ├── services/
│       │   └── payment.service.js   # Core business logic + state machine
│       ├── webhooks/
│       │   └── service.js           # Delivery engine + retry scheduler
│       ├── middleware/
│       │   ├── auth.js              # JWT + API Key auth
│       │   └── index.js             # Idempotency + error handler
│       ├── db/
│       │   ├── index.js             # pg Pool + transaction helpers
│       │   └── schema.sql           # All tables + indexes
│       ├── routes/index.js
│       └── index.js                 # Express app entry
│
└── frontend/                  # React + Tailwind CSS
    └── src/
        ├── pages/
        │   ├── AuthPage.jsx          # Login / Register
        │   ├── DashboardPage.jsx     # Stats + charts
        │   ├── PaymentsPage.jsx      # List + create payments
        │   ├── PaymentDetailPage.jsx # Lifecycle controls + audit trail
        │   ├── WebhooksPage.jsx      # Endpoints + event log
        │   └── APIKeysPage.jsx       # Keys + cURL examples
        ├── components/dashboard/
        │   ├── Sidebar.jsx
        │   └── UIComponents.jsx
        ├── hooks/useAuth.js
        └── utils/api.js
```

---

## ⚡ Key Features

### 1. Payment Lifecycle State Machine
```
created → authorized → captured → refunded
                  ↘ failed
```
- Strict state transitions enforced server-side with `FOR UPDATE` row locking
- 90% simulated authorization success rate (10% failure = realistic testing)

### 2. Idempotent APIs
- `Idempotency-Key` header prevents duplicate charges on retry
- Checked at **both** DB level (UNIQUE constraint) and application level
- Returns cached response instantly for duplicate requests

### 3. Webhook Delivery with Retry Logic
- Events fired async (non-blocking) on every state transition
- **Retry schedule**: 5s → 30s → 5min → 30min → 1hr
- **HMAC-SHA256 signature** (Stripe-style): `X-Webhook-Signature: t={ts},v1={sig}`
- Background poller recovers missed events on server restart

### 4. PostgreSQL Transactions
- All state changes wrapped in transactions (`BEGIN/COMMIT/ROLLBACK`)
- Audit log records every status transition
- Referential integrity with foreign keys

---

## 🚀 Getting Started

### Option A: Docker (Recommended)
```bash
git clone <your-repo>
cd payment-gateway
docker-compose up --build
```
- Frontend → http://localhost:3000
- Backend API → http://localhost:5000/api

### Option B: Local Development

**Prerequisites:** Node.js 18+, PostgreSQL 14+

**Backend:**
```bash
cd backend
cp .env.example .env        # Edit DB credentials
npm install
npm run dev                 # Starts on port 5000
```

**Frontend:**
```bash
cd frontend
npm install
npm start                   # Starts on port 3000
```

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create merchant account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/auth/me` | Current user info |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Create payment intent |
| GET | `/api/payments` | List payments (filterable) |
| GET | `/api/payments/:id` | Get payment + audit trail |
| POST | `/api/payments/:id/authorize` | Authorize payment |
| POST | `/api/payments/:id/capture` | Capture authorized payment |
| POST | `/api/payments/:id/refund` | Issue refund |
| GET | `/api/payments/stats` | Dashboard stats |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/endpoints` | Register endpoint |
| GET | `/api/webhooks/endpoints` | List endpoints |
| DELETE | `/api/webhooks/endpoints/:id` | Remove endpoint |
| GET | `/api/webhooks/events` | Event delivery log |
| POST | `/api/webhooks/events/:id/retry` | Manual retry |

---

## 🔐 Authentication

Two methods supported:

```bash
# API Key (server-to-server)
curl -H "X-Api-Key: pk_yourkey..."

# JWT Bearer (session / UI)
curl -H "Authorization: Bearer eyJ..."
```

---

## 🧪 Testing the Full Lifecycle

```bash
# 1. Register
curl -X POST /api/auth/register -d '{"name":"Test","email":"test@test.com","password":"password123"}'

# 2. Create payment (with idempotency key)
curl -X POST /api/payments \
  -H "Idempotency-Key: test-key-001" \
  -d '{"amount": 100000, "currency": "INR", "customer_name": "Karthik"}'

# 3. Authorize → Capture → Refund
curl -X POST /api/payments/{id}/authorize
curl -X POST /api/payments/{id}/capture
curl -X POST /api/payments/{id}/refund -d '{"reason": "customer_request"}'
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | PostgreSQL (pg pool, transactions) |
| Auth | JWT + HMAC-SHA256 |
| Frontend | React 18, React Router v6 |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Containerization | Docker, Docker Compose |

---

*Built as part of Karthik Rajesh Shet's portfolio — demonstrating distributed systems, payment infrastructure, and full-stack engineering.*
