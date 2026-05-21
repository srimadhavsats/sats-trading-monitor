/**
 * SATS Sentinel v4.1 - Visual Theme & Design Tokens
 * Centralized interface color mapping for asset velocity and data streams.
 */

export const THEME = {
  // Market movement telemetry indicators
  velocity: {
    bullish: "#10b981", // Emerald tracking green
    bearish: "#fb923c", // Dynamic safety orange
  },

  // Graphical chart path opacities
  chart: {
    fillOpacity: "0.1",
    strokeWidth: "2",
  },

  // Core status system responses
  status: {
    online: "bg-emerald-500/10 text-emerald-400",
    offline: "bg-red-500/10 text-red-400",
  },
};
