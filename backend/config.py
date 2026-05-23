# ====================================================================
# SATS Sentinel v4.1 - Backend Configuration Core
# ====================================================================
import os

# Global institutional mirror endpoint for real-time ticker data
BYBIT_API_URL = os.getenv("BYBIT_API_URL", "https://api.bybit.com/v5/market/tickers")

# Fallback asset profiles for real-time tracking delta thresholds
DEFAULT_WHALE_THRESHOLDS = {
    "BTC/USDT": float(os.getenv("WHALE_THRESHOLD_BTC", 0.1)),
    "ETH/USDT": float(os.getenv("WHALE_THRESHOLD_ETH", 1.0)),
    "1000SATS/USDT": float(os.getenv("WHALE_THRESHOLD_SATS", 500000.0)),
}

# Network connection and pipeline interval parameters
CONNECTION_TIMEOUT_SECONDS = float(os.getenv("CONNECTION_TIMEOUT_SECONDS", 10.0))
STREAM_HEARTBEAT_DELAY = float(os.getenv("STREAM_HEARTBEAT_DELAY", 1.0))

# Cross-Origin Resource Sharing (CORS) Security Policies
# Supports comma-separated strings in environment variables (e.g., "http://localhost:5173,https://app.com")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",")]
