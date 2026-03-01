# Verdant Energy Platform – Postman Testing Guide

## Base URLs

| Environment | URL |
|---|---|
| Local | `http://localhost:8000` |
| Deployed (Render) | `https://verdant-backend-wgq5.onrender.com` |

---

## Step 1 – Set Up Postman Environment

Create a Postman **Environment** called `Verdant` with these variables:

| Variable | Initial Value | Notes |
|---|---|---|
| `base_url` | `http://localhost:8000` | Switch to Render URL for production testing |
| `access_token` | *(empty)* | Auto-filled after login |
| `refresh_token` | *(empty)* | Auto-filled after login |
| `user_id` | *(empty)* | Auto-filled after login |
| `producer_id` | *(empty)* | Auto-filled after creating a producer |
| `listing_id` | *(empty)* | Auto-filled after creating a listing |
| `contract_id` | *(empty)* | Auto-filled after creating a contract |
| `payment_id` | *(empty)* | Auto-filled after initiating a payment |
| `certificate_id` | *(empty)* | Auto-filled after issuing a certificate |
| `dispute_id` | *(empty)* | Auto-filled after creating a dispute |

### Auto-Set Token – Login Test Script

After the **Login** request succeeds, paste this into the **Tests** tab:

```javascript
const body = pm.response.json();
pm.environment.set("access_token", body.access_token);
pm.environment.set("refresh_token", body.refresh_token);
```

### Authorization Header Template

For all authenticated endpoints, set:
- **Auth Type**: `Bearer Token`
- **Token**: `{{access_token}}`

---

## Step 2 – Health Check (No Auth)

### GET / – Root
```
GET {{base_url}}/
```
**Expected 200:**
```json
{ "message": "Welcome to Verdant Energy Platform", "docs": "/docs", "health": "/health" }
```

### GET /health – Service Health
```
GET {{base_url}}/health
```
**Expected 200:**
```json
{ "status": "healthy", "service": "Verdant Energy Platform", "version": "0.1.0" }
```

### GET /docs – Swagger UI *(local & staging only)*
```
GET {{base_url}}/docs
```
> **Note:** Docs are disabled when `ENVIRONMENT=production`. On Render the environment is now `staging`, so `/docs` works on the deployed URL too.

---

## Step 3 – Authentication (`/api/v1/auth`)

### 3.1 Register – POST /api/v1/auth/register

```
POST {{base_url}}/api/v1/auth/register
Content-Type: application/json
```
**Body:**
```json
{
  "email": "alice@verdant.test",
  "password": "StrongPass123!",
  "full_name": "Alice Green",
  "role": "producer"
}
```
> Role options: `consumer` | `producer` | `admin`

**Expected 201:**
```json
{
  "id": "6655aabbcc...",
  "email": "alice@verdant.test",
  "full_name": "Alice Green",
  "role": "producer",
  "is_active": true,
  "created_at": "2025-01-01T00:00:00Z"
}
```
**Save** the `id` as `{{user_id}}`.

---

### 3.2 Register Second User (Consumer)

```
POST {{base_url}}/api/v1/auth/register
Content-Type: application/json
```
```json
{
  "email": "bob@verdant.test",
  "password": "StrongPass123!",
  "full_name": "Bob Consumer",
  "role": "consumer"
}
```

---

### 3.3 Login – POST /api/v1/auth/login

