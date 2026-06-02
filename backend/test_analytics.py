# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Backend Unit Tests
# ====================================================================
import pytest
from analytics import MarketAnalytics


def test_calculate_volatility_spread_valid_bounds():
    """Validates computation integrity when processing standard market boundaries."""
    high_price = 105.0
    low_price = 100.0

    spread = MarketAnalytics.calculate_volatility_spread(high_price, low_price)

    assert isinstance(spread, float)
    assert spread >= 0.0


def test_calculate_volatility_spread_zero_division_safety():
    """Verifies fallback protections handle extreme or uninitialized zero floor values gracefully."""
    high_price = 0.0
    low_price = 0.0

    spread = MarketAnalytics.calculate_volatility_spread(high_price, low_price)

    assert isinstance(spread, float)
    assert spread == 0.0


def test_evaluate_whale_activity_above_boundary():
    """Asserts positive boolean state assignment when target parameters exceed the threshold limit."""
    volume = 600000.0
    threshold = 500000.0

    result = MarketAnalytics.evaluate_whale_activity(volume, threshold)

    assert isinstance(result, bool)
    assert result is True


def test_evaluate_whale_activity_below_boundary():
    """Asserts negative boolean state assignment when target parameters rest below the threshold limit."""
    volume = 400000.0
    threshold = 500000.0

    result = MarketAnalytics.evaluate_whale_activity(volume, threshold)

    assert isinstance(result, bool)
    assert result is False
