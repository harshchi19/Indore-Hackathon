"""
Verdant Backend – Auth routes (Part A)
POST /register, /login, /logout, /refresh, GET /me
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request, status

from app.core.auth import _get_current_user
from app.core.token_blacklist import token_blacklist
from app.core.audit_log import audit_logger
from app.models.users import User
from app.schemas.users import (
    MessageResponse,
    TokenPair,
    TokenRefreshRequest,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)
from app.services import user_service

router = APIRouter(prefix="/auth", tags=["Auth"])


def _get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxies."""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()
    return request.client.host if request.client else "unknown"


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
async def login(payload: UserLoginRequest, request: Request) -> TokenPair:
    ip_address = _get_client_ip(request)
    return await user_service.authenticate_user(payload, ip_address=ip_address)


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout and invalidate current token",
)
async def logout(
    request: Request,
    current_user: User = Depends(_get_current_user)
) -> MessageResponse:
    """
    Logout the current user by blacklisting their access token.
    The token will be invalid for any further requests.
    """
    # Get current token from request state (set by auth middleware)
    token = getattr(request.state, "current_token", None)
    
    if token:
        await token_blacklist.blacklist_token(token, token_type="access")
    
    # Also clear refresh token from user
    current_user.refresh_token = None
    await current_user.save()
    
    # Audit log
    from app.core.audit_log import AuditEvent, AuditEventType, AuditSeverity
    from datetime import datetime, timezone
    audit_logger.log_event(AuditEvent(
        event_type=AuditEventType.LOGOUT,
        severity=AuditSeverity.INFO,
        timestamp=datetime.now(timezone.utc),
        user_id=str(current_user.id),
        user_email=current_user.email,
        ip_address=_get_client_ip(request),
        action="logout",
        success=True
    ))
    
    return MessageResponse(detail="Successfully logged out")


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="Logout from all devices",
)
async def logout_all(
    request: Request,
    current_user: User = Depends(_get_current_user)
) -> MessageResponse:
    """
    Logout the user from all devices by invalidating all tokens.
    Any existing tokens will no longer be valid.
    """
    # Invalidate all tokens for this user
    await token_blacklist.blacklist_all_user_tokens(str(current_user.id))
    
    # Clear refresh token
    current_user.refresh_token = None
    await current_user.save()
    
    # Audit log
    from app.core.audit_log import AuditEvent, AuditEventType, AuditSeverity
    from datetime import datetime, timezone
    audit_logger.log_event(AuditEvent(
        event_type=AuditEventType.LOGOUT,
        severity=AuditSeverity.INFO,
        timestamp=datetime.now(timezone.utc),
        user_id=str(current_user.id),
        user_email=current_user.email,
        ip_address=_get_client_ip(request),
        action="logout_all_devices",
        success=True,
        details={"scope": "all_devices"}
    ))
    
    return MessageResponse(detail="Successfully logged out from all devices")


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
        wallet_balance=current_user.wallet_balance,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )
