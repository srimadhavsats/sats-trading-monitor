# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Data Caching Engine
# ====================================================================
from typing import Dict, List


class CacheEngine:
    """
    Abstract state persistence layer. Manages high-frequency message caches
    independently of connection or network socket lifecycles.
    """

    def __init__(self, max_size: int = 30):
        self._storage: Dict[str, List[dict]] = {}
        self.max_size = max_size

    def set_tick(self, symbol: str, payload: dict) -> None:
        """Appends an operational telemetry tick payload to a rolling channel cache."""
        if symbol not in self._storage:
            self._storage[symbol] = []

        self._storage[symbol].append(payload)

        # Enforce maximum boundary constraints on memory allocations
        if len(self._storage[symbol]) > self.max_size:
            self._storage[symbol] = self._storage[symbol][-self.max_size :]

    def get_history(self, symbol: str) -> List[dict]:
        """Retrieves the complete active historical array cached for an asset channel."""
        return self._storage.get(symbol, [])

    def purge_channel(self, symbol: str) -> None:
        """Clears memory vectors allocated to a designated ticker symbol."""
        if symbol in self._storage:
            del self._storage[symbol]
