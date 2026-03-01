"""
Verdant Backend – Auth dependencies (Part A)
FastAPI dependency injection for current-user resolution & RBAC.
Includes token blacklist checking for secure logout.
"""

from __future__ import annotations

from typing import List

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.core.token_blacklist import token_blacklist
from app.core.audit_log import audit_logger
from app.models.users import User

_bearer_scheme = HTTPBearer(auto_error=True)


async def _get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> User:
    """Resolve the authenticated user from the Bearer token."""
    token = credentials.credentials
    
    # Check if token is blacklisted
    if await token_blacklist.is_blacklisted(token):
        client_ip = request.client.host if request.client else "unknown"
        audit_logger.log_invalid_token(
            ip_address=client_ip,
            token_type="access",
            reason="Token is blacklisted"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )
    
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type – access token required",
        )

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing subject",
        )
    
    # Check if token was issued before user's last logout
    token_iat = payload.get("iat", 0)
    if isinstance(token_iat, (int, float)):
        if not await token_blacklist.is_token_valid_for_user(user_id, int(token_iat)):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated. Please login again.",
            )

    user = await User.get(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    
    # Store token in request state for potential logout
    request.state.current_token = token

    return user


def get_current_user() -> User:  # type: ignore[return]
    """Public dependency – returns the current authenticated user."""
    return Depends(_get_current_user)  # type: ignore[return-value]


def require_roles(allowed_roles: List[str]):
    """
    Factory that returns a dependency enforcing role-based access.

    Usage::

        @router.get("/admin", dependencies=[Depends(require_roles(["admin"]))])
        async def admin_only(): ...
    """

    async def _role_checker(
        request: Request,
        user: User = Depends(_get_current_user),
    ) -> User:
        if user.role not in allowed_roles:
            client_ip = request.client.host if request.client else "unknown"
            audit_logger.log_access_denied(
                user_id=str(user.id),
                user_email=user.email,
                ip_address=client_ip,
                resource=str(request.url.path),
                required_role=str(allowed_roles)
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not permitted. Required: {allowed_roles}",
            )
        return user
        return user

    return _role_checker
