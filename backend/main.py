import asyncio
from contextlib import asynccontextmanager
import re
import time
from typing import Dict, List
import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware

# Import centralized configuration parameters
from config import (
    BYBIT_API_URL,
    DEFAULT_WHALE_THRESHOLDS,
    CONNECTION_TIMEOUT_SECONDS,
    STREAM_HEARTBEAT_DELAY,
    ALLOWED_ORIGINS
)
# Import the centralized telemetry engine logger
from logger import SentinelLogger
# Import formalized data validation schemas
from schemas import HealthCheckResponse, MarketStreamPayload
# Import the decentralized websocket connection manager instance
from connection_manager import ConnectionManager
# Import the computational analytics engine layer
from analytics import MarketAnalytics
# Import the security authentication layer manager
from auth import SecurityAuthenticator

# Global state counters for system telemetry observability
PIPELINE_START_TIME = time.time()
TOTAL_PROCESSED_TICKS = 0

# Instantiate core architectural layers
manager = ConnectionManager()
authenticator = SecurityAuthenticator()

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
    SentinelLogger.info("Initiating graceful teardown. Evicting active WebSocket channels...")
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
    lifespan=lifespan
)

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
# Security Headers Middleware
# --------------------------------------------------------------------
@app.middleware("http")
async def inject_security_headers(request: Request, call_next):
    """Injects high-security HTTP infrastructure headers into every outbound pipeline frame."""
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'self'; frame-ancestors 'none';"
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
        "tracked_host_vectors": len(WS_CONCURRENT_TRACKER)
    }


@app.get("/metrics/{symbol}")
async def get_stream_metrics(symbol: str, request: Request):
    """
    Exposes real-time client channel allocation metrics for a designated symbol channel.
    Executes strict validation and handles fixed-window tracking rate-limiting rules.
    """
    if not re.match(r"^[A-Za-z0-9\-]+$", symbol):
        SentinelLogger.error(f"Malformed or non-whitelisted metrics parameter rejected: {symbol}")
        raise HTTPException(status_code=400, detail="Malformed character format inside parameter field")

    client_ip = request.client.host if request.client else "127.0.0.1"
    current_time = time.time()

    if client_ip not in RATE_LIMIT_CACHE:
        RATE_LIMIT_CACHE[client_ip] = []

    RATE_LIMIT_CACHE[client_ip] = [t for t in RATE_LIMIT_CACHE[client_ip] if current_time - t < 60.0]

    if len(RATE_LIMIT_CACHE[client_ip]) >= 10:
        SentinelLogger.error(f"Rate limit threshold breach executed by host address vector: {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="Rate limit threshold exceeded. Maximum 10 pipeline metric requests per minute permitted."
        )

    RATE_LIMIT_CACHE[client_ip].append(current_time)

    count = manager.get_active_count(symbol)
    return {
        "symbol": symbol,
        "active_connections": count
    }


# --------------------------------------------------------------------
# WebSocket Streaming Pipeline
# --------------------------------------------------------------------

@app.websocket("/ws/price/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str, token: str = Query(None)):
    """
    Asynchronous WebSocket stream handler. Performs
