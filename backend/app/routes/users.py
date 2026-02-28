"""
Verdant Backend – User routes (Part A)
Admin-level user management endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_roles
from app.models.users import User
from app.schemas.users import UserResponse
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user by ID (admin only)",
    dependencies=[Depends(require_roles(["admin"]))],
)
async def get_user(user_id: str) -> UserResponse:
    result = await user_service.get_user_by_id(user_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return result
