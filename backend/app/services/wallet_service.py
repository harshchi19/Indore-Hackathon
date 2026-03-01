"""
Verdant Backend – Wallet service
Balance queries, funds addition, and transfer operations.
"""

from __future__ import annotations

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.core.logging import get_logger
from app.models.users import User

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
    logger.info("Funds added: user=%s amount=₹%.2f new_balance=₹%.2f", user.email, amount, user.wallet_balance)
    return {
        "user_id": str(user.id),
        "wallet_balance": user.wallet_balance,
        "amount_added": amount,
        "currency": "INR",
    }


async def deduct_balance(user_id: str, amount: float) -> float:
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
    logger.info("Balance deducted: user=%s amount=₹%.2f new_balance=₹%.2f", user.email, amount, user.wallet_balance)
    return user.wallet_balance


async def credit_balance(user_id: str, amount: float) -> float:
    """
    Credit amount to user's wallet (e.g. seller payout). Returns new balance.
    """
    user = await User.get(PydanticObjectId(user_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.wallet_balance = round(user.wallet_balance + amount, 2)
    await user.save()
    logger.info("Balance credited: user=%s amount=₹%.2f new_balance=₹%.2f", user.email, amount, user.wallet_balance)
    return user.wallet_balance
