# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Cache Engine Unit Tests
# ====================================================================
import pytest
from cache import CacheEngine


def test_cache_set_and_get_history():
    """Validates basic write and read operations within an isolated channel cache."""
    engine = CacheEngine(max_size=5)
    test_symbol = "BTC-USDT"
    test_payload = {"price": 90000.0, "volume": 1.5}

    engine.set_tick(test_symbol, test_payload)
    history = engine.get_history(test_symbol)

    assert len(history) == 1
    assert history[0]["price"] == 90000.0


def test_cache_max_size_boundary_enforcement():
    """Verifies that the rolling cache strictly drops historical data when exceeding maximum bounds."""
    max_bound = 3
    engine = CacheEngine(max_size=max_bound)
    test_symbol = "ETH-USDT"

    # Inject data packets exceeding the defined ceiling limit
    for i in range(5):
        engine.set_tick(test_symbol, {"tick_index": i, "price": 3000.0 + i})

    history = engine.get_history(test_symbol)

    # Assert that the list length matches the cap and older entries were evicted
    assert len(history) == max_bound
    assert history[0]["tick_index"] == 2
    assert history[-1]["tick_index"] == 4


def test_cache_purge_channel_functionality():
    """Asserts that clearing an asset channel completely evicts its state allocation."""
    engine = CacheEngine(max_size=10)
    test_symbol = "SOL-USDT"

    engine.set_tick(test_symbol, {"price": 140.0})
    engine.purge_channel(test_symbol)

    history = engine.get_history(test_symbol)
    assert len(history) == 0
