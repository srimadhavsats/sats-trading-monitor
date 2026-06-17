# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Shared Connection Manager
# ====================================================================
from typing import Dict, List

from fastapi import WebSocket
from logger import SentinelLogger


class ConnectionManager:
    """
    Manages stateful, full-duplex WebSocket channels across independent
    symbol rooms to achieve isolated, thread-safe data distribution.
    """

    def __init__(self) -> None:
        # Structured lookup matrix: Mapping dynamic symbols to lists of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, symbol: str) -> None:
        """Accepts an incoming socket upgrade handshake and assigns it to a room."""
        await websocket.accept()
        symbol_key = symbol.upper()

        if symbol_key not in self.active_connections:
            self.active_connections[symbol_key] = []

        self.active_connections[symbol_key].append(websocket)
        SentinelLogger.info(
            f"Channel registered cleanly. Subscribed to stream vector: [{symbol_key}]"
        )

    def disconnect(self, websocket: WebSocket, symbol: str) -> None:
        """Evicts a terminated client socket cleanly from its designated symbol allocation room."""
        symbol_key = symbol.upper()
        if symbol_key in self.active_connections:
            if websocket in self.active_connections[symbol_key]:
                self.active_connections[symbol_key].remove(websocket)
                SentinelLogger.info(
                    f"Channel disconnected cleanly. Evicted from stream vector: [{symbol_key}]"
                )

            # Garbage collect empty channel keys to free heap memory allocations
            if not self.active_connections[symbol_key]:
                del self.active_connections[symbol_key]

    def get_active_count(self, symbol: str) -> int:
        """Returns the total number of active telemetry consumers inside a target pool room."""
        return len(self.active_connections.get(symbol.upper(), []))

    async def broadcast_to_symbol(self, symbol: str, message: dict) -> None:
        """Broadcasts a telemetry payload frame exclusively to clients matching the target symbol room."""
        symbol_key = symbol.upper()
        target_sockets = self.active_connections.get(symbol_key, [])

        if not target_sockets:
            return

        # Distribute updates across all connected nodes concurrently
        for websocket in list(target_sockets):
            try:
                await websocket.send_json(message)
            except Exception:
                # Shield the broadcast thread from dead sockets; handle pruning via standard disconnect
                self.disconnect(websocket, symbol_key)
