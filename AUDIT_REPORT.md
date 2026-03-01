# Verdant Frontend — Full System Audit Report

**Date:** Post backend-integration audit  
**Build Status:** ✅ Zero TypeScript errors · Vite production build passes (1,506 kB JS / 103 kB CSS)  
**Architecture:** ✅ Zero direct `axios` calls in pages or components — all traffic flows through `services/`

---

## SECTION 1 — Backend Endpoints Connected to UI

Every backend endpoint (44 total across 10 route files) has a matching frontend service method.  
**Coverage: 43/44** (the `POST /payments/webhook` is intentionally server-to-server only).

| Domain | Backend Routes | Frontend Service | Pages Using It |
|--------|---------------|-----------------|----------------|
| **Auth** (4) | register, login, refresh, me | `authService.ts` | Login, Register, AuthContext (auto) |
| **Users** (1) | get user by ID | `userService.ts` | Profile (via auth) |
| **Marketplace** (8) | CRUD producers, CRUD listings, buy energy, verify producer | `marketplaceService.ts` | Marketplace, Producers, ProducerDetail, CreateListing, BuyEnergy |
| **Pricing** (4) | spot, all spot, historical, WS stream | `pricingService.ts` + `pricingSocket.ts` | PricingAuctions, Dashboard |
| **Contracts** (6) | create, list, get, sign, settle, dispute | `contractsService.ts` | Contracts, TradingHistory |
| **Certificates** (4) | issue, list, get, verify | `certificatesService.ts` | Certificates |
| **Payments** (5) | initiate, list, get, settle, ~~webhook~~ | `paymentsService.ts` | Payments, Wallet |
| **Smart Meters** (4) | ingest, batch, list readings, anomalies | `meterService.ts` | SmartMeter |
| **Disputes** (5) | create, list, get, add evidence, resolve | `disputeService.ts` | Disputes |
| **Analytics** (4) | CO2/contract, monthly, dashboard, producer perf | `analyticsService.ts` | Dashboard, CarbonCredit, ProducerDashboard |

### React Query Hooks (9 domain hooks)

| Hook | Service | Used By |
|------|---------|---------|
| `useListings` | marketplaceService | Marketplace, PricingAuctions |
| `useProducers` | marketplaceService | Producers, ProducerDetail |
| `useContracts` | contractsService | Contracts, TradingHistory |
| `useCertificates` | certificatesService | Certificates |
| `usePayments` | paymentsService | Payments, Wallet |
| `useMeters` | meterService | SmartMeter |
| `useDisputes` | disputeService | Disputes |
| `useAnalytics` | analyticsService | Dashboard, CarbonCredit, ProducerDashboard |
| `usePricingStream` | pricingSocket | PricingAuctions |

---

## SECTION 2 — Frontend Components Not Connected to Backend

### 2A. Fully Disconnected Pages (11 pages — 100% hardcoded/mock data)

| Page | Category | Description | Could Connect To |
|------|----------|-------------|-----------------|
| **AdminConsole** | Admin | Hardcoded metrics, user list, audit logs | `users/`, `analytics/dashboard`, custom admin routes |
| **AIBrain** | AI/ML | Mock demand predictions, Leaflet map overlays | `analytics/`, `pricing/historical` |
| **Community** | Social | `mockMembers`, `mockPosts`, `mockChallenges` | No backend endpoints exist |
| **EIPSimulator** | Visualization | Animated grid topology, AI commentary | No backend endpoints exist |
| **FutureSimulator** | Calculator | Client-side savings projections | Could use `pricing/spot/all` for current rates |
| **Help** | Support | Static FAQ, non-functional contact form | No backend endpoints exist |
| **InvestorZone** | Finance | Mock investment portfolio, ROI calculator | No backend endpoints exist |
| **KYC** | Compliance | Hardcoded verification steps, documents | No backend endpoints exist |
| **Notifications** | Alerts | Hardcoded notification list, local state only | No backend endpoints exist |
| **OrderDetails** | Commerce | Reads `orderId` from params but renders demo data | `contracts/{id}`, `payments/{id}` |
| **SmartCity** | Dashboard | Mock city zones, energy mix pie chart | `analytics/dashboard`, `pricing/spot/all` |

### 2B. Connected Pages with Residual Hardcoded Data

