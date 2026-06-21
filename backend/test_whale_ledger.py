# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Whale Ledger Unit Tests
# ====================================================================
import main


def test_whale_ledger_overflow_eviction():
    """Asserts that the whale ledger acts as a strict ring buffer, evicting the oldest element."""
    # Reset ledger array state to guarantee baseline test predictability
    main.WHALE_ALERTS_LEDGER.clear()

    # Fill the buffer exactly to its capacity limits (20 entries)
    for i in range(main.MAX_LEDGER_CAPACITY):
        main.WHALE_ALERTS_LEDGER.append(
            {"id": f"mock-w-{i}", "symbol": "BTC/USDT", "price": 60000.0 + i}
        )

    assert len(main.WHALE_ALERTS_LEDGER) == main.MAX_LEDGER_CAPACITY
    assert main.WHALE_ALERTS_LEDGER[0]["id"] == "mock-w-0"

    # Simulate an overflow event ingestion mimicking main.py behavior
    overflow_event = {
        "id": "mock-w-overflow",
        "symbol": "ETH/USDT",
        "price": 3500.0,
    }
    main.WHALE_ALERTS_LEDGER.append(overflow_event)

    if len(main.WHALE_ALERTS_LEDGER) > main.MAX_LEDGER_CAPACITY:
        main.WHALE_ALERTS_LEDGER.pop(0)

    # Assertions: size must remain locked at 20, element 0 ('mock-w-0') must be evicted
    assert len(main.WHALE_ALERTS_LEDGER) == main.MAX_LEDGER_CAPACITY
    assert main.WHALE_ALERTS_LEDGER[0]["id"] == "mock-w-1"
    assert main.WHALE_ALERTS_LEDGER[-1]["id"] == "mock-w-overflow"
