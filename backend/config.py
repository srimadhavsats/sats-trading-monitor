# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Central Configuration
# ====================================================================
import os

# Abstracted External Gateway Targets
BYBIT_API_URL = os.getenv("BYBIT_API_URL", "https://api.bybit.com/v5/market/tickers")

# Pipeline Ingestion Heartbeat Constraints
CONNECTION_TIMEOUT_SECONDS = float(os.getenv("CONNECTION_TIMEOUT_SECONDS", "10.0"))
STREAM_HEARTBEAT_DELAY = float(os.getenv("STREAM_HEARTBEAT_DELAY", "1.0"))

# Frontend Visualization Allocations
MAX_CHART_TICKS = int(os.getenv("MAX_CHART_TICKS", "30"))

# Strict CORS Whitelist Cross-Origin Records
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
]

# Analytical Metrics Evaluation Baselines
DEFAULT_WHALE_THRESHOLDS = {
    "BTC/USDT": 50000000.0,
    "ETH/USDT": 20000000.0,
    "SOL/USDT": 5000000.0,
}
