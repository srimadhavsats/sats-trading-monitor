# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Worker Integration Tests
# ====================================================================
import main
from fastapi.testclient import TestClient
from main import GLOBAL_MARKET_CACHE, app

client = TestClient(app)


def test_websocket_instant_cache_delivery(monkeypatch):
    """Asserts that the WebSocket endpoint instantly pushes the latest cached market snapshot."""
    # Inject a mock dataset directly into the global cache mapping structure
    GLOBAL_MARKET_CACHE["BTC-USDT"] = {
        "symbol": "BTC/USDT",
        "price": 65000.0,
        "high": 66000.0,
        "low": 64000.0,
        "volume": 1500000.0,
        "change": 1.5,
        "spread": 0.03,
        "is_whale": False,
        "whale_alert": False,
        "whale_threshold": 5000000.0,
    }

    # 1. Seamlessly mock token validation check to return True during test execution
    monkeypatch.setattr(
        main.authenticator, "validate_handshake_token", lambda token: True
    )

    # 2. Extract a valid configured origin domain string dynamically
    valid_origin = (
        main.ALLOWED_ORIGINS[0] if main.ALLOWED_ORIGINS else "http://localhost:5173"
    )

    # Establish test connection with appropriate headers to pass network filters cleanly
    with client.websocket_connect(
        "/ws/price/BTC-USDT?token=mock_test_token",
        headers={"origin": valid_origin},
    ) as websocket:
        # Receive the immediate frame payload delivery
        data = websocket.receive_json()
        assert data["symbol"] == "BTC/USDT"
        assert data["price"] == 65000.0
