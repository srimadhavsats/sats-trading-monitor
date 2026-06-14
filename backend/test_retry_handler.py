# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Retry Engine Unit Tests
# ====================================================================
import pytest
from retry_handler import ResilientRetryHandler


def test_retry_handler_incremental_bounds():
    """Asserts that calculated backoff paths fall accurately within mathematical limits."""
    handler = ResilientRetryHandler(base_delay=1.0, max_delay=10.0, factor=2.0)

    # attempt 0: delay calculation cap = min(10.0, 1.0 * (2^0)) = 1.0
    delay = handler.calculate_next_delay()
    assert 0.0 <= delay <= 1.0

    # Advance state counter manually
    handler.attempts = 2  # min(10.0, 1.0 * (2^2)) = 4.0
    delay_advanced = handler.calculate_next_delay()
    assert 0.0 <= delay_advanced <= 4.0


def test_retry_handler_max_ceiling_enforcement():
    """Verifies that exponential growth loops are strictly capped by max_delay bounds."""
    handler = ResilientRetryHandler(base_delay=1.0, max_delay=5.0, factor=2.0)

    # Simulate a prolonged cascade dropout window
    handler.attempts = 20
    delay = handler.calculate_next_delay()

    # The output must respect the maximum limit even with extreme failure states
    assert delay <= 5.0


def test_retry_handler_state_flushing():
    """Asserts that state resets completely clear historical counter maps."""
    handler = ResilientRetryHandler()

    handler.increment_failure()
    handler.increment_failure()
    assert handler.attempts == 2

    # Flush structural metrics trace maps
    handler.reset()
    assert handler.attempts == 0
