"""
Verdant Backend – Auth dependencies (Part A)
FastAPI dependency injection for current-user resolution & RBAC.
"""

from __future__ import annotations

from typing import List

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import decode_token
from app.models.users import User

_bearer_scheme = HTTPBearer(auto_error=True)


async def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> User:
    """Resolve the authenticated user from the Bearer token."""
    token = credentials.credentials
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
        user: User = Depends(_get_current_user),
    ) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role}' is not permitted. Required: {allowed_roles}",
            )
        return user

    return _role_checker
