# ====================================================================
# SATS Sentinel v4.1 - API Data Schemas & Validation Models
# ====================================================================
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    """Formal data contract for system gateway health diagnostics."""

    status: str = Field(..., description="The operational state of the Sentinel engine")
    message: str = Field(
        ..., description="Detailed availability status of the streaming data oracle"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "status": "Sentinel v4.1 Active",
                "message": "Oracle engine is operational and ready for stream requests",
            }
        }


class ErrorResponse(BaseModel):
    """Standardized error contract for consistent API exception handling."""

    error: str = Field(..., description="The error classification code or status title")
    details: str = Field(
        ..., description="Human-readable exception details and debugging context"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "error": "Upstream Gateway Error",
                "details": "The remote exchange mirror connection timed out after 10.0 seconds.",
            }
        }


class MarketStreamPayload(BaseModel):
    """Formal architectural schema contract for high-frequency live price ticks."""

    symbol: str = Field(
        ..., description="The unified trading pair identifier (e.g., BTC/USDT)"
    )
    price: float = Field(
        ..., description="The latest spot execution price from the liquidity node"
    )
    high: float = Field(..., description="The rolling 24-hour high price ceiling value")
    low: float = Field(..., description="The rolling 24-hour low price floor value")
    volume: float = Field(
        ..., description="The accumulated 24-hour liquidity pool turnover metric"
    )
    change: float = Field(
        ..., description="The calculated 24-hour price delta percentage change"
    )
    is_whale: bool = Field(..., description="Whale detection boolean flag state")
    whale_alert: bool = Field(
        ..., description="System broadcast flag for exceptional order visibility"
    )
    whale_threshold: float = Field(
        ..., description="The calibrated boundary limit marking a whale deviation"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "symbol": "BTC/USDT",
                "price": 68250.50,
                "high": 69100.00,
                "low": 67400.25,
                "volume": 125040032.12,
                "change": 1.25,
                "is_whale": False,
                "whale_alert": False,
                "whale_threshold": 0.1,
            }
        }
