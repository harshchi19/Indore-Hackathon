"""
Verdant Backend – Rate limiting middleware (Part A)
In-memory sliding-window rate limiter (swap to Redis in production).
"""

from __future__ import annotations

import time
from collections import defaultdict
from typing import Dict, List

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings

settings = get_settings()

# In-memory store: ip -> list of timestamps
_request_log: Dict[str, List[float]] = defaultdict(list)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window per-IP rate limiter.
    Defaults to ``settings.RATE_LIMIT_PER_MINUTE`` requests / 60 s.
    Skips WebSocket upgrade requests (they aren't rate-limited the same way).
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate-limiting for WebSocket upgrades
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60.0

        # Prune stale entries
        _request_log[client_ip] = [
            ts for ts in _request_log[client_ip] if now - ts < window
        ]

        if len(_request_log[client_ip]) >= settings.RATE_LIMIT_PER_MINUTE:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Try again later."},
            )

        _request_log[client_ip].append(now)
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_PER_MINUTE)
        response.headers["X-RateLimit-Remaining"] = str(
            max(0, settings.RATE_LIMIT_PER_MINUTE - len(_request_log[client_ip]))
        )
        return response
