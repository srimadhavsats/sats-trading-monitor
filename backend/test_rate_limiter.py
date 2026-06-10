# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Rate Limiter Unit Tests
# ====================================================================
import time

import pytest
from rate_limiter import SlidingWindowRateLimiter


def test_rate_limiter_under_limit():
    """Asserts that requests tracking below structural ceilings pass cleanly."""
    limiter = SlidingWindowRateLimiter(window_seconds=10.0, max_requests=3)
    assert limiter.is_rate_limited("127.0.0.1") is False
    assert limiter.is_rate_limited("127.0.0.1") is False


def test_rate_limiter_threshold_breach():
    """Asserts that requests crossing limit boundaries trigger throttling actions."""
    limiter = SlidingWindowRateLimiter(window_seconds=10.0, max_requests=2)
    assert limiter.is_rate_limited("192.168.1.1") is False
    assert limiter.is_rate_limited("192.168.1.1") is False
    # The third immediate request crosses the threshold ceiling and must be dropped
    assert limiter.is_rate_limited("192.168.1.1") is True


def test_rate_limiter_cache_clear():
    """Verifies that clearing host history resets tracking buckets cleanly."""
    limiter = SlidingWindowRateLimiter(window_seconds=10.0, max_requests=1)
    assert limiter.is_rate_limited("10.0.0.1") is False
    assert limiter.is_rate_limited("10.0.0.1") is True

    # Reset internal memory cache state for target tracking vector
    limiter.clear_history("10.0.0.1")
    assert limiter.is_rate_limited("10.0.0.1") is False
