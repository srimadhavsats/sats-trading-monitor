import asyncio
import re
import time
from contextlib import asynccontextmanager
from typing import Dict, List

import httpx

# Import the computational analytics engine layer
from analytics import MarketAnalytics

# Import the security authentication layer manager
from auth import SecurityAuthenticator

# Import centralized configuration parameters
from config import (
    ALLOWED_ORIGINS,
    BYBIT_API_URL,
    CONNECTION_TIMEOUT_SECONDS,
    DEFAULT_WHALE_THRESHOLDS,
    HTTPX_MAX_CONNECTIONS,
    HTTPX_MAX_KEEPALIVE_CONNECTIONS,
    STREAM_HEARTBEAT_DELAY,
)

# Import the decentralized websocket connection manager instance
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

# Import the centralized telemetry engine logger
from logger import SentinelLogger

# Import the decoupled traffic regulation layer manager
from rate_limiter import SlidingWindowRateLimiter

# Import the network resilience layer manager
from retry_handler import ResilientRetryHandler

# Import formalized data validation schemas
from schemas import HealthCheckResponse, MarketStreamPayload

# Global state counters for system telemetry observability
PIPELINE_START_TIME = time.time()
TOTAL_PROCESSED_TICKS = 0

# Instantiate core architectural layers
manager = ConnectionManager()
authenticator = SecurityAuthenticator()
metrics_limiter = SlidingWindowRateLimiter(window_seconds=60.0, max_requests=10)


# --------------------------------------------------------------------
# Application Lifecycle Context Manager (Lifespan)
# --------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown subroutines uniformly.
    Executes graceful disconnections for all active clients on termination.
    """
    SentinelLogger.startup("Resilient Telemetry Pipeline Initialized")
    yield

    # Graceful Shutdown Sequence: Evict active sockets with standard code 1001 (Going Away)
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
    version="4.1",
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


# --------------------------------------------------------------------
# Security Headers Middleware
# --------------------------------------------------------------------
@app.middleware("http")
async def inject_security_headers(request: Request, call_next):
    """Injects high-security HTTP infrastructure headers into every outbound pipeline frame."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; frame-ancestors 'none';"
    )
    return response


# --------------------------------------------------------------------
# Application API Routes
# --------------------------------------------------------------------


@app.get("/", response_model=HealthCheckResponse)
async def health_check():
    """
    Service Health Check.
    Verifies container/host connectivity and gateway operational readiness.
    """
    return {
        "status": "Telemetry Pipeline Active",
        "message": "Data ingestion pipeline is operational and accepting stream connection requests",
    }


@app.get("/health/diagnostics")
async def health_diagnostics():
    """
    Evaluates real-time upstream network latency thresholds and connectivity bounds.
    Performs an out-of-band high-resolution measurement to the oracle gateway.
    """
    start_time = time.time()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                BYBIT_API_URL, params={"category": "spot", "symbol": "BTCUSDT"}
            )
            latency_ms = (time.time() - start_time) * 1000

            if response.status_code == 200:
                return {
                    "status": "Healthy",
                    "upstream_gateway": "Bybit API v5",
                    "latency_ms": round(latency_ms, 2),
                    "connected": True,
                }
            else:
                return {
                    "status": "Degraded",
                    "upstream_gateway": "Bybit API v5",
                    "latency_ms": round(latency_ms, 2),
                    "connected": False,
                    "error": f"HTTP Status {response.status_code}",
                }
    except Exception as err:
        return {
            "status": "Unhealthy",
            "upstream_gateway": "Bybit API v5",
            "latency_ms": round((time.time() - start_time) * 1000, 2),
            "connected": False,
            "error": str(err),
        }


@app.get("/metrics/system")
async def get_system_telemetry():
    """
    Exposes global infrastructure operational performance statistics.
    Calculates operational lifespan bounds, network ingestion volume, and channel load.
    """
    uptime_seconds = time.time() - PIPELINE_START_TIME
    return {
        "uptime_seconds": round(uptime_seconds, 2),
        "total_processed_ticks": TOTAL_PROCESSED_TICKS,
        "active_websocket_channels": sum(WS_CONCURRENT_TRACKER.values()),
        "tracked_host_vectors": len(WS_CONCURRENT_TRACKER),
    }


@app.get("/metrics/{symbol}")
async def get_stream_metrics(symbol: str, request: Request):
    """
    Exposes real-time client channel allocation metrics for a designated symbol channel.
    Executes strict validation and handles fixed-window tracking rate-limiting rules.
    """
    if not re.match(r"^[A-Za-z0-9\-]+$", symbol):
        SentinelLogger.error(
            f"Malformed or non-whitelisted metrics parameter rejected: {symbol}"
        )
        raise HTTPException(
            status_code=400, detail="Malformed character format inside parameter field"
        )

    client_ip = request.client.host if request.client else "127.0.0.1"

    # Defensive Control: Enforce structured traffic throttling constraints using the sliding window manager
    if metrics_limiter.is_rate_limited(client_ip):
        SentinelLogger.error(
            f"Rate limit threshold breach executed by host address vector: {client_ip}"
        )
        raise HTTPException(
            status_code=429,
            detail="Rate limit threshold exceeded. Maximum 10 pipeline metric requests per minute permitted.",
        )

    count = manager.get_active_count(symbol)
    return {"symbol": symbol, "active_connections": count}


