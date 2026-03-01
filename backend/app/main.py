"""
Verdant Energy Platform – FastAPI Application Entry Point

Registers all Part A + Part B routers, middleware, and lifecycle hooks.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.logging import get_logger, setup_logging
from app.core.rate_limit import RateLimitMiddleware
from app.db.session import close_db, connect_db

settings = get_settings()
setup_logging()
logger = get_logger("main")


# ── Lifespan (startup / shutdown) ───────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage async resources across the app lifetime."""
    pricing_task = certificate_task = meter_task = analytics_task = None
    # ── startup ──
    logger.info("Starting %s v%s [%s]", settings.APP_NAME, settings.APP_VERSION, settings.ENVIRONMENT)
    logger.info("MONGODB_URI prefix: %s", settings.MONGODB_URI[:30])
    try:
        await connect_db()
    except Exception as exc:
        logger.critical(
            "FATAL: MongoDB startup failed – %s. "
            "Check MONGODB_URI env var and Atlas IP whitelist (add 0.0.0.0/0).",
            exc,
        )
        raise  # re-raise so Render shows the real error

    # Start background workers
    try:
        from app.workers.pricing_worker import start_pricing_worker
        from app.workers.certificate_worker import start_certificate_worker
        from app.workers.smart_meter_worker import start_smart_meter_worker
        from app.workers.analytics_worker import start_analytics_worker

        pricing_task = start_pricing_worker()
        certificate_task = start_certificate_worker()
        meter_task = start_smart_meter_worker()
        analytics_task = start_analytics_worker()
        logger.info("All background workers launched")
    except Exception as exc:
        logger.error("Background workers failed to start: %s", exc)
        # Non-fatal – app continues without workers

    yield

    # ── shutdown ──
    for task in (pricing_task, certificate_task, meter_task, analytics_task):
        if task is not None:
            task.cancel()
    await close_db()
    logger.info("Application shut down gracefully")


# ── App factory ─────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Decentralised green-energy trading platform – Full backend services",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
)

# ── Middleware ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)


# ── Global exception handler ───────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


# ── Routers (Part A) ────────────────────────────────────────
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.marketplace import router as marketplace_router
from app.routes.pricing import router as pricing_router

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(marketplace_router, prefix=settings.API_V1_PREFIX)
app.include_router(pricing_router, prefix=settings.API_V1_PREFIX)

# ── Routers (Part B) ────────────────────────────────────────
from app.routes.contracts import router as contracts_router
from app.routes.certificates import router as certificates_router
from app.routes.payments import router as payments_router
from app.routes.smart_meter import router as smart_meter_router
from app.routes.disputes import router as disputes_router
from app.routes.analytics import router as analytics_router

app.include_router(contracts_router, prefix=settings.API_V1_PREFIX)
app.include_router(certificates_router, prefix=settings.API_V1_PREFIX)
app.include_router(payments_router, prefix=settings.API_V1_PREFIX)
app.include_router(smart_meter_router, prefix=settings.API_V1_PREFIX)
app.include_router(disputes_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)


# ── Health check ────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "docs": "/docs",
        "health": "/health",
    }
