"""
Verdant Backend – Wallet routes
GET /wallet/balance, POST /wallet/add-funds
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.auth import _get_current_user
from app.models.users import User
from app.services import wallet_service

router = APIRouter(prefix="/wallet", tags=["Wallet"])


class AddFundsRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR to add")


@router.get(
    "/balance",
    summary="Get current wallet balance",
)
async def get_balance(
    current_user: User = Depends(_get_current_user),
) -> dict:
    return await wallet_service.get_balance(str(current_user.id))


@router.post(
    "/add-funds",
    summary="Add funds to wallet",
)
async def add_funds(
    payload: AddFundsRequest,
    current_user: User = Depends(_get_current_user),
) -> dict:
    return await wallet_service.add_funds(str(current_user.id), payload.amount)
