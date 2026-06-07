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

# Import formalized data validation schemas
from schemas import HealthCheckResponse, MarketStreamPayload

# Global state counters for system telemetry observability
PIPELINE_START_TIME = time.time()
TOTAL_PROCESSED_TICKS = 0


# --------------------------------------------------------------------
# Application Lifecycle Context Manager (Lifespan)
# --------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown subroutines uniformly.
    """
    SentinelLogger.startup("Resilient Telemetry Pipeline Initialized")
    yield
    SentinelLogger.info("Resilient Telemetry Pipeline Terminated")


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

manager = ConnectionManager()
authenticator = SecurityAuthenticator()

# In-memory structural storage tracking request invocation timestamps per client host
RATE_LIMIT_CACHE: Dict[str, List[float]] = {}
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
    current_time = time.time()

    if client_ip not in RATE_LIMIT_CACHE:
        RATE_LIMIT_CACHE[client_ip] = []

    RATE_LIMIT_CACHE[client_ip] = [
        t for t in RATE_LIMIT_CACHE[client_ip] if current_time - t < 60.0
    ]

    if len(RATE_LIMIT_CACHE[client_ip]) >= 10:
        SentinelLogger.error(
            f"Rate limit threshold breach executed by host address vector: {client_ip}"
        )
        raise HTTPException(
            status_code=429,
            detail="Rate limit threshold exceeded. Maximum 10 pipeline metric requests per minute permitted.",
        )

    RATE_LIMIT_CACHE[client_ip].append(current_time)

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

    try:
        SentinelLogger.info(f"Polling Data Feed for: {api_symbol}...")

        async with httpx.AsyncClient(
            timeout=CONNECTION_TIMEOUT_SECONDS, headers=headers, trust_env=True
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
                    else:
                        SentinelLogger.error(
                            f"Oracle Edge API Connection Warning: Status {response.status_code}"
                        )

                except httpx.HTTPError as http_err:
                    SentinelLogger.error(
                        f"Network transport anomaly encountered during poll: {http_err}"
                    )

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
