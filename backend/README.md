# Verdant Backend - Part B

Enterprise-grade energy trading platform backend built with FastAPI, MongoDB (Motor), and Pydantic v2.

## Quick Start

### 1. Install Dependencies

```bash
cd Backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Overview

### Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/v1/contracts` | Energy trading contracts |
| `/api/v1/smart-meters` | Smart meter readings & devices |
| `/api/v1/certificates` | I-REC/G-GO certificate management |
| `/api/v1/payments` | Payment & escrow operations |
| `/api/v1/disputes` | Dispute resolution system |
| `/api/v1/analytics` | Carbon impact & trading analytics |
| `/api/v1/workers` | Background job management |

### Testing Endpoints

- `GET /api/v1/test/setup` - Create test data
- `GET /api/v1/test/full-flow` - Run complete end-to-end test

## Testing with Postman

### Complete Flow Test

1. **Setup Test Data**
   ```
   GET http://localhost:8000/api/v1/test/setup
   ```
   Save the `contract_id`, `buyer_id`, `producer_id` from response.

2. **Sign Contract (Buyer)**
   ```
   POST http://localhost:8000/api/v1/contracts/{contract_id}/sign
   Body: {"signer_id": "{buyer_id}", "signer_type": "buyer"}
   ```

3. **Sign Contract (Producer)**
   ```
   POST http://localhost:8000/api/v1/contracts/{contract_id}/sign
   Body: {"signer_id": "{producer_id}", "signer_type": "producer"}
   ```

4. **Settle Contract**
   ```
   POST http://localhost:8000/api/v1/contracts/{contract_id}/settle?force=true
   ```

5. **Issue Certificate**
   ```
   POST http://localhost:8000/api/v1/workers/certificates/issue-for-settled
   ```

6. **Or Run Full Flow Automatically**
   ```
   GET http://localhost:8000/api/v1/test/full-flow
   ```

## Project Structure

```
Backend/
├── app/
│   ├── main.py              # FastAPI application
│   ├── core/
│   │   ├── config.py        # Settings & configuration
│   │   ├── database.py      # MongoDB connection
│   │   ├── security.py      # JWT authentication
│   │   ├── hashing.py       # SHA-256 utilities
│   │   └── object_id.py     # Pydantic ObjectId type
│   ├── models/              # MongoDB document models
│   │   ├── contracts.py
│   │   ├── certificates.py
│   │   ├── payments.py
│   │   ├── disputes.py
│   │   └── smart_meter.py
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── contracts.py
│   │   ├── certificates.py
│   │   ├── payments.py
│   │   ├── disputes.py
│   │   ├── smart_meter.py
│   │   └── analytics.py
│   ├── services/            # Business logic layer
│   │   ├── contract_service.py
│   │   ├── certificate_service.py
│   │   ├── payment_service.py
│   │   ├── dispute_service.py
│   │   ├── smart_meter_service.py
│   │   └── analytics_service.py
│   ├── routes/              # API endpoints
│   │   ├── contracts.py
│   │   ├── certificates.py
│   │   ├── payments.py
│   │   ├── disputes.py
│   │   ├── smart_meter.py
│   │   ├── analytics.py
│   │   └── workers.py
│   └── workers/             # Background job handlers
│       ├── certificate_worker.py
│       ├── smart_meter_worker.py
│       └── analytics_worker.py
└── requirements.txt
```

## Features

### Contract System
- Create energy trading contracts
- Digital signature hashing (SHA-256)
- T+1 settlement simulation
- Status workflow: pending → active → settled

### Smart Meter System
- Meter reading ingestion
- Anti-fraud detection:
  - Negative readings
  - Large jumps (>500% increase)
  - Interval violations
  - Pattern detection (stuck meter, uniform increase)
- Anomaly reporting

### Certificates Engine
- I-REC/G-GO compatible certificates
- SHA-256 certificate hashing
- Certificate verification
- Expiry handling

### Payment System
- Payment initiation
- Escrow lock/release/refund
- Webhook processing
- Settlement payout simulation

### Disputes System
- Ticket creation
- Evidence management
- Workflow transitions with validation
- Full audit logging

### Carbon Analytics
- CO2 avoided calculation
- Monthly aggregations
- Producer performance rankings
- GHG baseline factors

## Notes

- All data is stored in-memory for Postman testing
- No actual MongoDB connection required for testing
- Real MongoDB integration available via Motor driver
