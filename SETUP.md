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

### 2.5 Start Redis

Redis is used for caching and rate-limiting. Choose one method:

**Option A — Docker (recommended for all platforms):**
```bash
docker run -d --name redis -p 6379:6379 redis:7-alpine
```

**Option B — Linux (apt):**
```bash
sudo apt update
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
```

**Option C — macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Option D — Windows (Memurai or WSL):**
- **Memurai** (native Windows Redis alternative): Download from [memurai.com](https://www.memurai.com/), install, and it runs as a Windows service automatically.
- **WSL**: Install Redis inside WSL using the Linux instructions above.

**Verify Redis is running:**
```bash
redis-cli ping
```
Expected response: `PONG`

> **Note:** Redis is optional for local development. If Redis is not running, the backend will still start — rate-limiting falls back to an in-memory implementation. However, Redis is required for production deployments.

### 2.6 Start the backend server

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

### 2.7 Verify the backend

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

---

## 8 — Production Deployment

### 8.1 Backend → Render

#### Option A — Blueprint (recommended)

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/) → **New** → **Blueprint**
3. Connect your GitHub repo
4. Render reads `render.yaml` at the repo root and auto-configures the service
5. Fill in secret env vars when prompted:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `ALLOWED_ORIGINS` — `["https://your-app.vercel.app"]`
   - `JWT_SECRET_KEY` — auto-generated by Render

#### Option B — Manual setup

1. Go to Render → **New** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables (see `backend/.env.example` for reference):

| Variable | Value |
|----------|-------|
| `ENVIRONMENT` | `production` |
| `DEBUG` | `false` |
| `LOG_LEVEL` | `WARNING` |
| `MONGODB_URI` | `mongodb+srv://...` (your Atlas URI) |
| `MONGODB_DB_NAME` | `verdant` |
| `JWT_SECRET_KEY` | (generate a secure random string) |
| `ALLOWED_ORIGINS` | `["https://your-app.vercel.app"]` |

5. Deploy and verify:
```bash
curl https://your-backend.onrender.com/health
# Expected: {"status": "healthy", "service": "Verdant Energy Platform", "version": "0.1.0"}
```

### 8.2 Frontend → Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Update `vercel.json`**: Replace `YOUR_RENDER_BACKEND_URL` with your actual Render URL:
   ```json
   "destination": "https://verdant-backend.onrender.com/api/:path*"
   ```
5. Optionally add environment variable:
   - `VITE_API_BASE_URL` — leave **unset** if using Vercel rewrites (recommended)
6. Deploy

### 8.3 Post-deployment checklist

- [ ] Backend `/health` returns `200 OK`
- [ ] Frontend loads at your Vercel URL
- [ ] Login / registration works end-to-end
- [ ] WebSocket pricing stream connects (check browser DevTools → Network → WS)
- [ ] CORS errors are absent in browser console
- [ ] Token refresh works (wait 30 minutes or force-expire a token)
