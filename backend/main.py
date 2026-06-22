import asyncio
from contextlib import asynccontextmanager
import re
import time
from typing import Dict, List

from fastapi import FastAPI, HTTPException, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel

from analytics import MarketAnalytics
from auth import SecurityAuthenticator
from config import (
    ALLOWED_ORIGINS,
    BYBIT_API_URL,
    CONNECTION_TIMEOUT_SECONDS,
    DEFAULT_WHALE_THRESHOLDS,
    HTTPX_MAX_CONNECTIONS,
    HTTPX_MAX_KEEPALIVE_CONNECTIONS,
    STREAM_HEARTBEAT_DELAY,
)
from connection_manager import ConnectionManager
from logger import SentinelLogger
from rate_limiter import SlidingWindowRateLimiter
from retry_handler import ResilientRetryHandler
from schemas import HealthCheckResponse, MarketStreamPayload

# Global state counters for system telemetry benchmarking
PIPELINE_START_TIME = time.time()
TOTAL_PROCESSED_TICKS = 0
LAST_INGESTION_TIMESTAMP = 0.0

# Memory-Bounded Ring Buffer for Whale Event Logs
WHALE_ALERTS_LEDGER: List[dict] = []
MAX_LEDGER_CAPACITY = 20

# Shared Global Memory Cache for data persistence
GLOBAL_MARKET_CACHE: Dict[str, dict] = {}

# Background task cancellation reference tracker
BACKGROUND_WORKER_TASK: getattr(asyncio, "Task", None) = None

# Instantiate core architectural processing layers
manager = ConnectionManager()
authenticator = SecurityAuthenticator()
metrics_limiter = SlidingWindowRateLimiter(window_seconds=60.0, max_requests=10)

# --------------------------------------------------------------------
# Configuration Management & State Instantiations
# --------------------------------------------------------------------
try:
    from ui_layout import WHALE_THRESHOLDS
except ImportError:
    WHALE_THRESHOLDS = DEFAULT_WHALE_THRESHOLDS

# Ensure the configuration matrix is a mutable dictionary copy for in-memory tuning
WHALE_THRESHOLDS = dict(WHALE_THRESHOLDS)


class ThresholdUpdateRequest(BaseModel):
    symbol: str
    threshold: float


# --------------------------------------------------------------------
# Centralized Background Ingestion Engine
# --------------------------------------------------------------------
async def central_ingestion_worker():
    """
    Decoupled background worker loop running across the lifecycle of the server engine.
    Polls whitelisted symbols into a central data cache and records whale events.
    """
    global TOTAL_PROCESSED_TICKS, LAST_INGESTION_TIMESTAMP, WHALE_ALERTS_LEDGER
    SentinelLogger.info("Spawning centralized asynchronous market ingestion worker thread...")

    symbols_to_track = ["BTC-USDT", "ETH-USDT", "SOL-USDT"]
    polling_retry_handler = ResilientRetryHandler(base_delay=1.0, max_delay=15.0)

    client_limits = httpx.Limits(
        max_connections=HTTPX_MAX_CONNECTIONS,
        max_keepalive_connections=HTTPX_MAX_KEEPALIVE_CONNECTIONS,
    )
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    }

    try:
        async with httpx.AsyncClient(
            timeout=CONNECTION_TIMEOUT_SECONDS, headers=headers, trust_env=True, limits=client_limits
        ) as client:
            while True:
                for symbol in symbols_to_track:
                    api_symbol = symbol.replace("-", "")
                    if "SATS" in api_symbol and "1000" not in api_symbol:
                        api_symbol = f"1000{api_symbol}"

                    try:
                        response = await client.get(
                            BYBIT_API_URL, params={"category": "spot", "symbol": api_symbol}
                        )

                        if response.status_code == 200:
                            data = response.json()
                            result = data.get("result", {}).get("list", [{}])[0]

                            if result:
                                price = float(result.get("lastPrice", 0))
                                high_24h = float(result.get("highPrice24h", 0))
                                low_24h = float(result.get("lowPrice24h", 0))
                                volume_24h = float(result.get("turnover24h", 0))

                                clean_key = symbol.replace("-", "/")
                                threshold = WHALE_THRESHOLDS.get(clean_key, 0)

                                is_whale_detected = MarketAnalytics.evaluate_whale_activity(volume_24h, threshold)
                                spread_index = MarketAnalytics.calculate_volatility_spread(high_24h, low_24h)

                                payload = {
                                    "symbol": clean_key,
                                    "price": price,
                                    "high": high_24h,
                                    "low": low_24h,
                                    "volume": volume_24h,
                                    "change": float(result.get("price24hPcnt", 0)) * 100,
                                    "spread": spread_index,
                                    "is_whale": is_whale_detected,
