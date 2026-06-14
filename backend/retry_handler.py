# ====================================================================
# SATS High-Frequency Telemetry Pipeline - Jittered Retry Engine
# ====================================================================
import random
import time

class ResilientRetryHandler:
    """
    Manages mathematical exponential backoff calculations with randomized
    jitter parameters to protect upstream oracle endpoints from call floods.
    """
    def __init__(self, base_delay: float = 1.0, max_delay: float = 30.0, factor: float = 2.0):
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.factor = factor
        self.attempts = 0

    def calculate_next_delay(self) -> float:
        """
        Computes the next backoff delay using the formula:
        Delay = min(max_delay, base_delay * (factor ^ attempts))
        Applies a uniform randomized jitter to distribute network load.
        """
        calculated_delay = self.base_delay * (self.factor ** self.attempts)
        bounded_delay = min(self.max_delay, calculated_delay)

        # Inject randomized jitter: vary final timing uniformly between 0 and the delay ceiling
        final_jittered_delay = random.uniform(0, bounded_delay)
        return final_jittered_delay

    def increment_failure(self) -> float:
        """Logs a transport anomaly occurrence and returns the next computed wait time."""
        delay = self.calculate_next_delay()
        self.attempts += 1
        return delay

    def reset(self) -> None:
        """Resets tracking thresholds back to initial operational boundaries upon a successful cycle."""
        self.attempts = 0