```
POST {{base_url}}/api/v1/auth/login
Content-Type: application/json
```
```json
{
  "email": "alice@verdant.test",
  "password": "StrongPass123!"
}
```
**Expected 200:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "bearer"
}
```
**Tests script** (save tokens automatically):
```javascript
const body = pm.response.json();
pm.environment.set("access_token", body.access_token);
pm.environment.set("refresh_token", body.refresh_token);
```

**Error cases to test:**
- Wrong password → **401** `"Invalid credentials"`
- 5 failed attempts → **423** `"Account is temporarily locked"`

---

### 3.4 Get Current User – GET /api/v1/auth/me

```
GET {{base_url}}/api/v1/auth/me
Authorization: Bearer {{access_token}}
```
**Expected 200:** Returns the logged-in user object.

---

### 3.5 Refresh Token – POST /api/v1/auth/refresh

```
POST {{base_url}}/api/v1/auth/refresh
Content-Type: application/json
```
```json
{
  "refresh_token": "{{refresh_token}}"
}
```
**Expected 200:** New `access_token` and `refresh_token` pair.

---

### 3.6 Logout – POST /api/v1/auth/logout

```
POST {{base_url}}/api/v1/auth/logout
Authorization: Bearer {{access_token}}
```
**Expected 200:**
```json
{ "detail": "Successfully logged out" }
```
> Token is blacklisted – subsequent requests with the old token will return **401**.

---

### 3.7 Logout All Devices – POST /api/v1/auth/logout-all

```
POST {{base_url}}/api/v1/auth/logout-all
Authorization: Bearer {{access_token}}
```
**Expected 200:**
```json
{ "detail": "Successfully logged out from all devices" }
```

---

## Step 4 – Users (`/api/v1/users`)

### 4.1 Get User by ID – GET /api/v1/users/{user_id}

> **Admin only.** Register/login with `"role": "admin"` first.

```
GET {{base_url}}/api/v1/users/{{user_id}}
Authorization: Bearer {{access_token}}
```
**Expected 200:** Full user object.

---

## Step 5 – Marketplace (`/api/v1/marketplace`)

### 5.1 Create Producer Profile – POST /api/v1/marketplace/producers

> Must be logged in as a user with `producer` or `admin` role.

```
POST {{base_url}}/api/v1/marketplace/producers
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "company_name": "SolarEdge Gujarat",
  "description": "Rooftop solar energy from Ahmedabad district",
  "energy_sources": ["solar", "wind"],
  "capacity_kw": 500.0,
  "location": "Ahmedabad, Gujarat"
}
```
> `energy_sources` options: `solar` | `wind` | `hydro` | `biomass` | `geothermal`

**Expected 201:** Producer object with generated `id`.

**Tests script:**
```javascript
pm.environment.set("producer_id", pm.response.json().id);
```

---

### 5.2 List Producers – GET /api/v1/marketplace/producers

```
GET {{base_url}}/api/v1/marketplace/producers
GET {{base_url}}/api/v1/marketplace/producers?status=verified
GET {{base_url}}/api/v1/marketplace/producers?skip=0&limit=20
```
No auth required.

**Expected 200:**
```json
{ "total": 5, "items": [ ... ] }
```

---

### 5.3 Get Producer by ID – GET /api/v1/marketplace/producers/{producer_id}

```
GET {{base_url}}/api/v1/marketplace/producers/{{producer_id}}
```

---

### 5.4 Verify Producer – PATCH /api/v1/marketplace/producers/{producer_id}/verify

> **Admin only.**

```
PATCH {{base_url}}/api/v1/marketplace/producers/{{producer_id}}/verify
Authorization: Bearer {{access_token}}
```
No body required.

**Expected 200:** Producer with `"status": "verified"`.

---

### 5.5 Create Energy Listing – POST /api/v1/marketplace/listings

> You must own a producer profile. Use the `producer_id` from Step 5.1.

```
POST {{base_url}}/api/v1/marketplace/listings
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "producer_id": "{{producer_id}}",
  "title": "Gujarat Solar – 500 kWh Block",
  "description": "Premium rooftop solar from Ahmedabad. Day-time supply, 8AM–6PM.",
  "energy_source": "solar",
  "quantity_kwh": 500.0,
  "price_per_kwh": 4.50,
  "min_purchase_kwh": 50.0,
  "available_until": "2026-12-31T23:59:59Z"
}
```
**Expected 201:** Listing object.

**Tests script:**
```javascript
pm.environment.set("listing_id", pm.response.json().id);
```

---

### 5.6 Browse Listings – GET /api/v1/marketplace/listings

```
GET {{base_url}}/api/v1/marketplace/listings
GET {{base_url}}/api/v1/marketplace/listings?energy_source=solar
GET {{base_url}}/api/v1/marketplace/listings?status=active&limit=10
```
No auth required.

---

### 5.7 Get Listing by ID – GET /api/v1/marketplace/listings/{listing_id}

```
GET {{base_url}}/api/v1/marketplace/listings/{{listing_id}}
```

---

### 5.8 Buy Energy (Placeholder) – POST /api/v1/marketplace/buy

> This triggers the contract pipeline. Log in as a consumer first.

```
POST {{base_url}}/api/v1/marketplace/buy
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "listing_id": "{{listing_id}}",
  "quantity_kwh": 100.0
}
```

---

## Step 6 – Pricing (`/api/v1/pricing`)

### 6.1 Spot Price – GET /api/v1/pricing/spot

```
GET {{base_url}}/api/v1/pricing/spot?source=solar
GET {{base_url}}/api/v1/pricing/spot?source=wind
GET {{base_url}}/api/v1/pricing/spot?source=hydro
```
No auth required.

**Expected 200:**
```json
{
  "energy_source": "solar",
  "price_per_kwh": 4.32,
  "currency": "USD",
  "timestamp": "2025-01-01T12:00:00Z"
}
```

---

### 6.2 All Spot Prices – GET /api/v1/pricing/spot/all

```
GET {{base_url}}/api/v1/pricing/spot/all
```
Returns an array of prices for all 5 energy sources.

---

### 6.3 Historical Prices – GET /api/v1/pricing/historical

```
GET {{base_url}}/api/v1/pricing/historical?source=solar&hours=24&interval_minutes=15
GET {{base_url}}/api/v1/pricing/historical?source=wind&hours=48&interval_minutes=30
```
No auth required.

---

### 6.4 WebSocket Price Stream – ws/api/v1/pricing/ws/stream

In Postman:
1. New Request → **WebSocket Request**
2. URL: `ws://localhost:8000/api/v1/pricing/ws/stream`
3. Click **Connect**

