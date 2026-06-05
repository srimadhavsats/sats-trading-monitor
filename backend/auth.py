# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Security Authentication Manager
# ====================================================================
import os
import secrets


class SecurityAuthenticator:
    """
    Handles cryptographic verification and token matching parameters
    for incoming full-duplex client handshake connections.
    """

    def __init__(self):
        # Ingest pre-shared secure telemetry key parameter from environment variables
        self._secret_token = os.getenv(
            "TELEMETRY_AUTH_TOKEN", "sats_dev_fallback_secure_token_2026"
        )

    def validate_handshake_token(self, token: str) -> bool:
        """
        Validates the incoming client credential token string.
        Utilizes a constant-time comparison helper to mitigate timing side-channel attacks.
        """
        if not token:
            return False

        # Secure constant-time bytes comparison string check
        return secrets.compare_digest(
            token.encode("utf-8"), self._secret_token.encode("utf-8")
        )
