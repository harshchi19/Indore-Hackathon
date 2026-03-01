"""
Verdant Backend – Wallet transaction document model
Tracks every wallet operation: deposits, energy purchases, sales, refunds.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional

from beanie import PydanticObjectId
from pydantic import Field

from app.db.base import TimestampedDocument


class WalletTxnType(str, Enum):
    DEPOSIT = "deposit"          # Add funds
    PURCHASE = "purchase"        # Energy purchase (debit)
    SALE = "sale"                # Energy sale credit (credit)
    REFUND = "refund"            # Refund on failed purchase
    WITHDRAWAL = "withdrawal"    # Future: withdraw to bank


class WalletTransaction(TimestampedDocument):
    """MongoDB document for wallet transaction log."""

    user_id: PydanticObjectId
    txn_type: WalletTxnType
    amount: float = Field(..., gt=0, description="Absolute amount in INR")
    balance_after: float = Field(..., description="Balance after this transaction")
    reference_id: Optional[str] = None  # e.g. contract_id, payment_id
    description: str = ""

    class Settings:
        name = "wallet_transactions"
        use_state_management = True
        indexes = [
            "user_id",
            "txn_type",
        ]
