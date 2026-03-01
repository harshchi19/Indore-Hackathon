"""
Verdant Backend – Wallet routes
GET /wallet/balance, POST /wallet/add-funds, GET /wallet/transactions
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.core.auth import _get_current_user
from app.models.users import User
from app.models.wallet import WalletTxnType
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


@router.get(
    "/transactions",
    summary="Get wallet transaction history (newest first)",
)
async def list_transactions(
    txn_type: Optional[WalletTxnType] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: User = Depends(_get_current_user),
) -> dict:
    return await wallet_service.list_transactions(
        str(current_user.id), txn_type, skip, limit,
    )
