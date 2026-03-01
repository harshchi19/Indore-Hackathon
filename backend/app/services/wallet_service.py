"""
Verdant Backend – Wallet service
Balance queries, funds addition, transfer operations, and transaction log.
"""

from __future__ import annotations

from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.models.users import User
from app.models.wallet import WalletTransaction, WalletTxnType

logger = get_logger("services.wallet")


async def get_balance(user_id: str) -> dict:
    """Return the wallet balance for the given user."""
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {
        "user_id": str(user.id),
        "wallet_balance": user.wallet_balance,
        "currency": "INR",
    }


async def add_funds(user_id: str, amount: float) -> dict:
    """Add funds to the user's wallet."""
    if amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive",
        )
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.wallet_balance = round(user.wallet_balance + amount, 2)
    await user.save()

    # Log transaction
    await WalletTransaction(
        user_id=user.id,
        txn_type=WalletTxnType.DEPOSIT,
        amount=amount,
        balance_after=user.wallet_balance,
        description=f"Added ₹{amount:.2f} to wallet",
    ).insert()

    logger.info("Funds added: user=%s amount=₹%.2f new_balance=₹%.2f", user.email, amount, user.wallet_balance)
    return {
        "user_id": str(user.id),
        "wallet_balance": user.wallet_balance,
        "amount_added": amount,
        "currency": "INR",
    }


async def deduct_balance(user_id: str, amount: float, reference_id: str | None = None) -> float:
    """
    Deduct amount from user's wallet. Returns new balance.
    Raises 400 if insufficient funds.
    """
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.wallet_balance < amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient balance. Available: ₹{user.wallet_balance:.2f}, Required: ₹{amount:.2f}",
        )

    user.wallet_balance = round(user.wallet_balance - amount, 2)
    await user.save()

    # Log transaction
    await WalletTransaction(
        user_id=user.id,
        txn_type=WalletTxnType.PURCHASE,
        amount=amount,
        balance_after=user.wallet_balance,
        reference_id=reference_id,
        description=f"Energy purchase – ₹{amount:.2f}",
    ).insert()

    logger.info("Balance deducted: user=%s amount=₹%.2f new_balance=₹%.2f", user.email, amount, user.wallet_balance)
    return user.wallet_balance


async def credit_balance(
    user_id: str,
    amount: float,
    txn_type: WalletTxnType = WalletTxnType.SALE,
    reference_id: str | None = None,
    description: str | None = None,
) -> float:
    """
    Credit amount to user's wallet (e.g. seller payout, refund). Returns new balance.
    """
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.wallet_balance = round(user.wallet_balance + amount, 2)
    await user.save()

    # Log transaction
    await WalletTransaction(
        user_id=user.id,
        txn_type=txn_type,
        amount=amount,
        balance_after=user.wallet_balance,
        reference_id=reference_id,
        description=description or f"{'Refund' if txn_type == WalletTxnType.REFUND else 'Energy sale credit'} – ₹{amount:.2f}",
    ).insert()

    logger.info("Balance credited: user=%s amount=₹%.2f new_balance=₹%.2f", user.email, amount, user.wallet_balance)
    return user.wallet_balance


async def list_transactions(
    user_id: str,
    txn_type: Optional[WalletTxnType] = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    """Return paginated wallet transactions for a user, newest first."""
    conditions: dict = {"user_id": PydanticObjectId(user_id)}
    if txn_type:
        conditions["txn_type"] = txn_type.value

    total = await WalletTransaction.find(conditions).count()
    items = await (
        WalletTransaction.find(conditions)
        .sort("-created_at")
        .skip(skip)
        .limit(limit)
        .to_list()
    )
    return {
        "total": total,
        "items": [
            {
                "id": str(t.id),
                "txn_type": t.txn_type.value,
                "amount": t.amount,
                "balance_after": t.balance_after,
                "reference_id": t.reference_id,
                "description": t.description,
                "created_at": t.created_at.isoformat(),
            }
            for t in items
        ],
    }