Receives a JSON array of spot prices every 10 seconds:
```json
[
  { "energy_source": "solar", "price_per_kwh": 4.32, "currency": "USD", "timestamp": "..." },
  { "energy_source": "wind",  "price_per_kwh": 3.85, "currency": "USD", "timestamp": "..." }
]
```

---

## Step 7 – Contracts (`/api/v1/contracts`)

> **Prerequisites:** Have a valid `buyer_id` and `producer_id` (24-char hex ObjectIds).

### 7.1 Create Contract – POST /api/v1/contracts

```
POST {{base_url}}/api/v1/contracts
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "buyer_id": "{{user_id}}",
  "producer_id": "{{producer_id}}",
  "listing_id": "{{listing_id}}",
  "volume_kwh": 100.0,
  "price_per_kwh": 4.50,
  "contract_type": "spot"
}
```
> `contract_type` options: `spot` | `forward` | `futures`

**Expected 201:** Contract with `contract_hash` (SHA-256 fingerprint) and `"status": "pending"`.

**Tests script:**
```javascript
pm.environment.set("contract_id", pm.response.json().id);
```

---

### 7.2 List Contracts – GET /api/v1/contracts

```
GET {{base_url}}/api/v1/contracts
GET {{base_url}}/api/v1/contracts?buyer_id={{user_id}}
GET {{base_url}}/api/v1/contracts?status=pending
Authorization: Bearer {{access_token}}
```

---

### 7.3 Get Contract – GET /api/v1/contracts/{contract_id}

```
GET {{base_url}}/api/v1/contracts/{{contract_id}}
Authorization: Bearer {{access_token}}
```

---

### 7.4 Sign Contract – POST /api/v1/contracts/{contract_id}/sign

```
POST {{base_url}}/api/v1/contracts/{{contract_id}}/sign
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "signer_role": "buyer",
  "signature": "buyer-digital-signature-hash"
}
```
> Call twice: once with `"signer_role": "buyer"`, once with `"signer_role": "producer"`.
> Contract status becomes `active` after both sign.

---

### 7.5 Settle Contract – POST /api/v1/contracts/{contract_id}/settle

```
POST {{base_url}}/api/v1/contracts/{{contract_id}}/settle
Authorization: Bearer {{access_token}}
```
No body. Contract must be in `active` status. Returns contract with `"status": "settled"`.

---

### 7.6 Dispute Contract – POST /api/v1/contracts/{contract_id}/dispute

```
POST {{base_url}}/api/v1/contracts/{{contract_id}}/dispute
Authorization: Bearer {{access_token}}
```
No body. Marks contract as `disputed`.

