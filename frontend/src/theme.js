/**
 * SATS Sentinel v4.1 - System Design Tokens
 * Centralized theme configuration for consistent application aesthetics.
 */

export const THEME = {
  // Color mappings dictated by real-time asset trajectory velocities
  velocity: {
    bullish: "#10b981", // Emerald design token for upward price movement
    bearish: "#f43f5e", // Rose design token for downward price movement
    neutral: "#a3a3a3", // Neutral grey token for flat or unchanged asset states
  },

  // Connection integrity color codes
  status: {
    online: "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50",
    offline: "bg-neutral-950/80 text-neutral-400 border border-neutral-800/50",
  },

  // Graphical vector path constraints
  chart: {
    strokeWidth: 1.5,
    fillOpacity: 0.08,
  },
};