# --------------------------------------------------------------------
# WebSocket Streaming Pipeline
# --------------------------------------------------------------------


@app.websocket("/ws/price/{symbol}")
async def websocket_endpoint(
    websocket: WebSocket, symbol: str, token: str = Query(None)
):
    """
    Asynchronous WebSocket stream handler. Performs cross-origin verification,
    enforces path sanitization, implements socket flood protection, and manages data distribution.
    """
    global TOTAL_PROCESSED_TICKS
    global WS_CONCURRENT_TRACKER

    request_origin = websocket.headers.get("origin")
    if request_origin not in ALLOWED_ORIGINS:
        SentinelLogger.error(
            f"Unauthorized WebSocket handshake rejected from origin vector: {request_origin}"
        )
        await websocket.close(code=1008)
        return

    if not re.match(r"^[A-Za-z0-9\-]+$", symbol):
        SentinelLogger.error(
            f"Malformed or non-whitelisted WebSocket stream parameter rejected: {symbol}"
        )
        await websocket.close(code=1008)
        return

    if not authenticator.validate_handshake_token(token):
        SentinelLogger.error(
            f"Unauthorized WebSocket handshake rejected: Invalid or missing token parameter."
        )
        await websocket.close(code=1008)
        return

    client_ip = websocket.client.host if websocket.client else "127.0.0.1"
    current_ws_count = WS_CONCURRENT_TRACKER.get(client_ip, 0)
    if current_ws_count >= 5:
        SentinelLogger.error(
            f"Connection flood protection triggered. Rejecting socket upgrade for host vector: {client_ip}"
        )
        await websocket.close(code=1008)
        return

    WS_CONCURRENT_TRACKER[client_ip] = current_ws_count + 1

    await manager.connect(websocket, symbol)

    api_symbol = symbol.replace("-", "")
    if "SATS" in api_symbol and "1000" not in api_symbol:
        api_symbol = f"1000{api_symbol}"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
    }

    # Instantiating structured connection reuse profiles
    client_limits = httpx.Limits(
        max_connections=HTTPX_MAX_CONNECTIONS,
        max_keepalive_connections=HTTPX_MAX_KEEPALIVE_CONNECTIONS,
    )

    # Initialize the retry handler instance for this socket subscription session
    polling_retry_handler = ResilientRetryHandler(base_delay=1.0, max_delay=15.0)

    try:
        SentinelLogger.info(f"Polling Data Feed for: {api_symbol}...")

        async with httpx.AsyncClient(
            timeout=CONNECTION_TIMEOUT_SECONDS,
            headers=headers,
            trust_env=True,
            limits=client_limits,
        ) as client:
            while True:
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

                            is_whale_detected = MarketAnalytics.evaluate_whale_activity(
                                volume_24h, threshold
                            )
                            spread_index = MarketAnalytics.calculate_volatility_spread(
                                high_24h, low_24h
                            )

                            payload = {
                                "symbol": clean_key,
                                "price": price,
                                "high": high_24h,
                                "low": low_24h,
                                "volume": volume_24h,
                                "change": float(result.get("price24hPcnt", 0)) * 100,
                                "spread": spread_index,
                                "is_whale": is_whale_detected,
                                "whale_alert": is_whale_detected,
                                "whale_threshold": threshold,
                            }

                            validated_payload = MarketStreamPayload(**payload)
                            await manager.broadcast_to_symbol(
                                symbol, validated_payload.model_dump()
                            )
                            TOTAL_PROCESSED_TICKS += 1
                            SentinelLogger.broadcast(clean_key, price)

                            # Reset error loops upon a clean data delivery cycle
                            polling_retry_handler.reset()
                    else:
                        SentinelLogger.error(
                            f"Oracle Edge API Connection Warning: Status {response.status_code}"
                        )
                        error_delay = polling_retry_handler.increment_failure()
                        await asyncio.sleep(error_delay)
                        continue

                except httpx.HTTPError as http_err:
                    SentinelLogger.error(
                        f"Network transport anomaly encountered during poll: {http_err}"
                    )
                    error_delay = polling_retry_handler.increment_failure()
                    await asyncio.sleep(error_delay)
                    continue

                await asyncio.sleep(STREAM_HEARTBEAT_DELAY)

    except WebSocketDisconnect:
        manager.disconnect(websocket, symbol)
    except Exception as e:
        SentinelLogger.error(f"Internal Pipeline Telemetry Exception: {e}")
        manager.disconnect(websocket, symbol)
    finally:
        if client_ip in WS_CONCURRENT_TRACKER:
            WS_CONCURRENT_TRACKER[client_ip] = max(
                0, WS_CONCURRENT_TRACKER[client_ip] - 1
            )
            if WS_CONCURRENT_TRACKER[client_ip] == 0:
                del WS_CONCURRENT_TRACKER[client_ip]
