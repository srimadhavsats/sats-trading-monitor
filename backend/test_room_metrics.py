# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Room Metrics Unit Tests
# ====================================================================
from fastapi.testclient import TestClient
from main import app, manager

client = TestClient(app)


def test_all_room_metrics_aggregation():
    """Asserts that the /metrics/rooms/all route maps out channel allocations accurately."""
    # Reset internal manager states to guarantee test path predictability
    manager.active_connections.clear()

    # Artificially populate isolated symbol rooms with mock connection placeholders
    manager.active_connections["BTC-USDT"] = [None, None, None]  # 3 connections
    manager.active_connections["ETH-USDT"] = [None]  # 1 connection

    response = client.get("/metrics/rooms/all")
    assert response.status_code == 200

    payload = response.json()
    # Confirm structural count boundaries match internal memory tracking sets
    assert payload["BTC-USDT"] == 3
    assert payload["ETH-USDT"] == 1
    assert "SOL-USDT" not in payload
