# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Config Mutation Unit Tests
# ====================================================================
import main
from fastapi.testclient import TestClient

client = TestClient(main.app)


def test_dynamic_threshold_mutation_success():
    """Asserts that valid POST payloads dynamically overwrite memory tracking configurations."""
    # Force initialize a controlled target configuration footprint
    main.WHALE_THRESHOLDS["BTC/USDT"] = 5000000.0

    response = client.post(
        "/config/thresholds", json={"symbol": "BTC-USDT", "threshold": 2500000.0}
    )
    assert response.status_code == 200
    assert response.json()["updated_threshold"] == 2500000.0
    # Confirm active system memory lookup matrix values changed dynamically
    assert main.WHALE_THRESHOLDS["BTC/USDT"] == 2500000.0


def test_dynamic_threshold_mutation_validation_bounds():
    """Verifies that non-positive allocation metrics trigger strict validation failures."""
    response = client.post(
        "/config/thresholds", json={"symbol": "BTC-USDT", "threshold": -500.0}
    )
    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Threshold allocation bounds must be a positive numeric metric float"
    )


def test_dynamic_threshold_mutation_missing_symbol():
    """Asserts that unconfigured symbol mutations trigger proper fallback 404 paths."""
    response = client.post(
        "/config/thresholds",
        json={"symbol": "SHIB-USDT", "threshold": 100000.0},
    )
    assert response.status_code == 404
    assert (
        response.json()["detail"]
        == "Target symbol asset not configured in workspace thresholds mapping"
    )
