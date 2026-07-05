export const CONFIG = {
  // Agar platform par environment variable set hai toh wo uthaega, nahi toh localhost fallback
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000",
  BACKEND_WS_URL: import.meta.env.VITE_BACKEND_WS_URL || "ws://127.0.0.1:8000",
  HANDSHAKE_TOKEN:
    import.meta.env.VITE_HANDSHAKE_TOKEN ||
    "sats_dev_fallback_secure_token_2026",
};
