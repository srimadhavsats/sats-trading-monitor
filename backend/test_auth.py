# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Authentication Unit Tests
# ====================================================================
import pytest
from auth import SecurityAuthenticator


def test_security_authenticator_valid_token():
    """Asserts positive authentication state when given a matching secret signature."""
    auth = SecurityAuthenticator()
    # Verifies matching parameters resolve to True
    assert auth.validate_handshake_token("sats_dev_fallback_secure_token_2026") is True


def test_security_authenticator_invalid_token():
    """Asserts negative authentication state when a non-matching signature vector is processed."""
    auth = SecurityAuthenticator()
    # Verifies non-matching strings reject as False
    assert auth.validate_handshake_token("unauthorized_malicious_token_string") is False


def test_security_authenticator_empty_token():
    """Verifies uninitialized or empty string inputs fail verification boundaries cleanly."""
    auth = SecurityAuthenticator()
    # Verifies empty bounds evaluate as False
    assert auth.validate_handshake_token("") is False
