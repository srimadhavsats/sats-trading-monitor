# ====================================================================
# SATS Sentinel v4.1 - Backend Configuration Core
# ====================================================================

# Global institutional mirror endpoint for real-time ticker data
BYBIT_API_URL = "https://api.bybit.com/v5/market/tickers"

# Fallback asset profiles for real-time tracking delta thresholds
DEFAULT_WHALE_THRESHOLDS = {"BTC/USDT": 0.1, "ETH/USDT": 1.0, "1000SATS/USDT": 500000.0}

# Network connection and pipeline interval parameters
CONNECTION_TIMEOUT_SECONDS = 10.0
STREAM_HEARTBEAT_DELAY = 1.0

# Cross-Origin Resource Sharing (CORS) Security Policies
# Can be updated to localized client origins (e.g., ["http://localhost:5174"]) in production
ALLOWED_ORIGINS = ["*"]
