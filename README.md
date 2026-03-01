# Verdant Energy Platform 🌿⚡

An AI-driven decentralized renewable energy marketplace for future cities — built for the Indore Hackathon.

## Overview

Verdant lets energy **producers** list surplus renewable energy and **consumers** purchase it in real time. Smart-contract-style trade contracts, live pricing via WebSockets, REC (Renewable Energy Certificate) issuance, dispute resolution, analytics dashboards, and an AI assistant are all included out of the box.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool & dev server |
| Tailwind CSS + shadcn-ui | Styling & component library |
| React Router v6 | Client-side routing |
| TanStack Query | Server-state management |
| Recharts | Data visualization |
| Leaflet | Interactive maps |
| Framer Motion | Animations |
| Clerk | Authentication UI |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI + Uvicorn | REST + WebSocket API |
| MongoDB (Atlas) + Beanie | Primary database / ODM |
| Redis | Rate limiting & caching |
| Neo4j Aura | Graph-based recommendations |
| PyJWT + Argon2 | Authentication & password hashing |
| Groq / Gemini / Sarvam AI | AI assistant & NLP services |

### Infrastructure
| Service | Purpose |
|---|---|
| Render | Backend hosting |
| Vercel | Frontend hosting |

---

## Project Structure

```
Indore-Hackathon/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/            # Config, logging, security middleware
│   │   ├── db/              # MongoDB session
│   │   ├── models/          # Beanie ODM models
│   │   ├── routes/          # API route handlers
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic & AI services
│   │   └── workers/         # Background task workers
│   ├── .env.example         # Environment variable template
│   └── requirements.txt     # Python dependencies
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page-level components
│   │   └── ...
│   ├── .env.example         # Frontend environment variable template
│   └── package.json         # Node dependencies
├── render.yaml              # Render deployment blueprint
└── verdant-postman-collection.json  # API collection for Postman
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 and **npm** ≥ 9 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions)
- **Python** 3.11 (specified in `.python-version`)
- **MongoDB Atlas** URI (or a local MongoDB instance)
- **Redis** URL (local or [Redis Cloud](https://redis.com/))

### 1 — Clone the repository

```sh
git clone https://github.com/harshchi19/Indore-Hackathon.git
cd Indore-Hackathon
```

### 2 — Set up the Backend

```sh
cd backend

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and fill in MONGODB_URI, JWT_SECRET_KEY, and any AI API keys

# Start the development server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 3 — Set up the Frontend

```sh
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL and Clerk publishable key

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | Database name (default: `verdant`) |
| `JWT_SECRET_KEY` | Secret key for JWT signing — **change in production** |
| `REDIS_URL` | Redis connection URL |
| `GROQ_API_KEY` | [Groq](https://console.groq.com) API key (primary LLM) |
| `GEMINI_API_KEY` | [Google Gemini](https://aistudio.google.com) API key (fallback LLM) |
| `SARVAM_API_KEY` | [Sarvam AI](https://app.sarvam.ai) key (Indian language TTS) |
| `ENABLE_NEO4J` | Set to `true` to enable graph recommendations |
| `NEO4J_URI` | Neo4j Aura connection URI |

See `backend/.env.example` for the full list.

---

## API Endpoints

Key route groups (all prefixed with `/api/v1`):

| Route group | Description |
|---|---|
| `/auth` | Register, login, refresh, logout |
| `/users` | User profile management |
| `/marketplace` | Energy listings (buy / sell) |
| `/pricing` | Real-time pricing via WebSocket |
| `/contracts` | Trade contracts |
| `/certificates` | Renewable Energy Certificates (RECs) |
| `/payments` | Payment processing |
| `/smart_meter` | Smart meter data ingestion |
| `/disputes` | Dispute filing & resolution |
| `/analytics` | Platform analytics |
| `/wallet` | User wallet |
| `/ai` | AI assistant chat |
| `/graph` | Neo4j graph-based recommendations |

Import `verdant-postman-collection.json` into Postman to explore all endpoints interactively.

---

## Running Tests

### Backend

```sh
cd backend
pytest
```

### Frontend

```sh
cd frontend
npm run test
```

---

## Deployment

### Backend → Render

The repository includes a `render.yaml` blueprint. Connect the repo in the [Render dashboard](https://render.com) and it will auto-configure the service. Set secret environment variables (API keys, `MONGODB_URI`, etc.) in the Render dashboard after deployment.

### Frontend → Vercel

1. Import the repository in [Vercel](https://vercel.com).
2. Set the **root directory** to `frontend`.
3. Add required environment variables in the Vercel project settings.
4. Deploy — Vercel auto-detects Vite and configures the build.

After both services are live, update `ALLOWED_ORIGINS` in the Render environment to point to your Vercel URL.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project was created for the **Indore Hackathon**. All rights reserved by the respective authors.
