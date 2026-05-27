/**
 * SATS Sentinel v4.1 - Frontend Configuration Matrix
 * Centralized constant definitions for client application parameters.
 */

export const CONFIG = {
  // Network gateway string for active websocket communication channels
  BACKEND_WS_URL: "ws://127.0.0.1:8000",

  // Data boundary limiting the number of tracking ticks cached for chart plotting
  MAX_CHART_TICKS: 20,

  // Reconnection fallback threshold interval expressed in milliseconds
  HEARTBEAT_RECONNECT_MS: 3000,

  // Centralized collection of active token pair identifier channels
  TRACKED_SYMBOLS: ["BTC-USDT", "ETH-USDT"],
};
