import asyncio
import re
import time
from contextlib import asynccontextmanager
from typing import Dict, List

import httpx
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
from fastapi import (
    FastAPI,
    HTTPException,
    Query,
    Request,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from logger import SentinelLogger
from rate_limiter import SlidingWindowRateLimiter
from retry_handler import ResilientRetryHandler
from schemas import HealthCheckResponse, MarketStreamPayload

# Global state counters for system telemetry observability
PIPELINE_START_TIME = time.time()
TOTAL_PROCESSED_TICKS = 0
LAST_INGESTION_TIMESTAMP = 0.0

# Memory-Bounded Ring Buffer for Whale Event Tracking
WHALE_ALERTS_LEDGER: List[dict] = []
MAX_LEDGER_CAPACITY = 20

# Shared Global Memory Cache for data persistence
GLOBAL_MARKET_CACHE: Dict[str, dict] = {}

# Background task cancellation reference tracker
BACKGROUND_WORKER_TASK: getattr(asyncio, "Task", None) = None

# Instantiate core architectural layers
manager = ConnectionManager()
authenticator = SecurityAuthenticator()
metrics_limiter = SlidingWindowRateLimiter(window_seconds=60.0, max_requests=10)


# --------------------------------------------------------------------
# Centralized Background Ingestion Engine
# --------------------------------------------------------------------
async def central_ingestion_worker():
    """
    Decoupled background worker loop that runs for the entire lifetime of the server.
    Polls whitelisted symbols into a central data cache and records whale alerts.
    """
    global TOTAL_PROCESSED_TICKS, LAST_INGESTION_TIMESTAMP, WHALE_ALERTS_LEDGER
    SentinelLogger.info(
        "Spawning centralized asynchronous market ingestion worker thread..."
    )

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
            timeout=CONNECTION_TIMEOUT_SECONDS,
            headers=headers,
            trust_env=True,
            limits=client_limits,
        ) as client:
            while True:
                for symbol in symbols_to_track:
                    api_symbol = symbol.replace("-", "")
                    if "SATS" in api_symbol and "1000" not in api_symbol:
                        api_symbol = f"1000{api_symbol}"

                    try:
                        response = await client.get(
                            BYBIT_API_URL,
                            params={"category": "spot", "symbol": api_symbol},
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

                                is_whale_detected = (
                                    MarketAnalytics.evaluate_whale_activity(
                                        volume_24h, threshold
                                    )
                                )
                                spread_index = (
                                    MarketAnalytics.calculate_volatility_spread(
                                        high_24h, low_24h
                                    )
                                )

                                payload = {
                                    "symbol": clean_key,
                                    "price": price,
                                    "high": high_24h,
                                    "low": low_24h,
                                    "volume": volume_24h,
                                    "change": float(result.get("price24hPcnt", 0))
                                    * 100,
                                    "spread": spread_index,
                                    "is_whale": is_whale_detected,
                                    "whale_alert": is_whale_detected,
                                    "whale_threshold": threshold,
                                }

                                validated_payload = MarketStreamPayload(**payload)
                                serialized_data = validated_payload.model_dump()

                                GLOBAL_MARKET_CACHE[symbol] = serialized_data
                                await manager.broadcast_to_symbol(
                                    symbol, serialized_data
                                )

                                # Append to Ring Buffer if whale volume threshold is breached
                                if is_whale_detected:
                                    event_entry = {
                                        "id": f"w-{time.time()}-{price}",
                                        "timestamp": time.strftime(
                                            "%H:%M:%S", time.localtime()
                                        ),
                                        "symbol": clean_key,
                                        "price": price,
                                        "volume": volume_24h,
                                    }
                                    WHALE_ALERTS_LEDGER.append(event_entry)
                                    # Evict oldest entry if size overflows capacity boundaries
                                    if len(WHALE_ALERTS_LEDGER) > MAX_LEDGER_CAPACITY:
                                        WHALE_ALERTS_LEDGER.pop(0)

                                TOTAL_PROCESSED_TICKS += 1
                                LAST_INGESTION_TIMESTAMP = time.time()
                                polling_retry_handler.reset()
                        else:
                            SentinelLogger.error(
                                f"Oracle Connection Warning: Status {response.status_code}"
                            )
                            error_delay = polling_retry_handler.increment_failure()
                            await asyncio.sleep(error_delay)

                    except httpx.HTTPError as http_err:
                        SentinelLogger.error(
                            f"Transport anomaly encountered: {http_err}"
                        )
                        error_delay = polling_retry_handler.increment_failure()
                        await asyncio.sleep(error_delay)

                await asyncio.sleep(STREAM_HEARTBEAT_DELAY)
    except asyncio.CancelledError:
        SentinelLogger.info(
            "Centralized asynchronous market ingestion worker thread cancelled cleanly."
        )
    except Exception as general_err:
        SentinelLogger.error(
            f"Fatal anomaly inside central background worker: {general_err}"
        )


# --------------------------------------------------------------------
# Application Lifecycle Context Manager (Lifespan)
# --------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles application startup and shutdown subroutines uniformly."""
    global BACKGROUND_WORKER_TASK
    SentinelLogger.startup("Resilient Telemetry Pipeline Initialized")

    BACKGROUND_WORKER_TASK = asyncio.create_task(central_ingestion_worker())
    yield

    if BACKGROUND_WORKER_TASK:
        BACKGROUND_WORKER_TASK.cancel()
        await asyncio.gather(BACKGROUND_WORKER_TASK, return_exceptions=True)

    SentinelLogger.info(
        "Initiating graceful teardown. Evicting active WebSocket channels..."
    )
    shutdown_tasks = []

    for symbol in list(manager.active_connections.keys()):
        for ws in list(manager.active_connections.get(symbol, [])):
            try:
                shutdown_tasks.append(ws.close(code=1001))
            except Exception:
                pass

    if shutdown_tasks:
        await asyncio.gather(*shutdown_tasks, return_exceptions=True)

    SentinelLogger.info("Resilient Telemetry Pipeline Terminated Cleanly")


# --------------------------------------------------------------------
# Configuration & State Instantiations
# --------------------------------------------------------------------
try:
    from ui_layout import WHALE_THRESHOLDS
except ImportError:
    WHALE_THRESHOLDS = DEFAULT_WHALE_THRESHOLDS

app = FastAPI(
    title="SATS High-Frequency Telemetry Pipeline",
    description="Resilient real-time market data streaming pipeline utilizing stateful full-duplex WebSocket channels",
    version="4.2",
    lifespan=lifespan,
)

# Defensive Tracking Matrix: Tracks active concurrent WebSocket socket allocations per host IP
WS_CONCURRENT_TRACKER: Dict[str, int] = {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def inject_security_headers(request: Request, call_next):
    """Injects high-security HTTP infrastructure headers into every outbound pipeline frame."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers
