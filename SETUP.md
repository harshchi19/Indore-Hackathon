# Verdant Energy Platform — Setup Guide

Complete setup instructions for the **backend** (FastAPI + MongoDB) and **frontend** (React + Vite).

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| **Python** | 3.11+ | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | 6.0+ | [mongodb.com](https://www.mongodb.com/try/download/community) or use [Atlas](https://www.mongodb.com/atlas) |
| **Redis** | 7.0+ *(optional – for caching)* | [redis.io](https://redis.io/download/) or Windows: [Memurai](https://www.memurai.com/) |
| **Git** | any | [git-scm.com](https://git-scm.com/) |

> **Windows users:** You can run MongoDB and Redis via Docker if native installs are tricky:
> ```bash
> docker run -d --name mongo -p 27017:27017 mongo:7
> docker run -d --name redis -p 6379:6379 redis:7-alpine
> ```

---

## 1 — Clone the Repository

```bash
git clone <your-repo-url> Indore-Hackathon
cd Indore-Hackathon
```

---

## 2 — Backend Setup

### 2.1 Create & activate a virtual environment

```bash
cd backend

# Windows
python -m venv ../.venv
..\.venv\Scripts\activate

# macOS / Linux
python3 -m venv ../.venv
source ../.venv/bin/activate
```

### 2.2 Install dependencies

```bash
pip install -r requirements.txt
```

### 2.3 Configure environment variables

A `.env` file already exists in `backend/`. Review and adjust values as needed:

```dotenv
# backend/.env  (key settings)

APP_NAME=Verdant Energy Platform
DEBUG=true
ENVIRONMENT=development

# MongoDB – change if using Atlas or non-default port
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=verdant

# Redis – set to your Redis instance
REDIS_URL=redis://localhost:6379/0

# JWT – CHANGE in production
JWT_SECRET_KEY=super-secret-jwt-key-change-in-production-abc123
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Pricing engine
PRICING_UPDATE_INTERVAL_SECONDS=10
BASE_ENERGY_PRICE_KWH=0.12
```

> **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string:
> ```
> MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/?retryWrites=true&w=majority
> ```

### 2.4 Start MongoDB

Make sure MongoDB is running before starting the backend:

```bash
# If installed locally (default)
mongod

# Or verify it's running
mongosh --eval "db.runCommand({ ping: 1 })"
```

### 2.5 Start the backend server

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

| URL | Description |
|-----|-------------|
| `http://localhost:8000` | Root |
| `http://localhost:8000/docs` | Swagger UI (interactive API docs) |
| `http://localhost:8000/redoc` | ReDoc (alternative docs) |
| `http://localhost:8000/health` | Health check |

### 2.6 Verify the backend

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Verdant Energy Platform",
  "version": "0.1.0"
}
```

---

## 3 — Frontend Setup

### 3.1 Install dependencies

```bash
cd frontend
npm install
```

### 3.2 Start the development server

```bash
npm run dev
```

The frontend will be available at: **http://localhost:8080**

### 3.3 Other frontend commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR (port 8080) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |

---

## 4 — Running Both Together

Open **two terminals** side by side:

**Terminal 1 — Backend:**
```bash
cd backend
..\.venv\Scripts\activate        # Windows
# source ../.venv/bin/activate   # macOS/Linux
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| WebSocket Price Stream | ws://localhost:8000/api/v1/pricing/ws/stream |

---

## 5 — API Quickstart: Full Flow Test

Once the backend is running, test the end-to-end flow using curl or the Swagger UI at `/docs`:

### Step 1 — Register a user
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "producer@verdant.io",
    "password": "SecurePass123",
    "full_name": "Green Producer",
    "role": "producer"
  }'
```

### Step 2 — Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "producer@verdant.io",
    "password": "SecurePass123"
  }'
```
Save the `access_token` from the response.

### Step 3 — Create a producer profile
```bash
curl -X POST http://localhost:8000/api/v1/marketplace/producers \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "SolarMax Energy",
    "energy_sources": ["solar"],
    "capacity_kw": 500,
    "location": "Indore, India"
  }'
```

### Step 4 — Create an energy listing
```bash
curl -X POST http://localhost:8000/api/v1/marketplace/listings \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "producer_id": "<PRODUCER_ID>",
    "title": "Solar Power Block A",
    "energy_source": "solar",
    "quantity_kwh": 1000,
    "price_per_kwh": 0.10
  }'
```

### Step 5 — Get spot price
```bash
curl "http://localhost:8000/api/v1/pricing/spot?source=solar"
```

### Step 6 — Create a contract (Part B)
```bash
curl -X POST http://localhost:8000/api/v1/contracts \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_id": "<USER_ID>",
    "producer_id": "<PRODUCER_ID>",
    "volume_kwh": 100,
    "price_per_kwh": 0.10
  }'
```

### Step 7 — Sign & settle the contract
```bash
# Sign as buyer
curl -X POST http://localhost:8000/api/v1/contracts/<CONTRACT_ID>/sign \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "buyer"}'

# Sign as producer
curl -X POST http://localhost:8000/api/v1/contracts/<CONTRACT_ID>/sign \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "producer"}'

# Settle
curl -X POST http://localhost:8000/api/v1/contracts/<CONTRACT_ID>/settle \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

### Step 8 — Issue & verify certificate
```bash
# Issue
curl -X POST http://localhost:8000/api/v1/certificates \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "<CONTRACT_ID>",
    "energy_source": "solar"
  }'

# Verify
curl -X POST http://localhost:8000/api/v1/certificates/<CERTIFICATE_ID>/verify
```

---

## 6 — Project Structure Overview

```
Indore-Hackathon/
├── backend/                     # FastAPI + MongoDB backend
│   ├── .env                     # Environment config
│   ├── requirements.txt         # Python dependencies
│   └── app/
│       ├── main.py              # App entry point & lifespan
│       ├── core/                # Config, security, auth, logging, rate-limit
│       ├── db/                  # MongoDB session (Motor/Beanie) & base models
│       ├── models/              # Beanie document models (8 collections)
│       ├── schemas/             # Pydantic v2 request/response schemas
│       ├── routes/              # FastAPI routers (11 route files)
│       ├── services/            # Business logic layer (10 services)
│       └── workers/             # Background async workers (4 workers)
│
└── frontend/                    # React + TypeScript + Vite
    ├── package.json             # Node dependencies & scripts
    ├── vite.config.ts           # Vite config (port 8080)
    ├── tailwind.config.ts       # Tailwind CSS theming
    └── src/
        ├── App.tsx              # React Router setup (10 pages)
        ├── components/          # Layout + shadcn/ui components
        ├── pages/               # Page components
        ├── hooks/               # Custom React hooks
        └── lib/                 # Utility functions
```

---

## 7 — Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError` in backend | Make sure the virtual environment is activated and you ran `pip install -r requirements.txt` |
| MongoDB connection refused | Ensure `mongod` is running on port 27017 (or update `MONGODB_URI` in `.env`) |
| Frontend port conflict on 8080 | Change the port in `frontend/vite.config.ts` under `server.port` |
| CORS errors in browser | Add your frontend URL to `ALLOWED_ORIGINS` in `backend/.env` |
| `npm install` fails | Delete `node_modules/` and `package-lock.json`, then run `npm install` again |
| Redis connection errors | Redis is optional for dev. The app will start without it (rate-limiting uses in-memory fallback) |
| Python version errors | Ensure Python 3.11+ is installed; check with `python --version` |
