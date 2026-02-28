"""
Verdant Backend – User document model (Part A)
"""

from __future__ import annotations

from typing import Optional

from pydantic import EmailStr, Field

from app.db.base import TimestampedDocument, UserRole


class User(TimestampedDocument):
    """MongoDB document for platform users."""

    email: EmailStr
    hashed_password: str
    full_name: str = Field(..., min_length=1, max_length=120)
    role: UserRole = UserRole.CONSUMER
    is_active: bool = True
    refresh_token: Optional[str] = None

    class Settings:
        name = "users"
        use_state_management = True
        indexes = [
            "email",
        ]
