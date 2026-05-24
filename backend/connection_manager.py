# ====================================================================
# SATS Sentinel v4.1 - WebSocket Connection Manager Engine
# ====================================================================
from typing import Dict, List

from fastapi import WebSocket
from logger import SentinelLogger


class ConnectionManager:
    """Centralized coordinator for managing active stateful full-duplex WebSocket channels."""

    def __init__(self):
        # Track active socket connections mapped by their target symbols
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, symbol: str):
        """Accepts a new client connection handshake and registers it to a target stream channel."""
        await websocket.accept()
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
        """Broadcasts a telemetry payload to all active subscribers tracking a target symbol."""
        if symbol in self.active_connections:
            for connection in self.active_connections[symbol]:
                try:
                    await connection.send_json(message)
                except Exception:
                    # Stale connection safety handler to prevent broadcasting interruptions
                    pass
