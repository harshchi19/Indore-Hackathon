"""
Verdant Backend – Token Blacklist Service
Implements JWT token revocation for secure logout and token invalidation.
"""

from __future__ import annotations

import time
from typing import Optional, Set

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("token_blacklist")

# In-memory blacklist (fallback)
_blacklisted_tokens: Set[str] = set()
_token_expiry: dict[str, float] = {}

# Redis client (lazy initialization)
_redis_client = None


async def get_redis_client():
    """Get or create Redis client for token blacklist."""
    global _redis_client
    if _redis_client is None:
        try:
            import redis.asyncio as redis
            _redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await _redis_client.ping()
            logger.info("Redis token blacklist connected")
        except Exception as e:
            logger.warning("Redis not available for blacklist, using in-memory: %s", e)
            return None
    return _redis_client


class TokenBlacklistService:
    """
    Service to manage revoked JWT tokens.
    
    Features:
    - Blacklist tokens on logout
    - Check if token is blacklisted before allowing access
    - Auto-cleanup expired tokens
    - Supports Redis (production) and in-memory (development) backends
    """
    
    async def blacklist_token(
        self,
        token: str,
        token_type: str = "access",
        expires_in: Optional[int] = None
    ) -> None:
        """
        Add a token to the blacklist.
        
        Args:
            token: The JWT token to blacklist
            token_type: Type of token (access/refresh)
            expires_in: Seconds until token expires (for TTL)
        """
        # Use token's remaining TTL or default
        if expires_in is None:
            if token_type == "access":
                expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            else:
                expires_in = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        
        redis = await get_redis_client()
        
        if redis:
            try:
                key = f"blacklist:{token}"
                await redis.setex(key, expires_in, "revoked")
                logger.debug("Token blacklisted in Redis (TTL: %ds)", expires_in)
                return
            except Exception as e:
                logger.error("Redis blacklist error: %s", e)
        
        # Fallback to in-memory
        _blacklisted_tokens.add(token)
        _token_expiry[token] = time.time() + expires_in
        logger.debug("Token blacklisted in memory (TTL: %ds)", expires_in)
    
    async def is_blacklisted(self, token: str) -> bool:
        """
        Check if a token is blacklisted.
        
        Args:
            token: The JWT token to check
            
        Returns:
            True if token is blacklisted, False otherwise
        """
        redis = await get_redis_client()
        
        if redis:
            try:
                key = f"blacklist:{token}"
                result = await redis.exists(key)
                return result > 0
            except Exception as e:
                logger.error("Redis blacklist check error: %s", e)
        
        # Fallback to in-memory with cleanup
        self._cleanup_expired_tokens()
        return token in _blacklisted_tokens
    
    async def blacklist_all_user_tokens(self, user_id: str) -> None:
        """
        Blacklist all tokens for a user (force logout from all devices).
        
        This is done by storing the user's "logout timestamp" - any tokens
        issued before this time are considered invalid.
        
        Args:
            user_id: The user ID to logout everywhere
        """
        redis = await get_redis_client()
        logout_time = int(time.time())
        
        if redis:
            try:
                key = f"user_logout:{user_id}"
                # Store for max token lifetime (refresh token)
                ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
                await redis.setex(key, ttl, str(logout_time))
                logger.info("User %s logged out from all devices", user_id)
                return
            except Exception as e:
                logger.error("Redis user logout error: %s", e)
        
        # In-memory fallback - store in a dict
        _token_expiry[f"user_logout:{user_id}"] = logout_time
    
    async def is_token_valid_for_user(self, user_id: str, token_iat: int) -> bool:
        """
        Check if a token is still valid based on user's logout timestamp.
        
        Args:
            user_id: The user ID
            token_iat: The token's issued-at timestamp
            
        Returns:
            True if token was issued after last logout, False otherwise
        """
        redis = await get_redis_client()
        
        if redis:
            try:
                key = f"user_logout:{user_id}"
                logout_time = await redis.get(key)
                if logout_time:
                    return token_iat > int(logout_time)
                return True
            except Exception as e:
                logger.error("Redis token validity check error: %s", e)
        
        # In-memory fallback
        logout_time = _token_expiry.get(f"user_logout:{user_id}")
        if logout_time:
            return token_iat > logout_time
        return True
    
    def _cleanup_expired_tokens(self) -> None:
        """Remove expired tokens from in-memory storage."""
        now = time.time()
        expired = [t for t, exp in _token_expiry.items() if exp < now]
        for token in expired:
            _blacklisted_tokens.discard(token)
            _token_expiry.pop(token, None)


# Singleton instance
token_blacklist = TokenBlacklistService()
