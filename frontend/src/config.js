// Browser ke hostname ko check karke live environment detect karna
const isProduction =
  typeof window !== "undefined" &&
  window.location.hostname.includes("vercel.app");

export const CONFIG = {
  // Agar website vercel par chal rahi hai toh Render ka hosted link, nahi toh localhost
  BACKEND_URL: isProduction
    ? "https://sats-trading-monitor.onrender.com"
    : "http://127.0.0.1:8000",

  BACKEND_WS_URL: isProduction
    ? "wss://sats-trading-monitor.onrender.com"
    : "ws://127.0.0.1:8000",

  HANDSHAKE_TOKEN: "sats_dev_fallback_secure_token_2026",
};
