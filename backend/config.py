import os

# High-performance network routing configuration parameters
BYBIT_API_URL = os.getenv("BYBIT_API_URL", "https://api.bybit.com/v5/market/tickers")
CONNECTION_TIMEOUT_SECONDS = float(os.getenv("CONNECTION_TIMEOUT_SECONDS", 15.0))
STREAM_HEARTBEAT_DELAY = float(os.getenv("STREAM_HEARTBEAT_DELAY", 1.0))

# Baseline volume tracking thresholds for institutional order block detection
DEFAULT_WHALE_THRESHOLDS = {
    "BTC/USDT": 500000.0,
    "ETH/USDT": 250000.0,
}

# Cross-Origin Resource Sharing (CORS) and WebSocket safety validation matrices
# Expanded to accommodate standard local environment port deviations natively
ALLOWED_ORIGINS = [
    os.getenv("ALLOWED_ORIGIN_PRIMARY", "http://localhost:5173"),
    os.getenv("ALLOWED_ORIGIN_SECONDARY", "http://127.0.0.1:5173"),
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
