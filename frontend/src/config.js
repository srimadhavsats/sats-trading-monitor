// Detect whether the client runtime is executing in production or local development
const isProduction =
  typeof window !== "undefined" &&
  (window.location.hostname.includes("vercel.app") ||
   window.location.hostname.includes("onrender.com"));

export const CONFIG = {
  // Primary backend HTTP endpoint
  BACKEND_URL: isProduction
    ? "https://sats-trading-monitor.onrender.com"
    : (import.meta.env?.VITE_BACKEND_URL || "http://127.0.0.1:8000"),

  // Full-duplex WebSocket stream endpoint
  BACKEND_WS_URL: isProduction
    ? "wss://sats-trading-monitor.onrender.com"
    : (import.meta.env?.VITE_BACKEND_WS_URL || "ws://127.0.0.1:8000"),

  // Security handshake authentication token
  HANDSHAKE_TOKEN: "sats_dev_fallback_secure_token_2026",

  // Supported asset telemetry rooms
  SUPPORTED_PAIRS: [
    { id: "BTC-USDT", symbol: "BTC/USDT", name: "Bitcoin", network: "Layer 1" },
    { id: "ETH-USDT", symbol: "ETH/USDT", name: "Ethereum", network: "EVM Base" },
    { id: "SOL-USDT", symbol: "SOL/USDT", name: "Solana", network: "SVM High-Speed" },
    { id: "1000SATS-USDT", symbol: "1000SATS/USDT", name: "SATS Ordinals", network: "BRC-20 Satoshis" },
  ],
};
