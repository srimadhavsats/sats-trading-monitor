# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Sliding Window Rate Limiter
# ====================================================================
import time
from typing import Dict, List


class SlidingWindowRateLimiter:
    """
    In-memory structural utility enforcing sliding window traffic throttling
    limits uniformly across client host identifiers.
    """

    def __init__(self, window_seconds: float = 60.0, max_requests: int = 10):
        self.window_seconds = window_seconds
        self.max_requests = max_requests
        self._cache: Dict[str, List[float]] = {}

    def is_rate_limited(self, host: str) -> bool:
        """
        Evaluates the call velocity for a designated client host IP.
        Returns True if request occurrences cross limit ceilings within the active window.
        """
        current_time = time.time()

        if host not in self._cache:
            self._cache[host] = []

        # Evict stale tracking records that have fallen outside the sliding boundary
        self._cache[host] = [
            t for t in self._cache[host] if current_time - t < self.window_seconds
        ]

        if len(self._cache[host]) >= self.max_requests:
            return True

        self._cache[host].append(current_time)
        return False

    def clear_history(self, host: str) -> None:
        """Flushes the metric history allocated to a specific tracking target."""
        if host in self._cache:
            del self._cache[host]
