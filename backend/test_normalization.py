# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Normalization Unit Tests
# ====================================================================
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_metrics_endpoint_casing_normalization():
    """Asserts that lowercase symbol parameters are normalized to uppercase structures."""
    # Requesting metrics with lowercase parameter 'sol-usdt'
    response = client.get("/metrics/sol-usdt")
    assert response.status_code == 200

    payload = response.json()
    # The response object must return the strictly normalized uppercase tracking token
    assert payload["symbol"] == "SOL-USDT"
    assert "active_connections" in payload


def test_metrics_endpoint_malformed_rejection():
    """Verifies that non-whitelisted characters trigger explicit validation errors."""
    # Passing illegal characters across the dynamic routing path
    response = client.get("/metrics/BTC_USDT$")
    assert response.status_code == 400
    assert (
        response.json()["detail"] == "Malformed character format inside parameter field"
    )
