# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Worker Integration Tests
# ====================================================================
from fastapi.testclient import TestClient
from main import GLOBAL_MARKET_CACHE, app

client = TestClient(app)


def test_websocket_instant_cache_delivery():
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

    auth_token = "sats_dev_fallback_secure_token_2026"
    # Establish a test connection to the full-duplex WebSocket route using the client context
    with client.websocket_connect(
        f"/ws/price/BTC-USDT?token={auth_token}"
    ) as websocket:
        # Receive the immediate frame payload delivery
        data = websocket.receive_json()
        assert data["symbol"] == "BTC/USDT"
        assert data["price"] == 65000.0
