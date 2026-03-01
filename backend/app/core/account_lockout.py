"""
Verdant Backend – Account Lockout Service
Implements account lockout after failed login attempts to prevent brute force attacks.
"""

from __future__ import annotations

import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple

from app.core.config import get_settings
from app.core.logging import get_logger

settings = get_settings()
logger = get_logger("account_lockout")

# In-memory storage for failed attempts (fallback)
_failed_attempts: Dict[str, list] = defaultdict(list)
_lockouts: Dict[str, float] = {}

# Redis client (lazy initialization)
_redis_client = None


async def get_redis_client():
    """Get or create Redis client for lockout tracking."""
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
            logger.info("Redis account lockout connected")
        except Exception as e:
            logger.warning("Redis not available for lockout, using in-memory: %s", e)
            return None
    return _redis_client


class AccountLockoutService:
    """
    Service to track failed login attempts and implement account lockout.
    
    Features:
    - Tracks failed login attempts per email
    - Locks account after MAX_LOGIN_ATTEMPTS failures
    - Auto-unlocks after LOCKOUT_DURATION_MINUTES
    - Supports Redis (production) and in-memory (development) backends
    """
    
    def __init__(
        self,
        max_attempts: int = None,
        lockout_duration_minutes: int = None
    ):
        self.max_attempts = max_attempts or settings.MAX_LOGIN_ATTEMPTS
        self.lockout_duration = (lockout_duration_minutes or settings.LOCKOUT_DURATION_MINUTES) * 60
    
    async def record_failed_attempt(self, email: str, ip_address: str = None) -> Tuple[int, bool]:
        """
        Record a failed login attempt.
        
        Args:
            email: User email address
            ip_address: Client IP address (optional)
            
        Returns:
            Tuple of (attempt_count, is_locked)
        """
        redis = await get_redis_client()
        
        if redis:
            return await self._record_failed_redis(email, ip_address)
        else:
            return self._record_failed_memory(email, ip_address)
    
    async def _record_failed_redis(self, email: str, ip_address: str = None) -> Tuple[int, bool]:
        """Record failed attempt using Redis."""
        redis = await get_redis_client()
        key = f"login_attempts:{email}"
        lockout_key = f"lockout:{email}"
        
        try:
            now = time.time()
            window = self.lockout_duration
            
            pipe = redis.pipeline()
            
            # Check if already locked
            pipe.get(lockout_key)
            # Remove old attempts
            pipe.zremrangebyscore(key, 0, now - window)
            # Add this attempt
            pipe.zadd(key, {f"{now}:{ip_address or 'unknown'}": now})
            # Count attempts
            pipe.zcard(key)
            # Set expiry
            pipe.expire(key, window)
            
            results = await pipe.execute()
            existing_lockout = results[0]
            attempt_count = results[3]
            
            # Check if should lock
            if existing_lockout:
                return attempt_count, True
            
            if attempt_count >= self.max_attempts:
                # Lock the account
                await redis.setex(lockout_key, self.lockout_duration, "locked")
                logger.warning(
                    "Account locked due to %d failed attempts: %s",
                    attempt_count, email
                )
                return attempt_count, True
            
            return attempt_count, False
            
        except Exception as e:
            logger.error("Redis failed attempt tracking error: %s", e)
            return self._record_failed_memory(email, ip_address)
    
    def _record_failed_memory(self, email: str, ip_address: str = None) -> Tuple[int, bool]:
        """Record failed attempt using in-memory storage."""
        now = time.time()
        window = self.lockout_duration
        
        # Check existing lockout
        if email in _lockouts:
            if now < _lockouts[email]:
                return len(_failed_attempts[email]), True
            else:
                # Lockout expired
                del _lockouts[email]
                _failed_attempts[email] = []
        
        # Prune old attempts
        _failed_attempts[email] = [
            ts for ts in _failed_attempts[email] if now - ts < window
        ]
        
        # Record this attempt
        _failed_attempts[email].append(now)
        attempt_count = len(_failed_attempts[email])
        
        # Check if should lock
        if attempt_count >= self.max_attempts:
            _lockouts[email] = now + self.lockout_duration
            logger.warning(
                "Account locked due to %d failed attempts: %s",
                attempt_count, email
            )
            return attempt_count, True
        
        return attempt_count, False
    
    async def is_locked(self, email: str) -> Tuple[bool, Optional[int]]:
        """
        Check if an account is currently locked.
        
        Args:
            email: User email address
            
        Returns:
            Tuple of (is_locked, seconds_remaining)
        """
        redis = await get_redis_client()
        
        if redis:
            return await self._is_locked_redis(email)
        else:
            return self._is_locked_memory(email)
    
    async def _is_locked_redis(self, email: str) -> Tuple[bool, Optional[int]]:
        """Check lockout status using Redis."""
        redis = await get_redis_client()
        lockout_key = f"lockout:{email}"
        
        try:
            ttl = await redis.ttl(lockout_key)
            if ttl > 0:
                return True, ttl
            return False, None
        except Exception as e:
            logger.error("Redis lockout check error: %s", e)
            return self._is_locked_memory(email)
    
    def _is_locked_memory(self, email: str) -> Tuple[bool, Optional[int]]:
        """Check lockout status using in-memory storage."""
        now = time.time()
        
        if email in _lockouts:
            if now < _lockouts[email]:
                remaining = int(_lockouts[email] - now)
                return True, remaining
            else:
                # Lockout expired
                del _lockouts[email]
                _failed_attempts[email] = []
        
        return False, None
    
    async def clear_failed_attempts(self, email: str) -> None:
        """
        Clear failed attempts after successful login.
        
        Args:
            email: User email address
        """
        redis = await get_redis_client()
        
        if redis:
            try:
                await redis.delete(f"login_attempts:{email}", f"lockout:{email}")
            except Exception as e:
                logger.error("Redis clear attempts error: %s", e)
                self._clear_failed_memory(email)
        else:
            self._clear_failed_memory(email)
        
        logger.debug("Cleared failed attempts for: %s", email)
    
    def _clear_failed_memory(self, email: str) -> None:
        """Clear failed attempts from memory."""
        _failed_attempts.pop(email, None)
        _lockouts.pop(email, None)
    
    async def get_attempt_count(self, email: str) -> int:
        """
        Get current failed attempt count.
        
        Args:
            email: User email address
            
        Returns:
            Number of failed attempts in the current window
        """
        redis = await get_redis_client()
        
        if redis:
            try:
                key = f"login_attempts:{email}"
                now = time.time()
                window = self.lockout_duration
                
                # Clean old entries and count
                await redis.zremrangebyscore(key, 0, now - window)
                return await redis.zcard(key)
            except Exception as e:
                logger.error("Redis get attempt count error: %s", e)
        
        # Fallback to memory
        now = time.time()
        window = self.lockout_duration
        _failed_attempts[email] = [
            ts for ts in _failed_attempts[email] if now - ts < window
        ]
        return len(_failed_attempts[email])


# Singleton instance
lockout_service = AccountLockoutService()
