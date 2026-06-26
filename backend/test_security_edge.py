# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Security Edge Integration Tests
# ====================================================================
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)


def test_server_side_regex_sanitization_exploit():
    """Asserts that malformed script parameters or bad regex characters get rejected immediately."""
    # Attempt a malicious parameter injection payload bypassing client validation
    malicious_payload = {
        "symbol": "BTC-USDT; DROP TABLE market_cache;--",
        "threshold": 1500000.0,
    }
    response = client.post("/config/thresholds", json=malicious_payload)

    # Assert that the server core catches the garbage input and drops the frame flat
    assert response.status_code == 400
    assert (
        response.json()["detail"] == "Malformed payload character footprints rejected"
    )


def test_global_exception_handler_obscures_traceback(monkeypatch):
    """Asserts that an unhandled runtime error hidden in a route returns a clean message instead of leaking data."""

    def mock_broken_metrics_lookup(*args, **kwargs):
        raise RuntimeError(
            "CRITICAL DATABASE CONN POOL TIMEOUT: ACCESS DENIED ON EXECUTABLE BINARY"
        )

    # Force a core route dependency to throw a raw internal system explosion
    monkeypatch.setattr(main.manager, "get_active_count", mock_broken_metrics_lookup)

    # Hit the metrics route to trigger the simulated system collapse
    response = client.get("/metrics/BTC-USDT")

    # Assertions: Must return a secure 500 status code
    assert response.status_code == 500
    # Crucial Validation: Make absolutely sure the messy traceback text is completely stripped from the output frame
    assert "CRITICAL DATABASE CONN POOL TIMEOUT" not in response.text
    assert (
        response.json()["detail"]
        == "Internal pipeline operation failure. Telemetry channel decoupled safely."
    )
