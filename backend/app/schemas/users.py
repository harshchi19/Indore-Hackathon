"""
Verdant Backend – User schemas (Part A)
Pydantic v2 request / response schemas for users & auth.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.db.base import UserRole


# ── Password complexity requirements ────────────────────────
PASSWORD_REQUIREMENTS = {
    "min_length": 8,
    "max_length": 128,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_digit": True,
    "require_special": True,
    "special_chars": "!@#$%^&*()_+-=[]{}|;:,.<>?"
}


def validate_password_complexity(password: str) -> str:
    """
    Validate password meets security requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if len(password) < PASSWORD_REQUIREMENTS["min_length"]:
        raise ValueError(f"Password must be at least {PASSWORD_REQUIREMENTS['min_length']} characters")
    
    if len(password) > PASSWORD_REQUIREMENTS["max_length"]:
        raise ValueError(f"Password must not exceed {PASSWORD_REQUIREMENTS['max_length']} characters")
    
    if PASSWORD_REQUIREMENTS["require_uppercase"] and not re.search(r'[A-Z]', password):
        raise ValueError("Password must contain at least one uppercase letter")
    
    if PASSWORD_REQUIREMENTS["require_lowercase"] and not re.search(r'[a-z]', password):
        raise ValueError("Password must contain at least one lowercase letter")
    
    if PASSWORD_REQUIREMENTS["require_digit"] and not re.search(r'\d', password):
        raise ValueError("Password must contain at least one digit")
    
    if PASSWORD_REQUIREMENTS["require_special"]:
        special_pattern = re.escape(PASSWORD_REQUIREMENTS["special_chars"])
        if not re.search(f'[{special_pattern}]', password):
            raise ValueError("Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)")
    
    # Check for common weak patterns
    common_weak = ['password', '12345678', 'qwerty', 'letmein', 'welcome']
    if password.lower() in common_weak:
        raise ValueError("Password is too common. Please choose a stronger password")
    
    return password


# ── Auth request bodies ─────────────────────────────────────
class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=120)
    role: UserRole = UserRole.CONSUMER

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validate_password_complexity(v)


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


# ── Auth response bodies ────────────────────────────────────
class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: UserRole
    is_active: bool
    wallet_balance: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    detail: str
