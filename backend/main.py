import asyncio

import httpx

# Import centralized configuration parameters
from config import (
    ALLOWED_ORIGINS,
    BYBIT_API_URL,
    CONNECTION_TIMEOUT_SECONDS,
    DEFAULT_WHALE_THRESHOLDS,
    STREAM_HEARTBEAT_DELAY,
)
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Import the centralized telemetry engine logger
from logger import SentinelLogger

# Import formalized data validation schemas including MarketStreamPayload
from schemas import HealthCheckResponse, MarketStreamPayload

# --------------------------------------------------------------------
# Configuration & Threshold Mappings
# --------------------------------------------------------------------
try:
    from ui_layout import WHALE_THRESHOLDS
except ImportError:
    # Fallback thresholds optimized via central configuration module
    WHALE_THRESHOLDS = DEFAULT_WHALE_THRESHOLDS

app = FastAPI(
    title="SATS Sentinel Engine",
    description="High-frequency market data streaming oracle via WebSockets",
    version="4.1",
)

# Cross-Origin Resource Sharing (CORS) security configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------
# Application Lifecycle Routes
# --------------------------------------------------------------------


@app.get("/", response_model=HealthCheckResponse)
async def health_check():
    """
    Service Health Check.
    Verifies container/host connectivity and gateway operational readiness.
    Enforces runtime validation through HealthCheckResponse schema.
    """
    return {
        "status": "Sentinel v4.1 Active",
        "message": "Oracle engine is operational and ready for stream requests",
    }


@app.on_event("startup")
async def startup_event():
    """
    Initialization Hook.
    Triggers diagnostic logging upon application server spin-up.
    """
    SentinelLogger.startup("Streaming Oracle Online")


# --------------------------------------------------------------------
# WebSocket Streaming Pipeline
# --------------------------------------------------------------------


@app.websocket("/ws/price/{symbol}")
async def websocket_endpoint(websocket: WebSocket, symbol: str):
    """
    Asynchronous WebSocket stream handler. Establishes a persistent full-duplex
    connection to calculate tracking metrics and broadcast live payload states.
    """
    await websocket.accept()

    # Normalize incoming pairs (e.g., BTC-USDT -> BTCUSDT) to comply with API schemas
    api_symbol = symbol.replace("-", "")
    if "SATS" in api_symbol and "1000" not in api_symbol:
        api_symbol = f"1000{api_symbol}"

    # Anti-fingerprinting browser-mimicking signatures to prevent regional edge timeouts
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
                response = await client.get(
                    BYBIT_API_URL, params={"category": "spot", "symbol": api_symbol}
                )

                if response.status_code == 200:
                    data = response.json()
                    result = data.get("result", {}).get("list", [{}])[0]

                    if result:
                        price = float(result.get("lastPrice", 0))
                        clean_key = symbol.replace("-", "/")
                        threshold = WHALE_THRESHOLDS.get(clean_key, 0)

                        # Structured analytical payload generation
                        payload = {
                            "symbol": clean_key,
                            "price": price,
                            "high": float(result.get("highPrice24h", 0)),
                            "low": float(result.get("lowPrice24h", 0)),
                            "volume": float(result.get("turnover24h", 0)),
                            "change": float(result.get("price24hPcnt", 0)) * 100,
                            "is_whale": price > threshold,
                            "whale_alert": price > threshold,
                            "whale_threshold": threshold,
                        }

                        # Enforce validation schema parsing at the active WebSocket channel border
                        validated_payload = MarketStreamPayload(**payload)

                        # Broadcast the strictly serialized data contract model to the client
                        await websocket.send_json(validated_payload.model_dump())
                        SentinelLogger.broadcast(clean_key, price)

                else:
                    SentinelLogger.error(
                        f"Oracle Edge API Connection Warning: Status {response.status_code}"
                    )

                await asyncio.sleep(
                    STREAM_HEARTBEAT_DELAY
                )  # Managed via centralized constants

    except WebSocketDisconnect:
        SentinelLogger.info(
            f"Network Handshake Terminated: Client disconnected from channel [{symbol}]."
        )
    except Exception as e:
        SentinelLogger.error(f"Internal Pipeline Telemetry Exception: {e}")
