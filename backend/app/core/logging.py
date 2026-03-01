"""
Verdant Backend – Structured logging (Part A)
"""

from __future__ import annotations

import logging
import sys
from typing import Optional

from app.core.config import get_settings

settings = get_settings()

_LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s"
)


def setup_logging(level: Optional[str] = None) -> None:
    """Configure root logger with structured format."""
    effective_level = level or settings.LOG_LEVEL or ("DEBUG" if settings.DEBUG else "INFO")
    logging.basicConfig(
        level=effective_level,
        format=_LOG_FORMAT,
        datefmt="%Y-%m-%dT%H:%M:%S%z",
        stream=sys.stdout,
        force=True,
    )
    # Quieten noisy third-party loggers
    logging.getLogger("motor").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)
    logging.getLogger("pymongo.topology").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced logger."""
    return logging.getLogger(f"verdant.{name}")
