# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Connection Manager Tests
# ====================================================================
from unittest.mock import AsyncMock, MagicMock

import pytest
from connection_manager import ConnectionManager


@pytest.mark.asyncio
async def test_room_isolation_and_counting():
    """Asserts that separate symbol allocations create completely independent rooms."""
    manager = ConnectionManager()

    # Mock independent WebSocket client handshake entities
    mock_ws_btc = MagicMock()
    mock_ws_btc.accept = AsyncMock()

    mock_ws_eth = MagicMock()
    mock_ws_eth.accept = AsyncMock()

    # Establish connections across unique stream targets
    await manager.connect(mock_ws_btc, "BTC-USDT")
    await manager.connect(mock_ws_eth, "eth-usdt")  # Test casing tolerance implicitly

    # Verify connection maps maintain strict isolation boundaries
    assert manager.get_active_count("BTC-USDT") == 1
    assert manager.get_active_count("ETH-USDT") == 1
    assert mock_ws_btc in manager.active_connections["BTC-USDT"]
    assert mock_ws_eth in manager.active_connections["ETH-USDT"]


@pytest.mark.asyncio
async def test_clean_disconnect_and_garbage_collection():
    """Verifies that disconnecting channels triggers state pruning and clears empty rooms."""
    manager = ConnectionManager()
    mock_ws = MagicMock()
    mock_ws.accept = AsyncMock()

    await manager.connect(mock_ws, "SOL-USDT")
    assert manager.get_active_count("SOL-USDT") == 1

    # Execute disconnection routine
    manager.disconnect(mock_ws, "SOL-USDT")

    # Assert connection list is empty and room key has been garbage collected from heap memory
    assert manager.get_active_count("SOL-USDT") == 0
    assert "SOL-USDT" not in manager.active_connections
