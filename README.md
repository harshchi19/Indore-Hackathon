# Verdant Energy Platform — Comprehensive Project Report

> **App Name:** Verdant Energy Platform (branded as **GreenGrid** on frontend)
> **Version:** 0.1.0
> **Description:** Decentralised green-energy trading platform — India's premier peer-to-peer green energy marketplace
> **Stack:** FastAPI (Python 3.11) + React 18 + TypeScript + Vite + MongoDB + Redis + Neo4j

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [All Route Endpoints](#2-all-route-endpoints)
3. [All Service Capabilities](#3-all-service-capabilities)
4. [AI Features (Deep Dive)](#4-ai-features-deep-dive)
5. [Neo4j Graph Features (Deep Dive)](#5-neo4j-graph-features-deep-dive)
6. [Frontend Pages](#6-frontend-pages)
7. [Frontend Context, Hooks & Services](#7-frontend-context-hooks--services)
8. [Configuration Details](#8-configuration-details)
9. [Security Features](#9-security-features)
10. [Background Workers](#10-background-workers)
11. [Deployment Configuration](#11-deployment-configuration)
12. [Environment Variables](#12-environment-variables)
13. [Tech Stack Summary](#13-tech-stack-summary)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  Frontend (React + Vite + TypeScript)  →  Vercel                    │
│  ─ Tailwind CSS + shadcn/ui + Framer Motion + Recharts + Leaflet   │
│  ─ TanStack React Query for data fetching                           │
│  ─ Axios apiClient with JWT interceptors + auto-refresh             │
└────────────────────────┬─────────────────────────────────────────────┘
                         │ /api/v1/*
┌────────────────────────▼─────────────────────────────────────────────┐
│  Backend (FastAPI + Uvicorn)  →  Render                              │
│  ─ Middleware: CORS, Rate Limit, Security Headers, Request Security  │
│  ─ JWT Auth (Argon2 + HS256) with Token Blacklist                    │
│  ─ Background Workers: Pricing, Certificates, Smart Meters, Analytics│
└───┬──────────────┬──────────────┬────────────────┬───────────────────┘
    │              │              │                │
┌───▼────┐   ┌────▼─────┐  ┌────▼──────┐   ┌─────▼──────┐
│MongoDB │   │  Redis   │  │  Neo4j    │   │ AI APIs    │
│(Beanie │   │(Rate lim,│  │(Graph DB, │   │Groq, Gemini│
│ ODM)   │   │ lockout, │  │ recommend,│   │Sarvam TTS  │
│        │   │ blacklist│  │ analytics)│   │            │
└────────┘   └──────────┘  └───────────┘   └────────────┘
```

---

## 2. All Route Endpoints

All routes are prefixed with `/api/v1`.

### Auth (`/api/v1/auth`) — Tag: **Auth**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/auth/register` | Register a new user (returns UserResponse, 201) |
| POST | `/auth/login` | Authenticate and obtain access + refresh token pair |
| POST | `/auth/logout` | Logout and invalidate current token (blacklists JWT) |
| POST | `/auth/logout-all` | Logout from all devices (invalidate all user tokens) |
| POST | `/auth/refresh` | Rotate refresh token for a new token pair |
| GET | `/auth/me` | Get current authenticated user profile |

### Users (`/api/v1/users`) — Tag: **Users**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/users/{user_id}` | Get user by ID (admin only) |

### Marketplace (`/api/v1/marketplace`) — Tag: **Marketplace**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/marketplace/producers` | Register a new energy producer |
| GET | `/marketplace/producers` | List producers (filter by status, owner) |
| GET | `/marketplace/producers/{producer_id}` | Get producer details |
| PATCH | `/marketplace/producers/{producer_id}/verify` | Verify a producer (admin only) |
| POST | `/marketplace/listings` | Create a new energy listing |
| GET | `/marketplace/listings` | Browse energy listings (filter by source, status) |
| GET | `/marketplace/listings/{listing_id}` | Get listing detail |
| POST | `/marketplace/buy` | Purchase energy (creates contract + payment flow) |

### Pricing (`/api/v1/pricing`) — Tag: **Pricing**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/pricing/spot` | Get current spot price for an energy source |
| GET | `/pricing/spot/all` | Get spot prices for all energy sources |
| GET | `/pricing/historical` | Get historical price data (configurable hours/interval) |

### Contracts (`/api/v1/contracts`) — Tag: **Contracts**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/contracts` | Create a new energy trade contract |
| GET | `/contracts` | List contracts (filter by buyer, producer, status) |
| GET | `/contracts/{contract_id}` | Get contract details |
| POST | `/contracts/{contract_id}/sign` | Sign a contract (buyer or producer) |
| POST | `/contracts/{contract_id}/settle` | Settle a contract (T+1 mock) |
| POST | `/contracts/{contract_id}/dispute` | Mark contract as disputed |

### Certificates (`/api/v1/certificates`) — Tag: **Certificates**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/certificates` | Issue a green energy certificate |
| GET | `/certificates` | List certificates (filter by contract, producer, validity) |
| GET | `/certificates/{certificate_id}` | Get certificate details |
| POST | `/certificates/{certificate_id}/verify` | Verify certificate integrity and validity (SHA-256 hash) |

### Payments (`/api/v1/payments`) — Tag: **Payments**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/payments` | Initiate a payment with escrow lock |
| GET | `/payments` | List payments (filter by contract, buyer, status) |
| GET | `/payments/{payment_id}` | Get payment details |
| POST | `/payments/webhook` | Payment provider webhook (simulated) |
| POST | `/payments/{contract_id}/settle` | Simulate settlement payout for a contract |

### Smart Meters (`/api/v1/meters`) — Tag: **Smart Meters**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/meters/readings` | Ingest a single smart meter reading |
| POST | `/meters/readings/batch` | Ingest a batch of smart meter readings |
| GET | `/meters/readings` | List meter readings (filter by device, producer, status) |
| GET | `/meters/anomalies/{device_id}` | Get anomaly report for a device |

### Disputes (`/api/v1/disputes`) — Tag: **Disputes**

| Method | Endpoint | Summary |
|--------|----------|---------|
| POST | `/disputes` | Create a dispute ticket |
| GET | `/disputes` | List disputes (filter by contract, reporter, status) |
| GET | `/disputes/{dispute_id}` | Get dispute details |
| POST | `/disputes/{dispute_id}/evidence` | Add evidence to a dispute |
| POST | `/disputes/{dispute_id}/resolve` | Resolve a dispute (admin only) |

### Carbon Analytics (`/api/v1/analytics`) — Tag: **Carbon Analytics**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/analytics/co2/{contract_id}` | Compute CO₂ avoided for a specific contract |
| GET | `/analytics/monthly` | Monthly aggregated carbon analytics |
| GET | `/analytics/dashboard` | Carbon analytics dashboard summary |
| GET | `/analytics/producers/performance` | Top producers by volume and CO₂ impact |

### Wallet (`/api/v1/wallet`) — Tag: **Wallet**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/wallet/balance` | Get current wallet balance |
| POST | `/wallet/add-funds` | Add funds to wallet (INR) |
| GET | `/wallet/transactions` | Get wallet transaction history (newest first) |

### AI Services (`/api/v1/ai`) — Tag: **AI Services**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/ai/health` | Check AI services health (Groq, Gemini, Sarvam status) |
| POST | `/ai/chat` | Chat with Verdant AI Assistant (Groq primary / Gemini fallback) |
| POST | `/ai/chat/clear` | Clear conversation history for a user |
| GET | `/ai/tip` | Get a random energy saving tip |
| POST | `/ai/explain` | Explain an energy/trading concept |
| POST | `/ai/analytics/consumption` | Analyze energy consumption patterns |
| POST | `/ai/analytics/predict-price` | Predict energy prices (trend, confidence, best buy time) |
| POST | `/ai/analytics/sustainability` | Calculate sustainability score (0-100) |
| POST | `/ai/analytics/recommendations` | Get AI-powered producer recommendations |
| POST | `/ai/voice/speak` | Text-to-speech in 11 Indian languages (Sarvam Bulbul v3) |
| POST | `/ai/voice/notification` | Speak pre-defined notification in Indian languages |
| GET | `/ai/voice/languages` | Get list of supported languages |
| GET | `/ai/voice/speakers` | Get list of available voice personas |
| GET | `/ai/models` | Get information about available AI models |

### Graph Database (`/api/v1/graph`) — Tag: **Graph Database**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/graph/health` | Check Neo4j connection health + graph statistics |
| GET | `/graph/stats` | Get detailed graph statistics |
| GET | `/graph/recommendations/producers` | Personalized producer recommendations (collaborative filtering) |
| GET | `/graph/recommendations/listings/{listing_id}` | Similar energy listings based on graph |
| GET | `/graph/recommendations/similar-users` | Find users with similar trading patterns |
| GET | `/graph/analytics/energy-flow` | Overall energy trading flow analytics |
| GET | `/graph/analytics/producer-rankings` | Ranked list of top producers |
| GET | `/graph/analytics/user-graph` | Complete trading graph for current user |
| GET | `/graph/analytics/path/{producer_id}` | Find relationship path (trust chain) to a producer |
| POST | `/graph/sync/full` | Full sync MongoDB → Neo4j (admin only) |
| POST | `/graph/sync/user/{user_id}` | Sync single user to Neo4j |
| POST | `/graph/query` | Execute custom Cypher query (read-only for non-admin) |
| GET | `/graph/sample-queries` | Pre-built Cypher queries for Graph Explorer |

### Health (`/`) — Tag: **Root / Health**

| Method | Endpoint | Summary |
|--------|----------|---------|
| GET | `/` | Root welcome message |
| GET | `/health` | Application health check |

**Total: 65+ API endpoints across 12 route modules**

---

## 3. All Service Capabilities

| Service File | Core Functionality |
|---|---|
| `user_service.py` | User registration (Argon2 hashing), JWT authentication, token refresh, account lockout integration, audit logging |
| `marketplace_service.py` | Energy listing CRUD, buy energy flow (creates contract + payment + wallet debit + Neo4j sync) |
| `producer_service.py` | Producer registration, verification (admin), listing to user ownership, Neo4j sync on create |
| `pricing_service.py` | Real-time spot price engine for solar/wind/hydro/biomass/geothermal, historical price generation with random walk, WebSocket price feeds |
| `contract_service.py` | Contract creation, dual-party signing, T+1 settlement simulation, dispute marking, auto-certificate issuance on settlement |
| `certificate_service.py` | Green energy certificate issuance with SHA-256 double-layer hash, certificate verification, expiry management |
| `payment_service.py` | Payment initiation with escrow lock, webhook simulation, settlement payout, wallet integration |
| `smart_meter_service.py` | IoT meter reading ingestion (single + batch), anomaly detection via Z-score, automatic listing creation from readings |
| `wallet_service.py` | Wallet balance tracking, add funds, transaction history with type filtering (deposit/purchase/sale/refund/withdrawal) |
| `dispute_service.py` | Dispute creation, evidence upload, admin resolution, audit trail logging |
| `analytics_service.py` | CO₂ avoided computation, monthly carbon aggregation, dashboard summary, producer performance rankings |
| `ai_assistant.py` | AI chatbot with Groq (Llama 3.3 70B) primary + Gemini 1.5 Flash fallback, conversation history, energy tips, concept explanations |
| `ai_analytics.py` | AI consumption analysis, price prediction, sustainability scoring (0-100), smart producer recommendations via Gemini |
| `ai_voice.py` | Indian language TTS via Sarvam Bulbul v3, 11 languages, 46 voice personas, notification templates (welcome, payment, price alert, etc.) |
| `neo4j_service.py` | Graph DB CRUD (User/Producer/Listing/Contract nodes), collaborative-filtering recommendations, energy flow analytics, producer rankings, path finding, full MongoDB→Neo4j sync, custom Cypher execution |

---

## 4. AI Features (Deep Dive)

### 4.1 AI Assistant (`ai_assistant.py`)
- **Primary LLM:** Groq API — Llama 3.3 70B Versatile (fast inference, ~30s timeout)
- **Fallback LLM:** Google Gemini 1.5 Flash (advanced reasoning)
- **Features:**
  - Contextual chat with per-user conversation history (last 20 messages)
  - Energy trading Q&A, contract explanations, price analysis
  - Sustainability tips and carbon credit guidance
  - Auto-generated follow-up suggestions based on query topic
  - Quick one-off queries (tips, concept explanations)
- **System Prompt:** India-focused energy trading expert using ₹ and kWh

### 4.2 AI Analytics (`ai_analytics.py`)
- **Engine:** Google Gemini 1.5 Flash with structured JSON output
- **Features:**
  - **Consumption Analysis:** Total usage, peak hour/day detection, trend analysis (up/down/stable), Z-score anomaly detection, AI-generated insights
  - **Price Prediction:** Energy type-specific forecasting with confidence levels (high/medium/low), trend direction, best-time-to-buy, considers seasonal/time-of-day factors
  - **Sustainability Score:** 0-100 scoring, green energy percentage, carbon saved in kg, tree equivalent, ranking badges (Eco Champion, Green Leader, etc.), improvement tips
  - **Smart Recommendations:** AI-powered producer matching based on energy preferences, budget, location, and reliability scores
- **Fallback:** Rule-based predictions when AI APIs are unavailable

### 4.3 AI Voice (`ai_voice.py`)
- **Engine:** Sarvam AI Bulbul v3 (Indian language specialist)
- **Supported Languages (11):** Hindi, English, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu
- **Voice Personas (46):** 26 male + 20 female voices (Priya, Aditya, Rahul, Anushka, etc.)
- **Features:**
  - Free-form text-to-speech with configurable pitch, pace, loudness
  - Pre-built notification templates: welcome, contract_created, payment_success, price_alert, certificate_earned, daily_summary
  - Multi-language notification templates (Hindi + English + Marathi + Tamil + Telugu)
  - Personalized welcome messages, price change announcements, certificate congratulations
  - Returns base64-encoded MP3 audio
- **Frontend Integration:** Global VoiceContext with auto-play for notifications and AI responses

---

## 5. Neo4j Graph Features (Deep Dive)

### 5.1 Graph Schema
- **Nodes:** User, Producer, Listing, Contract
- **Relationships:** OWNS, LISTED, CREATED, BOUGHT, FROM, FOR, TRADED_WITH
- **Constraints:** Unique IDs on all node types
- **Indexes:** email, status, energy_source, listing status, contract status

### 5.2 Recommendation System
- **Collaborative Filtering:** "Users who traded with the same producers also traded with…"
- **Similar Listings:** Price similarity scoring + same energy source matching
- **Similar Users:** Shared producer trading patterns for community features

### 5.3 Graph Analytics
- **Energy Flow:** Total kWh traded, transaction value, contracts, source distribution
- **Producer Rankings:** Ranked by contract count, energy volume, buyer diversity
- **User Trading Graph:** Full connected graph (owned producers, traded producers, contracts)
- **Path Finding:** Shortest path between user and producer (trust chain, max 4 hops)

### 5.4 Graph Explorer
- Custom Cypher query execution (read-only for non-admin, full access for admin)
- 8 pre-built sample queries for visualization (all nodes, purchases, trading network, solar network, etc.)
- Frontend uses `react-force-graph-2d` for interactive graph visualization

### 5.5 Data Sync
- Full sync: MongoDB → Neo4j (admin operation)
- Single user sync
- Auto-sync on entity creation (producers, listings, contracts)

---

## 6. Frontend Pages

| Page | File | Description |
|------|------|-------------|
| **Landing** | `Landing.tsx` | Marketing homepage — "The Internet of Clean Energy" tagline, hero section, stats, how-it-works, CTA |
| **Login** | `Login.tsx` | Email/password login with role selection (Consumer/Producer/Admin), JWT auth |
| **Register** | `Register.tsx` | 2-step registration (details → role), redirects to KYC |
| **Dashboard** | `Dashboard.tsx` | Main dashboard with animated counters, supply/demand charts (Recharts), energy source breakdown, voice notification integration |
| **Marketplace** | `Marketplace.tsx` | Browse energy listings with filters (Solar/Wind/Hydro), source icons, AI Pick badges, live API data via `useListings` |
| **Buy Energy** | `BuyEnergy.tsx` | Multi-listing selection, volume slider, contract preview, purchase flow with voice notifications |
| **Producers** | `Producers.tsx` | Producer directory with filter by energy type, capacity display, verification status |
| **AI Assistant** | `AIAssistant.tsx` | Full chat UI with message history, suggested questions, concept explainer, daily energy tip, model info display |
| **AI Voice** | `AIVoice.tsx` | TTS synthesis center — language/speaker selection, notification template player, audio playback controls |
| **AI Analytics** | `AIAnalytics.tsx` | 4-tab analytics: Price Prediction, Consumption Analysis, Sustainability Score, Recommendations — all with charts (Recharts) |
| **AI Brain** | `AIBrain.tsx` | Combined AI dashboard — demand prediction, Leaflet map, AI insights feed, embedded chat + voice panels, price predictions |
| **Network Insights** | `NetworkInsights.tsx` | Neo4j graph explorer with `react-force-graph-2d`, pre-built visualizations, custom Cypher query input, node/edge coloring |
| **Smart Meter** | `SmartMeter.tsx` | IoT device dashboard — device list with battery/signal status, reading counts, anomaly alerts, sync functionality |
| **Wallet** | `Wallet.tsx` | Wallet balance, add funds, transaction history with tabs, area chart for balance trend, QR code display |
| **Contracts** | `Contracts.tsx` | Contract list with search/filter, status badges, progress tracking, contract detail expansion |
| **Certificates** | `Certificates.tsx` | Green energy certificates (REC/G-GO/I-REC types), SHA-256 hash display, verification, filtering |
| **Carbon Credit** | `CarbonCredit.tsx` | Carbon credit dashboard, price history chart, leaderboard (consumers/producers/investors), analytics integration |
| **Payments** | `Payments.tsx` | Payment/invoice list, status tracking (paid/pending/overdue), total spent/outstanding summary |
| **Disputes** | `Disputes.tsx` | Dispute management — ticket list, status indicators (open/reviewing/resolved), evidence viewing, audit log |
| **EIP Simulator** | `EIPSimulator.tsx` | Energy Infrastructure Planning — client-side grid simulation with source/hub/consumer nodes, AI commentary, renewable efficiency tracking |
| **Future Simulator** | `FutureSimulator.tsx` | What-if projections — sliders for usage/adoption/investment, 5-year carbon/money/renewable forecasts |
| **Smart City** | `SmartCity.tsx` | City-level energy dashboard — energy mix pie chart, zone surplus/deficit analysis, policy simulator |
| **Investor Zone** | `InvestorZone.tsx` | Investment projects (Solar Farm, Wind Turbine, Microgrid), ROI simulation, carbon offset projections |
| **Pricing & Auctions** | `PricingAuctions.tsx` | Real-time spot prices (auto-refresh every 30s), historical charts, bid interface, voice price alerts |
| **Community** | `Community.tsx` | Social features — member directory, posts, challenges, badges, leaderboard (client-side mock data) |
| **Profile** | `Profile.tsx` | User profile management, KYC status, trading volume, settings tabs |
| **Admin Console** | `AdminConsole.tsx` | Admin panel for platform management |
| **KYC** | `KYC.tsx` | Know Your Customer verification flow |
| **Notifications** | `Notifications.tsx` | Notification center |
| **Producer Dashboard** | `ProducerDashboard.tsx` | Producer-specific dashboard |
| **Trading History** | `TradingHistory.tsx` | Historical trading records |
| **Order Details** | `OrderDetails.tsx` | Individual order detail view |
| **SSO Callback** | `SsoCallback.tsx` | Clerk SSO callback handler |
| **Help** | `Help.tsx` | Help/FAQ page |
| **Not Found** | `NotFound.tsx` | 404 page |

**Total: 38 frontend pages**

---

## 7. Frontend Context, Hooks & Services

### Contexts
| File | Purpose |
|------|---------|
| `AuthContext.tsx` | Global auth state — user object, login/register/logout, JWT token hydration, auto-refresh on mount |
| `VoiceContext.tsx` | Global voice settings — on/off toggle, language/speaker selection, auto-play notifications, volume, audio queue playback |

### Hooks
| Hook | Purpose |
|------|---------|
| `useAI.ts` | AI chat, clear history, explain, tip, models, consumption analysis, price prediction, sustainability, recommendations, voice speak/notification/languages/speakers, health |
| `useAnalytics.ts` | Carbon dashboard, monthly analytics, CO₂ per contract, producer performance |
| `useApiQuery.ts` | Generic TanStack React Query wrapper |
| `useCertificates.ts` | Certificate list, get, verify |
| `useContracts.ts` | Contract CRUD, sign, settle, dispute |
| `useDisputes.ts` | Dispute list, create, add evidence, resolve |
| `useGraph.ts` | Neo4j graph health, stats, recommendations, analytics, sync, Cypher queries |
| `useListings.ts` | Energy listing list, get, buy |
| `useMeters.ts` | Smart meter readings, anomaly reports |
| `usePayments.ts` | Payment list, initiate, settle |
| `usePricingStream.ts` | WebSocket-based real-time pricing stream |
| `useProducers.ts` | Producer list, get, create |
| `useVoiceNotifications.ts` | Voice-enabled event hooks (contract created, payment, price alert) |
| `useWallet.ts` | Wallet balance, add funds, transaction history |
| `use-mobile.tsx` | Responsive breakpoint detection |
| `use-toast.ts` | Toast notification hook |

### Services
| Service | Purpose |
|---------|---------|
| `apiClient.ts` | Axios instance with JWT interceptors, token storage, auto-refresh on 401, base URL proxy |
| `authService.ts` | Login, register, logout, refresh, getCurrentUser API calls |
| `aiService.ts` | All AI endpoint calls (chat, analytics, voice, health, models) |
| `analyticsService.ts` | Carbon analytics API calls |
| `certificatesService.ts` | Certificate CRUD API calls |
| `contractsService.ts` | Contract CRUD API calls |
| `disputeService.ts` | Dispute API calls |
| `graphService.ts` | Neo4j graph API calls (health, stats, recommendations, analytics, sync, Cypher) |
| `marketplaceService.ts` | Listings and buy energy API calls |
| `meterService.ts` | Smart meter reading API calls |
| `paymentsService.ts` | Payment API calls |
| `pricingService.ts` | Spot price and historical pricing API calls |
| `pricingSocket.ts` | WebSocket client for real-time pricing updates |
| `userService.ts` | User profile API calls |
| `walletService.ts` | Wallet API calls |

---

## 8. Configuration Details

From `backend/app/core/config.py`:

```python
APP_NAME = "Verdant Energy Platform"
APP_VERSION = "0.1.0"
ENVIRONMENT = "development"  # development | staging | production
DEBUG = False
LOG_LEVEL = "INFO"
PORT = 8000
API_V1_PREFIX = "/api/v1"
ALLOWED_ORIGINS = '["http://localhost:3000","http://localhost:5173","http://localhost:8080"]'

# MongoDB
MONGODB_URI = "mongodb://localhost:27017"
MONGODB_DB_NAME = "verdant"

# Redis
REDIS_URL = "redis://localhost:6379/0"

# JWT
JWT_SECRET_KEY = "CHANGE-ME-..."
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Rate Limiting
RATE_LIMIT_PER_MINUTE = 60
USE_REDIS_RATE_LIMIT = True

# Account Lockout
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# Security
ENABLE_SECURITY_HEADERS = True

# Pricing
PRICING_UPDATE_INTERVAL_SECONDS = 10
BASE_ENERGY_PRICE_KWH = 0.12  # USD per kWh

# AI Services
GROQ_API_KEY = None
GEMINI_API_KEY = None
SARVAM_API_KEY = None
SARVAM_DEFAULT_SPEAKER = "priya"

# Neo4j
NEO4J_URI = "neo4j://localhost:7687"
NEO4J_USERNAME = "neo4j"
NEO4J_PASSWORD = "password"
NEO4J_DATABASE = "neo4j"
ENABLE_NEO4J = True
```

---

## 9. Security Features

### 9.1 Password Security (`security.py`)
- **Argon2id** hashing (time_cost=3, memory_cost=64MB, parallelism=4)
- SHA-256 **double-layer hashing** for certificates and transactions (Bitcoin-style, prevents length-extension attacks)
- SHA-256 hash of JSON-serializable objects (deterministic, sorted keys)

### 9.2 JWT Authentication (`security.py`, `auth.py`)
- HS256 signed access tokens (30 min) and refresh tokens (7 days)
- Token type validation (access vs refresh)
- Bearer token extraction from Authorization header

### 9.3 Token Blacklist (`token_blacklist.py`)
- Token revocation on logout (single device + all devices)
- Redis-backed with TTL matching token expiry (production)
- In-memory fallback with expiry cleanup (development)
- User-level "logout timestamp" — tokens issued before timestamp are invalid

### 9.4 Rate Limiting (`rate_limit.py`)
- **Sliding window** algorithm (not fixed window)
- Redis-backed with sorted sets (production) — O(log N) per check
- In-memory fallback (development)
- Configurable: default 60 requests/minute per IP
- Skips WebSocket upgrades and health checks
- Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`

### 9.5 Account Lockout (`account_lockout.py`)
- Locks after configurable failed login attempts (default: 5)
- Auto-unlock after configurable duration (default: 15 minutes)
- Redis-backed sliding window tracking (production)
- Per-email + IP address tracking
- Audit logging on lockout events

### 9.6 Security Headers (`security_headers.py`)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (production only, 1 year, includeSubDomains, preload)
- `Content-Security-Policy` (restrictive default-src 'self')
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (disables camera, microphone, geolocation, etc.)
- `Cache-Control: no-store` for API responses
- Relaxed for Swagger UI (`/docs`, `/redoc`) so CDN assets load

### 9.7 Request Security (`request_security.py`)
- **Request ID Middleware:** UUID tracking per request, `X-Request-ID` header
- **Size Limit Middleware:** 1 MB JSON, 10 MB default, 50 MB file uploads
- **Suspicious Request Detection:** Blocks path traversal (`../`), SQL injection (`' OR`, `UNION SELECT`, `DROP TABLE`), XSS (`<script`, `javascript:`), template injection (`${`, `{{`), command injection (`exec(`, `system(`), null byte injection

### 9.8 Audit Logging (`audit_log.py`)
- Structured JSON audit events with severity levels (INFO/WARNING/CRITICAL)
- Event types: login success/failure, logout, account CRUD, lockout, access denied, privilege escalation, rate limit exceeded, brute force detection, invalid token usage
- Fields: timestamp, user_id, email, IP address, user_agent, resource, action, success, details
- SIEM-ready log format for security monitoring and compliance

### 9.9 Middleware Stack (Order of Execution)
1. RequestIDMiddleware (outermost — adds UUID to all requests)
2. SecurityHeadersMiddleware
3. SuspiciousRequestMiddleware
4. RequestSizeLimitMiddleware
5. CORSMiddleware
6. RateLimitMiddleware (innermost — applies to all API requests)

---

## 10. Background Workers

| Worker | Purpose |
|--------|---------|
| `pricing_worker.py` | Periodic spot price updates, price randomization, WebSocket price broadcasting |
| `certificate_worker.py` | Auto-certificate issuance, expiry monitoring |
| `smart_meter_worker.py` | Simulated meter reading generation, anomaly detection |
| `analytics_worker.py` | Periodic carbon analytics recomputation |

All workers are launched as asyncio tasks at application startup and cancelled on shutdown.

---

## 11. Deployment Configuration

### Backend — Render (`render.yaml`)
- **Runtime:** Python 3.11.7
- **Plan:** Free tier
- **Region:** Oregon
- **Root directory:** `backend/`
- **Build:** `pip install --upgrade pip && pip install -r requirements.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Health check:** `/health`
- **Secrets (manual):** MONGODB_URI, JWT_SECRET_KEY (auto-generated), REDIS_URL, GROQ_API_KEY, GEMINI_API_KEY, SARVAM_API_KEY, NEO4J_URI/USERNAME/PASSWORD

### Frontend — Vercel (`vercel.json`)
- **Framework:** Vite
- **Build:** `npm run build` → `dist/`
- **Rewrites:**
  - `/api/:path*` → Render backend URL
  - All other routes → `/index.html` (SPA fallback)
- **Headers:** Static assets cached for 1 year (immutable)

---

## 12. Environment Variables

### Backend (`.env.example`)
```
# App
APP_NAME, APP_VERSION, ENVIRONMENT, DEBUG, LOG_LEVEL

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/...
MONGODB_DB_NAME=verdant

# Redis
REDIS_URL=redis://default:<password>@<host>:<port>

# JWT
JWT_SECRET_KEY, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60, USE_REDIS_RATE_LIMIT=true

# Account Security
MAX_LOGIN_ATTEMPTS=5, LOCKOUT_DURATION_MINUTES=15, ENABLE_SECURITY_HEADERS=true

# Pricing
PRICING_UPDATE_INTERVAL_SECONDS=10, BASE_ENERGY_PRICE_KWH=0.12

# AI Services
GROQ_API_KEY=gsk_..., GEMINI_API_KEY=AIzaSy_..., SARVAM_API_KEY=...

# Neo4j
ENABLE_NEO4J=false, NEO4J_URI=neo4j+s://..., NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE
```

### Frontend (`.env.example`)
```
# Only set if backend is at a non-standard location:
# VITE_API_BASE_URL=https://your-backend.onrender.com/api/v1
# In dev: Vite proxy handles /api/* → localhost:8000
# In prod: vercel.json rewrites /api/* → Render
```

---

## 13. Tech Stack Summary

### Backend
| Category | Technology |
|----------|-----------|
| Framework | FastAPI 0.115.6 + Uvicorn 0.34.0 |
| Language | Python 3.11 |
| ODM | Beanie 1.27.0 (async MongoDB) |
| Database | MongoDB Atlas |
| Cache/Queue | Redis 5.2.1 (rate limiting, token blacklist, account lockout) |
| Graph DB | Neo4j ≥5.0 (async driver) |
| Auth | PyJWT 2.10.1 + Argon2-cffi 23.1.0 |
| AI - LLM | Groq (Llama 3.3 70B) + Google Gemini 1.5 Flash |
| AI - Voice | Sarvam AI Bulbul v3 (Indian TTS) |
| HTTP Client | httpx 0.28.1 |
| Testing | pytest 8.3.4 + pytest-asyncio |

### Frontend
| Category | Technology |
|----------|-----------|
| Framework | React 18.3 + TypeScript 5.8 |
| Build Tool | Vite 5.4 |
| Styling | Tailwind CSS 3.4 + shadcn/ui (Radix primitives) |
| State/Data | TanStack React Query 5.83 + Axios |
| Routing | React Router DOM 6.30 |
| Charts | Recharts 2.15 |
| Maps | Leaflet 1.9 |
| Graph Viz | react-force-graph-2d 1.29 |
| Animation | Framer Motion 12.34 |
| Forms | React Hook Form + Zod validation |
| Auth (SSO) | Clerk React (optional) |
| Icons | Lucide React |
| Toasts | Sonner |
| Testing | Vitest 3.2 + Testing Library |

### Infrastructure
| Component | Service |
|-----------|---------|
| Backend hosting | Render (Python web service) |
| Frontend hosting | Vercel (static SPA) |
| Primary database | MongoDB Atlas |
| Cache/messaging | Redis Cloud |
| Graph database | Neo4j Aura |
| AI/LLM | Groq Cloud + Google AI Studio |
| Voice TTS | Sarvam AI |

---

*Report generated from source code analysis of the Verdant Energy Platform repository.*