---

## Step 8 – Payments (`/api/v1/payments`)

### 8.1 Initiate Payment – POST /api/v1/payments

> Contract must be in `pending` or `active` state.

```
POST {{base_url}}/api/v1/payments
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "contract_id": "{{contract_id}}",
  "amount_eur": 450.00
}
```
**Expected 201:** Payment object with `escrow_lock: true` and a `TXN-XXXX` reference.

**Tests script:**
```javascript
pm.environment.set("payment_id", pm.response.json().id);
```

---

### 8.2 List Payments – GET /api/v1/payments

```
GET {{base_url}}/api/v1/payments
GET {{base_url}}/api/v1/payments?contract_id={{contract_id}}
GET {{base_url}}/api/v1/payments?status=pending
Authorization: Bearer {{access_token}}
```

---

### 8.3 Get Payment – GET /api/v1/payments/{payment_id}

```
GET {{base_url}}/api/v1/payments/{{payment_id}}
Authorization: Bearer {{access_token}}
```

---

### 8.4 Payment Webhook (Simulated) – POST /api/v1/payments/webhook

> Simulates an external payment provider callback.

```
POST {{base_url}}/api/v1/payments/webhook
Content-Type: application/json
```
```json
{
  "payment_id": "{{payment_id}}",
  "status": "completed",
  "transaction_ref": "EXT-TXN-ABC123"
}
```
> `status` options: `completed` | `failed` | `refunded`

---

### 8.5 Settlement Payout – POST /api/v1/payments/{contract_id}/settle

```
POST {{base_url}}/api/v1/payments/{{contract_id}}/settle
Authorization: Bearer {{access_token}}
```
No body. Simulates final payout to producer after settlement.

---

## Step 9 – Certificates (`/api/v1/certificates`)

> **Prerequisite:** Contract must first be **settled** (Step 7.5).

### 9.1 Issue Certificate – POST /api/v1/certificates

```
POST {{base_url}}/api/v1/certificates
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "contract_id": "{{contract_id}}",
  "energy_source": "solar",
  "validity_days": 365
}
```
**Expected 201:** Certificate with SHA-256 `certificate_hash` and `valid: true`.

**Tests script:**
```javascript
pm.environment.set("certificate_id", pm.response.json().id);
```

---

### 9.2 List Certificates – GET /api/v1/certificates

```
GET {{base_url}}/api/v1/certificates
GET {{base_url}}/api/v1/certificates?producer_id={{producer_id}}
GET {{base_url}}/api/v1/certificates?valid_only=true
Authorization: Bearer {{access_token}}
```

---

### 9.3 Get Certificate – GET /api/v1/certificates/{certificate_id}

```
GET {{base_url}}/api/v1/certificates/{{certificate_id}}
Authorization: Bearer {{access_token}}
```

---

### 9.4 Verify Certificate – POST /api/v1/certificates/{certificate_id}/verify

> Public endpoint – no auth required. Anyone can verify a certificate.

```
POST {{base_url}}/api/v1/certificates/{{certificate_id}}/verify
```
**Expected 200:**
```json
{
  "certificate_id": "...",
  "valid": true,
  "hash_match": true,
  "not_expired": true,
  "message": "Certificate is valid and unaltered"
}
```

---

## Step 10 – Smart Meters (`/api/v1/meters`)

### 10.1 Ingest Single Reading – POST /api/v1/meters/readings

```
POST {{base_url}}/api/v1/meters/readings
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "device_id": "DEVICE-001",
  "producer_id": "{{producer_id}}",
  "reading_kwh": 1234.56,
  "timestamp": "2025-06-01T08:00:00Z"
}
```
**Expected 201:** Reading with anomaly detection result (`status: "valid"` or `"anomaly"`).

**Anomaly test cases:**
```json
{ "reading_kwh": -10.0, ... }               // "negative reading"
{ "reading_kwh": 100.0, ... }               // (after 1234.56) → "meter rollback"
{ "reading_kwh": 20000.0, ... }             // "sudden jump"
```

---

### 10.2 Batch Ingest – POST /api/v1/meters/readings/batch

