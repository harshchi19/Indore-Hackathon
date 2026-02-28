"""
Verdant Backend – User service (Part A)
Business logic for user registration, authentication, and profile management.
"""

from __future__ import annotations

from typing import Optional

import jwt
from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.users import User
from app.schemas.users import (
    TokenPair,
    TokenRefreshRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

logger = get_logger("services.user")


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
    return _user_to_response(user)


async def authenticate_user(payload: UserLoginRequest) -> TokenPair:
    """Validate credentials and return access + refresh tokens."""
    user = await User.find_one(User.email == payload.email)
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    access = create_access_token(subject=str(user.id), extra={"role": user.role.value})
    refresh = create_refresh_token(subject=str(user.id))

    # Persist refresh token for rotation validation
    user.refresh_token = refresh
    await user.save()

    logger.info("User authenticated: %s", user.email)
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
