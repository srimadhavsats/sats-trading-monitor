# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Logger Unit Tests
# ====================================================================
import json
import sys
from io import StringIO

import pytest
from logger import SentinelLogger


def test_sentinel_logger_json_structure():
    """Validates that the logger outputs valid JSON with the required system keys."""
    # Temporarily redirect standard output to a string buffer to inspect output strings
    captured_output = StringIO()
    sys.stdout = captured_output

    try:
        SentinelLogger.info("Testing structured logging sequence")
        output = captured_output.getvalue().strip()
        log_record = json.loads(output)

        # Assert correct field presence and values
        assert "timestamp" in log_record
        assert log_record["level"] == "INFO"
        assert log_record["message"] == "Testing structured logging sequence"
        assert log_record["subsystem"] == "telemetry_pipeline"
    finally:
        # Restore native standard output configurations safely
        sys.stdout = sys.__stdout__


def test_sentinel_logger_with_meta():
    """Verifies that broadcast events inject metadata fields smoothly into the JSON line."""
    captured_output = StringIO()
    sys.stdout = captured_output

    try:
        SentinelLogger.broadcast("SOL-USDT", 145.50)
        output = captured_output.getvalue().strip()
        log_record = json.loads(output)

        assert log_record["level"] == "BROADCAST_EVENT"
        assert "meta" in log_record
        assert log_record["meta"]["symbol"] == "SOL-USDT"
        assert log_record["meta"]["price"] == 145.50
    finally:
        sys.stdout = sys.__stdout__
