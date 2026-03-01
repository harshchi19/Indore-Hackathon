"""
Verdant Backend – Security utilities (Part A)
Argon2 password hashing, JWT token management & SHA-256 double layer hashing.
"""

from __future__ import annotations

import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, VerifyMismatchError

from app.core.config import get_settings

settings = get_settings()

# ── Argon2 Hasher ──────────────────────────────────────────
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)


def hash_password(plain: str) -> str:
    """Return Argon2id hash of *plain* password."""
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against an Argon2id hash."""
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError):
        return False


# ── JWT helpers ────────────────────────────────────────────
def create_access_token(
    subject: str,
    extra: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT refresh token."""
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": now,
        "exp": expire,
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token.
    Raises jwt.ExpiredSignatureError / jwt.InvalidTokenError on failure.
    """
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


# ── SHA-256 Double Layer Hashing ───────────────────────────
def sha256_hash(data: Union[str, bytes]) -> str:
    """
    Compute a single SHA-256 hash of the input data.
    
    Args:
        data: String or bytes to hash
        
    Returns:
        Hexadecimal string of the hash
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    return hashlib.sha256(data).hexdigest()


def sha256_double_hash(data: Union[str, bytes]) -> str:
    """
    Compute SHA-256 double layer hash: SHA256(SHA256(data)).
    
    This technique is used in Bitcoin and provides enhanced security against
    length extension attacks and potential future vulnerabilities in SHA-256.
    
    Args:
        data: String or bytes to hash
        
    Returns:
        Hexadecimal string of the double hash
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    # First layer: SHA-256 of original data
    first_hash = hashlib.sha256(data).digest()
    
    # Second layer: SHA-256 of the first hash
    second_hash = hashlib.sha256(first_hash).hexdigest()
    
    return second_hash


def sha256_double_hash_object(obj: Any) -> str:
    """
    Compute SHA-256 double layer hash of a JSON-serializable object.
    
    Useful for hashing certificates, transactions, contracts, etc.
    
    Args:
        obj: Any JSON-serializable Python object (dict, list, etc.)
        
    Returns:
        Hexadecimal string of the double hash
    """
    # Serialize with sorted keys for deterministic output
    json_str = json.dumps(obj, sort_keys=True, separators=(',', ':'))
    return sha256_double_hash(json_str)


def sha256_hmac_double(data: Union[str, bytes], secret_key: Optional[str] = None) -> str:
    """
    Compute HMAC-SHA256 double layer hash with a secret key.
    
    This adds authentication to the hash, ensuring only parties with
    the secret key can verify or generate matching hashes.
    
    Args:
        data: String or bytes to hash
        secret_key: Optional secret key (defaults to JWT_SECRET_KEY)
        
    Returns:
        Hexadecimal string of the double HMAC hash
    """
    if isinstance(data, str):
        data = data.encode('utf-8')
    
    key = (secret_key or settings.JWT_SECRET_KEY).encode('utf-8')
    
    # First layer: HMAC-SHA256
    first_hmac = hmac.new(key, data, hashlib.sha256).digest()
    
    # Second layer: HMAC-SHA256 of the first hash
    second_hmac = hmac.new(key, first_hmac, hashlib.sha256).hexdigest()
    
    return second_hmac


def verify_sha256_double_hash(data: Union[str, bytes], expected_hash: str) -> bool:
    """
    Verify that data matches an expected SHA-256 double hash.
    
    Uses constant-time comparison to prevent timing attacks.
    
    Args:
        data: Original data to verify
        expected_hash: Expected hexadecimal hash string
        
    Returns:
        True if hash matches, False otherwise
    """
    computed_hash = sha256_double_hash(data)
    return hmac.compare_digest(computed_hash, expected_hash)


def verify_sha256_double_hash_object(obj: Any, expected_hash: str) -> bool:
    """
    Verify that a JSON-serializable object matches an expected SHA-256 double hash.
    
    Args:
        obj: JSON-serializable object to verify
        expected_hash: Expected hexadecimal hash string
        
    Returns:
        True if hash matches, False otherwise
    """
    computed_hash = sha256_double_hash_object(obj)
    return hmac.compare_digest(computed_hash, expected_hash)


def generate_data_fingerprint(data: Union[str, bytes, Dict[str, Any]], include_timestamp: bool = False) -> Dict[str, str]:
    """
    Generate a comprehensive data fingerprint using SHA-256 double layer hashing.
    
    Useful for creating verifiable records of data state.
    
    Args:
        data: Data to fingerprint (string, bytes, or dict)
        include_timestamp: Whether to include creation timestamp
        
    Returns:
        Dictionary containing hash and optional metadata
    """
    if isinstance(data, dict):
        hash_value = sha256_double_hash_object(data)
    else:
        hash_value = sha256_double_hash(data)
    
    result = {
        "hash": hash_value,
        "algorithm": "SHA-256-DOUBLE",
    }
    
    if include_timestamp:
        result["timestamp"] = datetime.now(timezone.utc).isoformat()
    
    return result

