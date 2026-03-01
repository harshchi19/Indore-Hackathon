"""
Verdant – Seed MongoDB with dummy data
Reads JSON files from dummydata/ folder and inserts them into MongoDB.
Hashes passwords with Argon2 before inserting users.

Usage:
    cd backend
    py dummydata/seed_db.py            # uses .env / defaults
    py dummydata/seed_db.py --drop     # drop existing collections first
"""

import argparse
import json
import os
import sys

# Add backend root to path so we can import app modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from bson import ObjectId
from pymongo import MongoClient
from argon2 import PasswordHasher

# ── Config ──────────────────────────────────────────────────
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
DUMMY_PASSWORD = "Verdant@123"

# Load from env or use defaults
MONGODB_URI = os.environ.get("MONGODB_URI", None)
MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "verdant")

# Try loading .env file
env_path = os.path.join(DATA_DIR, "..", ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key == "MONGODB_URI" and not MONGODB_URI:
                    MONGODB_URI = val
                elif key == "MONGODB_DB_NAME":
                    MONGODB_DB_NAME = val

if not MONGODB_URI:
    MONGODB_URI = "mongodb://localhost:27017"

# ── Password Hasher (same config as app) ────────────────────
_ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

# ── Collections to seed (in order for referential integrity) ─
COLLECTIONS = [
    ("users", "users.json"),
    ("producers", "producers.json"),
    ("energy_listings", "energy_listings.json"),
    ("contracts", "contracts.json"),
    ("certificates", "certificates.json"),
    ("payments", "payments.json"),
    ("disputes", "disputes.json"),
    ("smart_meter_readings", "smart_meter_readings.json"),
]

def convert_oid_fields(doc: dict) -> dict:
    """Convert string _id and *_id fields to ObjectId for MongoDB."""
    oid_fields = [
        "_id", "owner_id", "producer_id", "buyer_id", "listing_id",
        "contract_id", "raised_by", "verified_by",
    ]
    for key in oid_fields:
        if key in doc and doc[key] is not None:
            try:
                doc[key] = ObjectId(doc[key])
            except Exception:
                pass  # leave as-is if not a valid OID

    # Handle nested audit_log actor fields
    if "audit_log" in doc:
        for entry in doc["audit_log"]:
            try:
                entry["actor"] = ObjectId(entry["actor"])
            except Exception:
                pass
    return doc


def seed(drop: bool = False):
    print(f"Connecting to MongoDB: {MONGODB_URI}")
    print(f"Database: {MONGODB_DB_NAME}\n")

    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]

    # Hash the password once
    print(f"Hashing password '{DUMMY_PASSWORD}' with Argon2id...")
    hashed = _ph.hash(DUMMY_PASSWORD)
    print(f"  ✓ Hash: {hashed[:40]}...\n")

    total = 0

    for coll_name, filename in COLLECTIONS:
        filepath = os.path.join(DATA_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  ⚠ {filename} not found — skipping {coll_name}")
            continue

        with open(filepath, "r", encoding="utf-8") as f:
            documents = json.load(f)

        # Drop if requested
        if drop:
            db[coll_name].drop()

        # Process documents
        for doc in documents:
            convert_oid_fields(doc)

            # Replace password placeholder for users
            if coll_name == "users" and doc.get("hashed_password") == "__PLACEHOLDER__":
                doc["hashed_password"] = hashed

        # Insert
        if documents:
            result = db[coll_name].insert_many(documents)
            count = len(result.inserted_ids)
            total += count
            print(f"  ✓ {coll_name}: {count} documents inserted")
        else:
            print(f"  - {coll_name}: 0 documents (empty file)")

    print(f"\n{'='*50}")
    print(f"✅ Seeding complete! {total} total documents inserted.")
    print(f"\nTest credentials:")
    print(f"  Admin:    admin@verdant.io / {DUMMY_PASSWORD}")
    print(f"  Producer: producer1@verdant.io / {DUMMY_PASSWORD}")
    print(f"  Consumer: consumer1@verdant.io / {DUMMY_PASSWORD}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Verdant MongoDB with dummy data")
    parser.add_argument("--drop", action="store_true", help="Drop existing collections before seeding")
    args = parser.parse_args()
    seed(drop=args.drop)
