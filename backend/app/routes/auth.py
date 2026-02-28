"""
Verdant Backend – Auth routes (Part A)
POST /register, /login, /refresh, GET /me
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.core.auth import _get_current_user
from app.models.users import User
from app.schemas.users import (
    TokenPair,
    TokenRefreshRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(payload: UserRegisterRequest) -> UserResponse:
    return await user_service.register_user(payload)


@router.post(
    "/login",
    response_model=TokenPair,
    summary="Authenticate and obtain tokens",
)
async def login(payload: UserLoginRequest) -> TokenPair:
    return await user_service.authenticate_user(payload)


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Rotate refresh token",
)
async def refresh(payload: TokenRefreshRequest) -> TokenPair:
    return await user_service.refresh_tokens(payload)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def me(current_user: User = Depends(_get_current_user)) -> UserResponse:
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
