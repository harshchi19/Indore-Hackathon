import hashlib
import json
from typing import Any, Dict


def compute_sha256_hash(data: Dict[str, Any]) -> str:
    """Compute SHA-256 hash of a dictionary (JSON serialized)."""
    # Sort keys for consistent hashing
    json_str = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(json_str.encode()).hexdigest()


def verify_sha256_hash(data: Dict[str, Any], expected_hash: str) -> bool:
    """Verify that data matches the expected SHA-256 hash."""
    computed_hash = compute_sha256_hash(data)
    return computed_hash == expected_hash