```
POST {{base_url}}/api/v1/meters/readings/batch
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "readings": [
    { "device_id": "DEVICE-001", "producer_id": "{{producer_id}}", "reading_kwh": 1240.0 },
    { "device_id": "DEVICE-001", "producer_id": "{{producer_id}}", "reading_kwh": 1245.5 },
    { "device_id": "DEVICE-002", "producer_id": "{{producer_id}}", "reading_kwh": 800.0 }
  ]
}
```

---

### 10.3 List Readings – GET /api/v1/meters/readings

```
GET {{base_url}}/api/v1/meters/readings
GET {{base_url}}/api/v1/meters/readings?device_id=DEVICE-001
GET {{base_url}}/api/v1/meters/readings?status=anomaly&limit=50
Authorization: Bearer {{access_token}}
```

---

### 10.4 Anomaly Report – GET /api/v1/meters/anomalies/{device_id}

```
GET {{base_url}}/api/v1/meters/anomalies/DEVICE-001
Authorization: Bearer {{access_token}}
```
Returns a report with total readings, anomaly count, and per-reason breakdown.

---

## Step 11 – Disputes (`/api/v1/disputes`)

### 11.1 Create Dispute – POST /api/v1/disputes

```
POST {{base_url}}/api/v1/disputes
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "contract_id": "{{contract_id}}",
  "description": "Energy delivery below contracted volume. Expected 100 kWh, received 72 kWh per meter logs."
}
```
**Expected 201:** Dispute ticket with `"status": "open"` and audit trail.

**Tests script:**
```javascript
pm.environment.set("dispute_id", pm.response.json().id);
```

---

### 11.2 List Disputes – GET /api/v1/disputes

```
GET {{base_url}}/api/v1/disputes
GET {{base_url}}/api/v1/disputes?contract_id={{contract_id}}
GET {{base_url}}/api/v1/disputes?status=open
Authorization: Bearer {{access_token}}
```

---

### 11.3 Get Dispute – GET /api/v1/disputes/{dispute_id}

```
GET {{base_url}}/api/v1/disputes/{{dispute_id}}
Authorization: Bearer {{access_token}}
```

---

### 11.4 Add Evidence – POST /api/v1/disputes/{dispute_id}/evidence

```
POST {{base_url}}/api/v1/disputes/{{dispute_id}}/evidence
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "evidence_type": "meter_reading",
  "description": "Smart meter log showing 72 kWh delivery on 2025-06-01",
  "url": "https://storage.verdant.io/evidence/meter-log-001.pdf"
}
```

---

### 11.5 Resolve Dispute – POST /api/v1/disputes/{dispute_id}/resolve

> **Admin only.**

```
POST {{base_url}}/api/v1/disputes/{{dispute_id}}/resolve
Authorization: Bearer {{access_token}}
Content-Type: application/json
```
```json
{
  "resolution": "resolved_producer",
  "note": "Meter logs confirmed under-delivery. Partial refund of ₹2,800 issued to buyer."
}
```
> `resolution` options: `resolved_buyer` | `resolved_producer` | `resolved_mutual`

---

## Step 12 – Carbon Analytics (`/api/v1/analytics`)

### 12.1 CO₂ Avoided – GET /api/v1/analytics/co2/{contract_id}

```
GET {{base_url}}/api/v1/analytics/co2/{{contract_id}}
Authorization: Bearer {{access_token}}
```
**Expected 200:**
```json
{
  "contract_id": "...",
  "volume_kwh": 100.0,
  "energy_source": "solar",
  "baseline_factor_kg_per_kwh": 0.45,
  "co2_avoided_kg": 45.0,
  "co2_avoided_tonnes": 0.045
}
```

---

### 12.2 Monthly Analytics – GET /api/v1/analytics/monthly

```
GET {{base_url}}/api/v1/analytics/monthly?year=2025
GET {{base_url}}/api/v1/analytics/monthly?year=2025&month=6
GET {{base_url}}/api/v1/analytics/monthly?year=2025&producer_id={{producer_id}}
Authorization: Bearer {{access_token}}
```

---

### 12.3 Dashboard Summary – GET /api/v1/analytics/dashboard

