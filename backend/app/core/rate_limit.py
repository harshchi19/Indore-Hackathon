"""
Verdant Backend – Rate limiting middleware
Supports both in-memory (development) and Redis (production) rate limiting.
Implements sliding-window algorithm for accurate rate tracking.
"""

from __future__ import annotations

import asyncio
import time
from collections import defaultdict
from typing import Dict, List, Optional

from fastapi import Request, status
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import JSONResponse, Response

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("rate_limit")

# In-memory store: ip -> list of timestamps (fallback)
_request_log: Dict[str, List[float]] = defaultdict(list)

# Redis client (lazy initialization)
_redis_client = None


async def get_redis_client():
    """Get or create Redis client for rate limiting."""
    global _redis_client
    if _redis_client is None and settings.USE_REDIS_RATE_LIMIT:
        try:
            import redis.asyncio as redis
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            # Test connection
            await _redis_client.ping()
            logger.info("Redis rate limiter connected")
        except Exception as e:
            logger.warning("Redis not available, using in-memory rate limiting: %s", e)
            return None
    return _redis_client


async def check_rate_limit_redis(client_ip: str, limit: int, window: int = 60) -> tuple[bool, int]:
    """
    Check rate limit using Redis with sliding window.
    
    Returns:
        Tuple of (is_allowed, remaining_requests)
    """
    redis = await get_redis_client()
    if redis is None:
        return check_rate_limit_memory(client_ip, limit, window)
    
    try:
        key = f"rate_limit:{client_ip}"
        now = time.time()
        pipe = redis.pipeline()
        
        # Remove old entries outside the window
        pipe.zremrangebyscore(key, 0, now - window)
        # Add current request
        pipe.zadd(key, {str(now): now})
        # Count requests in window
        pipe.zcard(key)
        # Set expiry on the key
        pipe.expire(key, window)
        
        results = await pipe.execute()
        current_count = results[2]
        
        is_allowed = current_count <= limit
        remaining = max(0, limit - current_count)
        
        return is_allowed, remaining
    except Exception as e:
        logger.warning("Redis rate limit check failed, falling back to memory: %s", e)
        return check_rate_limit_memory(client_ip, limit, window)


def check_rate_limit_memory(client_ip: str, limit: int, window: int = 60) -> tuple[bool, int]:
    """
    Check rate limit using in-memory storage (fallback).
    
    Returns:
        Tuple of (is_allowed, remaining_requests)
    """
    now = time.time()
    
    # Prune stale entries
    _request_log[client_ip] = [
        ts for ts in _request_log[client_ip] if now - ts < window
    ]
    
    current_count = len(_request_log[client_ip])
    
    if current_count >= limit:
        return False, 0
    
    _request_log[client_ip].append(now)
    remaining = max(0, limit - current_count - 1)
    
    return True, remaining


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding-window per-IP rate limiter.
    Supports Redis (production) and in-memory (development) backends.
    Defaults to ``settings.RATE_LIMIT_PER_MINUTE`` requests / 60 s.
    Skips WebSocket upgrade requests.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate-limiting for WebSocket upgrades
        if request.headers.get("upgrade", "").lower() == "websocket":
            return await call_next(request)

        # Skip rate-limiting for health checks
        if request.url.path in ["/health", "/"]:
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        
        # Check rate limit (uses Redis if available, falls back to memory)
        if settings.USE_REDIS_RATE_LIMIT:
            is_allowed, remaining = await check_rate_limit_redis(
                client_ip, 
                settings.RATE_LIMIT_PER_MINUTE
            )
        else:
            is_allowed, remaining = check_rate_limit_memory(
                client_ip,
                settings.RATE_LIMIT_PER_MINUTE
            )

        if not is_allowed:
            logger.warning("Rate limit exceeded for IP: %s", client_ip)
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded. Try again later."},
                headers={
                    "X-RateLimit-Limit": str(settings.RATE_LIMIT_PER_MINUTE),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": "60"
                }
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(settings.RATE_LIMIT_PER_MINUTE)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP, considering proxy headers.
        """
        # Check X-Forwarded-For header (from reverse proxies/load balancers)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Take the first IP (original client)
            return forwarded_for.split(",")[0].strip()
        
        # Check X-Real-IP header
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        
        # Fall back to direct connection IP
        return request.client.host if request.client else "unknown"