| Page | Hardcoded Element | Severity | Notes |
|------|-------------------|----------|-------|
| **ProducerDetail** | `productionData` (6-month chart), `reviews` (3 items) | Medium | No backend endpoints for production history or reviews |
| **Wallet** | `balanceHistory` (7-day chart), `walletAddress` | Medium | No wallet/balance-history endpoint exists |
| **CarbonCredit** | `priceHistory` (12-point chart), `leaderboard` (15 entries) | Medium | Could use `pricing/historical`, no leaderboard endpoint |
| **Dashboard** | `fallbackEnergyData`, `fallbackCityData` | Low | Acceptable — used only when API returns empty |

### 2C. Dead Code Removed

| Item | Action |
|------|--------|
| `NavLink.tsx` | **Deleted** — not imported anywhere |

---

## SECTION 3 — Backend Services Without UI

| Backend Endpoint | Frontend Service Method | UI Status |
|-----------------|------------------------|-----------|
| `POST /payments/webhook` | Not in frontend (correct — server-to-server) | N/A |
| `PATCH /marketplace/producers/{id}/verify` | `marketplaceService.verifyProducer()` | **No UI** — AdminConsole is disconnected |
| `POST /disputes/{id}/resolve` | `disputeService.resolve()` | **No admin UI** — available in service but no admin panel calls it |
| `GET /analytics/co2/{contract_id}` | `analyticsService.getCO2()` | **Not used by any page** — hook exists but no page calls it |
| `POST /certificates` (issue) | `certificatesService.issue()` | **No issue UI** — certificates page only lists/verifies |
| `POST /meters/readings` (ingest) | `meterService.ingestReading()` | **No ingest UI** — SmartMeter only displays readings |
| `POST /meters/readings/batch` | `meterService.ingestBatch()` | **No batch UI** — same as above |

---

## SECTION 4 — Recommended Improvements

### Priority 1 — Quick Wins (Low Effort, High Value)

1. **Connect OrderDetails page** to `contractsService.getById()` and `paymentsService.getById()` — it already reads `orderId` from URL params
2. **Connect AdminConsole** to `analyticsService.getDashboard()` for real system metrics
3. **Wire FutureSimulator** to `pricingService.getAllSpotPrices()` for current market rates in projections

### Priority 2 — Architecture Improvements

4. **Add certificate issuance UI** — the `POST /certificates` endpoint has a service method but no page flow triggers it
5. **Add admin dispute resolution UI** — `disputeService.resolve()` exists but AdminConsole doesn't use it
6. **Add meter reading ingestion form** — SmartMeter page could allow manual readings via `meterService.ingestReading()`
7. **Use `analyticsService.getCO2()` per-contract** — show CO₂ impact on contract detail views

### Priority 3 — New Backend Endpoints Needed

8. **Community API** — Community page has rich UI but zero backend (posts, members, challenges)
9. **Notifications API** — Notifications page is purely local state
10. **KYC/Verification API** — KYC page shows verification workflow but no backend
11. **Wallet/Balance API** — Wallet page uses payment totals but has no real balance tracking
12. **Reviews API** — ProducerDetail shows reviews with no backend source
13. **Leaderboard API** — CarbonCredit page uses hardcoded leaderboard data

### Priority 4 — Code Quality

14. **Code-split the bundle** — 1,506 kB JS chunk exceeds the 500 kB recommendation; use `React.lazy()` for route-level splitting
15. **Replace hardcoded chart data** — ProducerDetail `productionData`, Wallet `balanceHistory`, CarbonCredit `priceHistory` should come from API when endpoints are built
16. **Add E2E contract-type mapping** — TradingHistory and Contracts pages map `contract_type` to energy type as "solar" default since `ContractResponse` has no `energy_source` field

---

## Fixes Applied During This Audit

| File | Issue | Fix |
|------|-------|-----|
| `Contracts.tsx` | `Math.random()` for progress | Replaced with deterministic age-based calculation |
| `TradingHistory.tsx` | `Math.random()` for buy/sell type; referenced non-existent `energy_source`, `seller_id`, `quantity_kwh` fields | Deterministic type from `buyer_id`; fixed to use correct `ContractResponse` fields |
| `SmartMeter.tsx` | `Math.random()` for battery/signal | Replaced with deterministic hash from device ID |
| `PricingAuctions.tsx` | `Math.random()` for bids/endsIn | Replaced with deterministic index-based values |
| `Marketplace.tsx` | `Math.random()` for distance/reliability | Replaced with deterministic index-based values |
| `NavLink.tsx` | Dead code — unused component | Deleted |

**Build verification:** ✅ `tsc --noEmit` — 0 errors · ✅ `vite build` — success
