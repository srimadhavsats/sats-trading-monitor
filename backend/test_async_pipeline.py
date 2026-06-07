# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Asynchronous Pipeline Tests
# ====================================================================
import asyncio
from unittest.mock import AsyncMock

from connection_manager import ConnectionManager


def test_connection_manager_async_lifecycle():
    """
    Validates asynchronous subscription registration and socket broadcast loop mechanics
    natively utilizing standalone execution loop wrappers.
    """
    manager = ConnectionManager()
    mock_websocket = AsyncMock()
    symbol = "LINK-USDT"
    test_payload = {"symbol": "LINK/USDT", "price": 18.25, "volume": 50000.0}

    # Execute asynchronous socket connection handshake natively within standard runtime context
    asyncio.run(manager.connect(mock_websocket, symbol))

    # Trigger full-duplex data broadcasting routine
    asyncio.run(manager.broadcast_to_symbol(symbol, test_payload))

    # Assert that the asynchronous communication layer successfully fired json distributions
    mock_websocket.send_json.assert_called_with(test_payload)
