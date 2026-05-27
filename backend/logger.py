# ====================================================================
# SATS Sentinel v4.1 - Centralized Logging Module
# ====================================================================
import sys


class SentinelLogger:
    """Centralized logging utility for standardizing console telemetry output formatting."""

    @staticmethod
    def startup(message: str):
        """Logs system initialization events to stdout."""
        print(f"⚡ SYSTEM STARTUP: {message}", flush=True)

    @staticmethod
    def info(message: str):
        """Logs informational operational states to stdout."""
        print(f"ℹ️ TELEMETRY INFO: {message}", flush=True)

    @staticmethod
    def broadcast(symbol: str, price: float):
        """Logs outbound streaming data transmission metrics to stdout."""
        print(
            f"📡 BROADCAST: Channel [{symbol}] transmission at price {price}",
            flush=True,
        )

    @staticmethod
    def error(message: str):
        """Logs runtime error anomalies and execution pipeline faults to stderr."""
        print(f"❌ PIPELINE ERROR: {message}", file=sys.stderr, flush=True)