```
GET {{base_url}}/api/v1/analytics/dashboard
GET {{base_url}}/api/v1/analytics/dashboard?producer_id={{producer_id}}
Authorization: Bearer {{access_token}}
```

---

### 12.4 Producer Performance – GET /api/v1/analytics/producers/performance

```
GET {{base_url}}/api/v1/analytics/producers/performance?top_n=10
Authorization: Bearer {{access_token}}
```

---

## Step 13 – AI Services (`/api/v1/ai`)

> **Requires API keys** set in `.env`:
> - `GROQ_API_KEY` – for chat assistant (primary)
> - `GEMINI_API_KEY` – for analytics & fallback
> - `SARVAM_API_KEY` – for Indian language voice

### 13.1 AI Health Check – GET /api/v1/ai/health

```
GET {{base_url}}/api/v1/ai/health
```
Shows which AI backends are available:
```json
{
  "status": "healthy",
  "services": {
    "assistant": { "groq": true, "gemini": false },
    "analytics": { "gemini": false },
    "voice": { "sarvam": false }
  }
}
```

---

### 13.2 Chat with AI – POST /api/v1/ai/chat

```
POST {{base_url}}/api/v1/ai/chat
Content-Type: application/json
```
```json
{
  "user_id": "{{user_id}}",
  "message": "What is the best time to buy solar energy on the platform?",
  "context": {
    "current_page": "marketplace",
    "user_role": "consumer"
  },
  "use_history": true
}
```

---

### 13.3 Clear Chat History – POST /api/v1/ai/chat/clear

```
POST {{base_url}}/api/v1/ai/chat/clear?user_id={{user_id}}
```

---

### 13.4 Energy Tip – GET /api/v1/ai/tip

```
GET {{base_url}}/api/v1/ai/tip
```

---

### 13.5 Explain Concept – POST /api/v1/ai/explain

```
POST {{base_url}}/api/v1/ai/explain
Content-Type: application/json
```
```json
{ "concept": "Renewable Energy Certificate (REC)" }
```

---

### 13.6 Analyze Consumption – POST /api/v1/ai/analytics/consumption

```
POST {{base_url}}/api/v1/ai/analytics/consumption
Content-Type: application/json
```
```json
{
  "readings": [
    { "timestamp": "2025-06-01T08:00:00Z", "kwh": 12.5 },
    { "timestamp": "2025-06-01T10:00:00Z", "kwh": 18.2 },
    { "timestamp": "2025-06-01T14:00:00Z", "kwh": 22.8 }
  ],
  "user_profile": {
    "type": "residential",
    "location": "Mumbai"
  }
}
```

---

### 13.7 Predict Energy Price – POST /api/v1/ai/analytics/predict-price

```
POST {{base_url}}/api/v1/ai/analytics/predict-price
Content-Type: application/json
```
```json
{
  "energy_type": "solar",
  "current_price": 4.50,
  "historical_prices": [4.20, 4.35, 4.50, 4.45, 4.60]
}
```

---

### 13.8 Sustainability Score – POST /api/v1/ai/analytics/sustainability

```
POST {{base_url}}/api/v1/ai/analytics/sustainability
Content-Type: application/json
```
```json
{
  "total_consumption_kwh": 500.0,
  "green_energy_kwh": 350.0,
  "certificates_owned": 3
}
```

---

### 13.9 AI Recommendations – POST /api/v1/ai/analytics/recommendations

```
POST {{base_url}}/api/v1/ai/analytics/recommendations
Content-Type: application/json
```
```json
{
  "user_preferences": {
    "budget_inr_per_kwh": 5.0,
    "min_capacity_kw": 100,
    "preferred_source": "solar"
  },
  "available_producers": [
    { "id": "{{producer_id}}", "name": "SolarEdge Gujarat", "price": 4.50, "capacity_kw": 500 }
  ],
  "limit": 3
}
```

---

### 13.10 Text-to-Speech – POST /api/v1/ai/voice/speak

> Requires `SARVAM_API_KEY`

