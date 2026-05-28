import asyncio
from contextlib import asynccontextmanager

import httpx

# Import the computational analytics engine layer
from analytics import MarketAnalytics

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
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Import the centralized telemetry engine logger
from logger import SentinelLogger

# Import formalized data validation schemas
from schemas import HealthCheckResponse, MarketStreamPayload


# --------------------------------------------------------------------
# Application Lifecycle Context Manager (Lifespan)
# --------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown subroutines uniformly.
    """
    # Startup phase execution subroutines
    SentinelLogger.startup("Streaming Oracle Online")
    yield
    # Shutdown phase execution logic block
    SentinelLogger.info("Streaming Oracle Offline")


# --------------------------------------------------------------------
# Configuration & State Instantiations
# --------------------------------------------------------------------
try:
    from ui_layout import WHALE_THRESHOLDS
except ImportError:
    WHALE_THRESHOLDS = DEFAULT_WHALE_THRESHOLDS

app = FastAPI(
    title="SATS Sentinel Engine",
    description="High-frequency market data streaming oracle via WebSockets",
    version="4.1",
    lifespan=lifespan,
)

manager = ConnectionManager()

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
        "status": "Sentinel v4.1 Active",
        "message": "Oracle engine is operational and ready for stream requests",
    }


# --------------------------------------------------------------------
# WebSocket Streaming Pipeline
# --------------------------------------------------------------------


@app.websocket("/ws/price/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    """
    Asynchronous WebSocket stream handler. Handshakes connections using ConnectionManager,
    evaluates whale tracking rules, and computes live intraday volatility indexes.
    """
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
