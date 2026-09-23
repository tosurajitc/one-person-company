"""
crypto.py

Symmetric encryption utility for securing sensitive user data (such as BYOK API keys) at rest.
Uses AES-GCM style encryption via cryptography.fernet.Fernet with a key derived from SECRET_KEY.
"""

from __future__ import annotations

import base64
import hashlib
import logging
from typing import Optional

from cryptography.fernet import Fernet
from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet:
    """
    Derive a 32-byte url-safe base64 key from the application SECRET_KEY.
    Ensures deterministic encryption/decryption keying across server restarts.
    """
    # Use SHA-256 of SECRET_KEY to get exactly 32 bytes
    secret_bytes = (settings.SECRET_KEY or "fallback_secret_key_32_bytes_length!!").encode("utf-8")
    key_32 = hashlib.sha256(secret_bytes).digest()
    url_safe_key = base64.urlsafe_b64encode(key_32)
    return Fernet(url_safe_key)


def encrypt_secret(plain_text: str) -> str:
    """
    Encrypts a plain text secret (e.g., API key) and returns a url-safe ASCII ciphertext.
    """
    if not plain_text:
        return ""
    try:
        f = _get_fernet()
        encrypted = f.encrypt(plain_text.strip().encode("utf-8"))
        return encrypted.decode("utf-8")
    except Exception as e:
        logger.error("Failed to encrypt secret: %s", e)
        raise ValueError("Encryption failed") from e


def decrypt_secret(cipher_text: str) -> Optional[str]:
    """
    Decrypts a ciphertext and returns the plain text string.
    Returns None if decryption fails or input is empty.
    """
    if not cipher_text:
        return None
    try:
        f = _get_fernet()
        decrypted = f.decrypt(cipher_text.encode("utf-8"))
        return decrypted.decode("utf-8")
    except Exception as e:
        logger.error("Failed to decrypt secret: %s", e)
        return None


def mask_api_key(api_key: str) -> str:
    """
    Produce a safe masked hint like 'sk-ant...4a9f' or 'gsk_...9b2a' for UI display.
    """
    if not api_key:
        return ""
    key = api_key.strip()
    if len(key) <= 8:
        return key[:2] + "..." + key[-2:]
    return f"{key[:6]}...{key[-4:]}"
