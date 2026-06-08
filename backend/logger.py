# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Structured JSON Logging Layer
# ====================================================================
import datetime
import json
import sys


class SentinelLogger:
    """
    Unified system observability manager. Transforms pipeline event data
    into standardized, machine-readable JSON strings emitted to stdout.
    """

    @staticmethod
    def _emit(level: str, message: str, extra: dict = None) -> None:
        """Assembles the core metrics tracking structure and outputs the JSON string."""
        log_record = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "level": level.upper(),
            "message": message,
            "subsystem": "telemetry_pipeline",
        }
        if extra:
            log_record["meta"] = extra

        sys.stdout.write(json.dumps(log_record) + "\n")
        sys.stdout.flush()

    @staticmethod
    def startup(message: str) -> None:
        """Logs high-priority system boot initialization sequences."""
        SentinelLogger._emit("system_startup", message)

    @staticmethod
    def info(message: str) -> None:
        """Logs standard informational telemetry tracking states."""
        SentinelLogger._emit("info", message)

    @staticmethod
    def error(message: str, extra: dict = None) -> None:
        """Logs structural exceptions or operational connection errors."""
        SentinelLogger._emit("error", message, extra)

    @staticmethod
    def broadcast(symbol: str, price: float) -> None:
        """Tracks full-duplex socket outbound broadcast distribution events."""
        SentinelLogger._emit(
            "broadcast_event",
            f"Payload distributed for {symbol}",
            {"symbol": symbol, "price": price},
        )
