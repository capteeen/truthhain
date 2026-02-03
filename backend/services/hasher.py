"""
SHA-256 Hashing Service
Provides consistent document hashing for verification.
"""

import hashlib
from pathlib import Path
from typing import Union


def compute_sha256(file_path: Union[str, Path]) -> str:
    """
    Compute SHA-256 hash of a file from disk.
    
    Args:
        file_path: Path to the file
        
    Returns:
        Hex-encoded SHA-256 hash string
    """
    sha256 = hashlib.sha256()
    
    with open(file_path, 'rb') as f:
        # Read in chunks for large files
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    
    return sha256.hexdigest()


def compute_sha256_bytes(content: bytes) -> str:
    """
    Compute SHA-256 hash of bytes content.
    
    Args:
        content: Raw bytes to hash
        
    Returns:
        Hex-encoded SHA-256 hash string
    """
    sha256 = hashlib.sha256()
    sha256.update(content)
    return sha256.hexdigest()


def hash_to_bytes(hash_hex: str) -> bytes:
    """
    Convert hex hash string to bytes array (for Solana).
    
    Args:
        hash_hex: Hex-encoded hash string
        
    Returns:
        32-byte array
    """
    return bytes.fromhex(hash_hex)


def bytes_to_hash(hash_bytes: bytes) -> str:
    """
    Convert bytes array to hex hash string.
    
    Args:
        hash_bytes: 32-byte hash array
        
    Returns:
        Hex-encoded hash string
    """
    return hash_bytes.hex()


def verify_hash(content: bytes, expected_hash: str) -> bool:
    """
    Verify that content matches an expected hash.
    
    Args:
        content: Raw bytes to verify
        expected_hash: Expected hex-encoded SHA-256 hash
        
    Returns:
        True if hashes match, False otherwise
    """
    computed = compute_sha256_bytes(content)
    return computed.lower() == expected_hash.lower()
