# ====================================================================
# SATS Sentinel v4.1 - Market Analytics Engine
# ====================================================================


class MarketAnalytics:
    """Mathematical processor for calculating high-frequency trading metrics and anomalous activity."""

    @staticmethod
    def calculate_volatility_spread(high: float, low: float) -> float:
        """
        Calculates the current intraday percentage price spread relative to the floor price.
        Provides critical structural context on active trading risk envelopes.
        """
        if low <= 0:
            return 0.0
        return ((high - low) / low) * 100

    @staticmethod
    def evaluate_whale_activity(volume: float, threshold: float) -> bool:
        """
        Evaluates the aggregate 24-hour token liquidity turnover against structural alert boundaries.
        Returns true if current accumulation levels cross institutional thresholds.
        """
        return volume >= threshold