```
POST {{base_url}}/api/v1/ai/voice/speak
Content-Type: application/json
```
```json
{
  "text": "आपका सौर ऊर्जा अनुबंध सफलतापूर्वक बनाया गया है।",
  "language": "hi-IN",
  "speaker": "Priya"
}
```
> Language codes: `hi-IN` | `en-IN` | `bn-IN` | `gu-IN` | `kn-IN` | `ml-IN` | `mr-IN` | `ta-IN` | `te-IN`
> Speakers: `Aditya` | `Rahul` | `Rohan` | `Shubh` | `Priya` | `Ritu` | `Neha` | `Pooja` | `Simran` | `Kavya`

---

### 13.11 Speak Notification – POST /api/v1/ai/voice/notification

```
POST {{base_url}}/api/v1/ai/voice/notification
Content-Type: application/json
```
```json
{
  "notification_type": "contract_created",
  "language": "hi-IN",
  "params": { "amount": "450", "producer": "SolarEdge Gujarat" }
}
```
> Types: `welcome` | `contract_created` | `payment_success` | `price_alert` | `certificate_earned` | `daily_summary`

---

### 13.12 List Languages – GET /api/v1/ai/voice/languages

```
GET {{base_url}}/api/v1/ai/voice/languages
```

---

### 13.13 Available AI Models – GET /api/v1/ai/models

```
GET {{base_url}}/api/v1/ai/models
```

---

## Step 14 – End-to-End Happy Path Flow

Follow these steps in order for a complete integration test:

```
1.  POST /auth/register          → Create producer user (Alice)
2.  POST /auth/register          → Create consumer user (Bob)
3.  POST /auth/login (Alice)     → Get Alice's access_token
4.  POST /marketplace/producers  → Create producer profile     [save producer_id]
5.  POST /marketplace/listings   → Create energy listing        [save listing_id]
6.  POST /auth/login (Bob)       → Get Bob's access_token
7.  POST /contracts              → Create contract              [save contract_id]
8.  POST /contracts/{id}/sign    → Bob signs (buyer)
9.  POST /auth/login (Alice)     → Get Alice's token
10. POST /contracts/{id}/sign    → Alice signs (producer)
11. POST /payments               → Bob initiates payment        [save payment_id]
12. POST /payments/webhook       → Simulate payment completed
13. POST /contracts/{id}/settle  → Settle contract
14. POST /certificates           → Issue green certificate      [save certificate_id]
15. POST /certificates/{id}/verify → Verify certificate integrity
16. GET /analytics/co2/{id}      → Calculate CO₂ avoided
17. GET /analytics/dashboard     → View full carbon dashboard
```

---

## Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK – Request successful |
| 201 | Created – Resource created |
| 400 | Bad Request – Invalid input |
| 401 | Unauthorized – Missing or expired token |
| 403 | Forbidden – Insufficient role |
| 404 | Not Found – Resource doesn't exist |
| 409 | Conflict – Duplicate resource |
| 413 | Payload Too Large – Body > 1 MB |
| 422 | Unprocessable Entity – Validation error (e.g. bad ObjectId) |
| 423 | Locked – Account temporarily locked |
| 429 | Too Many Requests – Rate limit exceeded (60 req/min) |
| 500 | Internal Server Error – Unexpected backend error |
| 503 | Service Unavailable – Upstream service (AI/Neo4j) down |

---

## Rate Limiting

- **Limit**: 60 requests/minute per IP (local) · 120/min (Render staging)
- **Headers returned**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- On breach: **429** `{ "detail": "Rate limit exceeded. Try again in X seconds." }`

---

## Security Notes

- All endpoints except `/health`, `/`, `/auth/register`, `/auth/login`, `/pricing/spot*`, `/marketplace/listings`, `/marketplace/producers` require `Authorization: Bearer <token>`
- Tokens expire in 30 minutes – use `POST /auth/refresh` to rotate
- After 5 failed logins, account is locked for 15 minutes
- Verify certificates at `POST /certificates/{id}/verify` without auth – public tamper-proof endpoint

---

## Importing into Postman

You can generate a Postman collection automatically from the live OpenAPI spec:

1. Open Postman → **Import**
2. Select **Link** tab
3. Paste: `http://localhost:8000/openapi.json` (or `https://verdant-backend-wgq5.onrender.com/openapi.json`)
4. Postman will auto-create all routes with correct methods, URLs, and schemas
