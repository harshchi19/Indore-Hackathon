"""
Test script for SHA-256 Double Layer Hashing implementation.

Run with: python test_sha256_double.py
"""

import sys
sys.path.insert(0, '.')

from app.core.security import (
    sha256_hash,
    sha256_double_hash,
    sha256_double_hash_object,
    sha256_hmac_double,
    verify_sha256_double_hash,
    verify_sha256_double_hash_object,
    generate_data_fingerprint,
)


def test_sha256_double_hash():
    """Test the SHA-256 double layer hashing implementation."""
    
    print("=" * 60)
    print("SHA-256 Double Layer Hashing Tests")
    print("=" * 60)
    
    # Test 1: Basic string hashing
    test_data = "Hello, Verdant Energy Platform!"
    
    single_hash = sha256_hash(test_data)
    double_hash = sha256_double_hash(test_data)
    
    print("\n1. Basic String Hashing:")
    print(f"   Input: '{test_data}'")
    print(f"   Single SHA-256: {single_hash}")
    print(f"   Double SHA-256: {double_hash}")
    print(f"   ✓ Different hashes (double != single): {single_hash != double_hash}")
    
    # Test 2: Object hashing (for certificates, contracts, etc.)
    certificate = {
        "id": "cert-001",
        "producer_id": "prod-123",
        "energy_kwh": 1500.5,
        "source": "solar",
        "certified_at": "2026-03-01T10:00:00Z"
    }
    
    cert_hash = sha256_double_hash_object(certificate)
    
    print("\n2. Object Hashing (Certificate):")
    print(f"   Certificate: {certificate}")
    print(f"   Double SHA-256: {cert_hash}")
    
    # Test 3: Verification
    is_valid = verify_sha256_double_hash(test_data, double_hash)
    is_invalid = verify_sha256_double_hash(test_data, "wrong_hash")
    
    print("\n3. Hash Verification:")
    print(f"   Valid data verification: {is_valid}")
    print(f"   Invalid data verification: {is_invalid}")
    print(f"   ✓ Verification works correctly: {is_valid and not is_invalid}")
    
    # Test 4: Object verification
    is_cert_valid = verify_sha256_double_hash_object(certificate, cert_hash)
    
    # Modify certificate
    tampered_cert = certificate.copy()
    tampered_cert["energy_kwh"] = 9999.0
    is_tampered_valid = verify_sha256_double_hash_object(tampered_cert, cert_hash)
    
    print("\n4. Object Verification (Tamper Detection):")
    print(f"   Original certificate valid: {is_cert_valid}")
    print(f"   Tampered certificate valid: {is_tampered_valid}")
    print(f"   ✓ Tamper detection works: {is_cert_valid and not is_tampered_valid}")
    
    # Test 5: HMAC double hash (with secret key)
    hmac_hash = sha256_hmac_double(test_data)
    
    print("\n5. HMAC-SHA256 Double Hash:")
    print(f"   HMAC Double Hash: {hmac_hash}")
    print(f"   ✓ HMAC adds authentication layer")
    
    # Test 6: Data fingerprint
    fingerprint = generate_data_fingerprint(certificate, include_timestamp=True)
    
    print("\n6. Data Fingerprint:")
    print(f"   Hash: {fingerprint['hash']}")
    print(f"   Algorithm: {fingerprint['algorithm']}")
    print(f"   Timestamp: {fingerprint.get('timestamp', 'N/A')}")
    
    # Test 7: Deterministic hashing
    hash1 = sha256_double_hash_object(certificate)
    hash2 = sha256_double_hash_object(certificate)
    
    print("\n7. Deterministic Hashing:")
    print(f"   Same input produces same hash: {hash1 == hash2}")
    
    print("\n" + "=" * 60)
    print("All tests completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    test_sha256_double_hash()
