"""
Verdant Backend – User service (Part A)
Business logic for user registration, authentication, and profile management.
Includes account lockout protection and security audit logging.
"""

from __future__ import annotations

from typing import Optional

import jwt
from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.account_lockout import lockout_service
from app.core.audit_log import audit_logger
from app.models.users import User
from app.schemas.users import (
    TokenPair,
    TokenRefreshRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

logger = get_logger("services.user")
settings = get_settings()


def _user_to_response(user: User) -> UserResponse:
    return UserResponse(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


async def register_user(payload: UserRegisterRequest) -> UserResponse:
    """Register a new user. Raises 409 if email exists."""
    existing = await User.find_one(User.email == payload.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    await user.insert()
    logger.info("User registered: %s (%s)", user.email, user.role.value)
    
    # Audit log: account created
    audit_logger.log_account_created(
        user_id=str(user.id),
        user_email=user.email,
        role=user.role.value
    )
    
    return _user_to_response(user)


async def authenticate_user(payload: UserLoginRequest, ip_address: str = None) -> TokenPair:
    """
    Validate credentials and return access + refresh tokens.
    Includes account lockout protection and security audit logging.
    """
    # Check if account is locked
    is_locked, seconds_remaining = await lockout_service.is_locked(payload.email)
    if is_locked:
        minutes_remaining = (seconds_remaining or 0) // 60 + 1
        audit_logger.log_login_failed(
            user_email=payload.email,
            ip_address=ip_address,
            reason="Account locked"
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked due to multiple failed login attempts. "
                   f"Please try again in {minutes_remaining} minutes.",
        )
    
    user = await User.find_one(User.email == payload.email)
    
    # Invalid credentials
    if user is None or not verify_password(payload.password, user.hashed_password):
        # Record failed attempt
        attempt_count, now_locked = await lockout_service.record_failed_attempt(
            payload.email,
            ip_address
        )
        
        # Audit log: failed login
        audit_logger.log_login_failed(
            user_email=payload.email,
            ip_address=ip_address,
            reason="Invalid credentials"
        )
        
        if now_locked:
            # Audit log: account locked
            audit_logger.log_account_locked(
                user_email=payload.email,
                ip_address=ip_address,
                attempt_count=attempt_count
            )
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked due to {attempt_count} failed login attempts. "
                       f"Please try again in {settings.LOCKOUT_DURATION_MINUTES} minutes.",
            )
        
        remaining_attempts = settings.MAX_LOGIN_ATTEMPTS - attempt_count
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. {remaining_attempts} attempts remaining.",
        )

    if not user.is_active:
        audit_logger.log_login_failed(
            user_email=payload.email,
            ip_address=ip_address,
            reason="Account deactivated"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # Successful login - clear failed attempts
    await lockout_service.clear_failed_attempts(payload.email)
    
    access = create_access_token(subject=str(user.id), extra={"role": user.role.value})
    refresh = create_refresh_token(subject=str(user.id))

    # Persist refresh token for rotation validation
    user.refresh_token = refresh
    await user.save()

    logger.info("User authenticated: %s", user.email)
    
    # Audit log: successful login
    audit_logger.log_login_success(
        user_id=str(user.id),
        user_email=user.email,
        ip_address=ip_address
    )
    
    return TokenPair(access_token=access, refresh_token=refresh)


async def refresh_tokens(payload: TokenRefreshRequest) -> TokenPair:
    """Rotate refresh token and issue new access token."""
    try:
        data = decode_token(payload.refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if data.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is not a refresh token",
        )

    user = await User.get(PydanticObjectId(data["sub"]))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Rotation check – the presented token must match the stored one
    if user.refresh_token != payload.refresh_token:
        # Possible token reuse → revoke all
        user.refresh_token = None
        await user.save()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked (possible reuse detected)",
        )

    access = create_access_token(subject=str(user.id), extra={"role": user.role.value})
    refresh = create_refresh_token(subject=str(user.id))

    user.refresh_token = refresh
    await user.save()

    logger.info("Tokens rotated for user: %s", user.email)
    return TokenPair(access_token=access, refresh_token=refresh)


async def get_user_by_id(user_id: str) -> Optional[UserResponse]:
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        return None
    return _user_to_response(user)
