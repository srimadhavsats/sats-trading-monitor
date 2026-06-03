# ====================================================================
# SATS High-Frequency Telemetry Pipeline - WebSocket Connection Manager
# ====================================================================
from typing import Dict, List

from fastapi import WebSocket
from logger import SentinelLogger


class ConnectionManager:
    """Centralized coordinator for managing active stateful full-duplex WebSocket channels."""

    def __init__(self):
        # Track active socket connections mapped by their target symbols
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # In-memory rolling historical message cache to enable immediate client state seating
        self.history_cache: Dict[str, List[dict]] = {}
        # Bound historical allocation alignment match for client viewport tick limits
        self.max_cache_length = 30

    async def connect(self, websocket: WebSocket, symbol: str):
        """Accepts a new client connection handshake, replays cached historical data, and registers the socket."""
        await websocket.accept()

        # Stateful Recovery: Replay rolling historical data to instantly seed client charting states
        if symbol in self.history_cache:
            for cached_payload in self.history_cache[symbol]:
                try:
                    await websocket.send_json(cached_payload)
                except Exception:
                    # Catch early transport closures cleanly
                    pass

        if symbol not in self.active_connections:
            self.active_connections[symbol] = []
        self.active_connections[symbol].append(websocket)
        SentinelLogger.info(
            f"Channel Activated: New client registered for stream [{symbol}]."
        )

    def disconnect(self, websocket: WebSocket, symbol: str):
        """Removes a stale or dropped client connection from the tracking registry."""
        if symbol in self.active_connections:
            if websocket in self.active_connections[symbol]:
                self.active_connections[symbol].remove(websocket)
                SentinelLogger.info(
                    f"Channel Deactivated: Client removed from stream [{symbol}]."
                )
            if not self.active_connections[symbol]:
                del self.active_connections[symbol]

    async def broadcast_to_symbol(self, symbol: str, message: dict):
        """Broadcasts a telemetry payload to subscribers and caches the transaction into state history."""
        # Stateful Control: Append incoming transactional snapshot into historical array cache bounds
        if symbol not in self.history_cache:
            self.history_cache[symbol] = []
        self.history_cache[symbol].append(message)
        self.history_cache[symbol] = self.history_cache[symbol][
            -self.max_cache_length :
        ]

        if symbol in self.active_connections:
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Stale connection safety handler to prevent broadcasting interruptions
                    pass

    def get_active_count(self, symbol: str) -> int:
        """Calculates the exact sequence length of open network sockets linked to an asset channel."""
        if symbol in self.active_connections:
            return len(self.active_connections[symbol])
        return 0
