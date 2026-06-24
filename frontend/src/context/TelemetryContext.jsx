import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { CONFIG } from "../config";

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [data, setData] = useState(null);
  // Track system connectivity status maps explicitly
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected
  const [symbol, setSymbol] = useState("BTC-USDT");

  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 16000; // Limit backoff delays to 16 seconds max
  const baseReconnectDelay = 1000;

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setStatus("connecting");
    const token =
      CONFIG.HANDSHAKE_TOKEN || "sats_dev_fallback_secure_token_2026";
    const wsUrl = `${CONFIG.BACKEND_WS_URL}/price/${symbol}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`── 🔌 TELEMETRY VECTOR CONNECTED: [${symbol}] ──`);
      setStatus("connected");
      reconnectAttemptsRef.current = 0; // Reset backoff counters on clean handshake
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setData(payload);
      } catch (err) {
        console.error("❌ Malformed data payload frame rejected:", err);
      }
    };

    ws.onclose = (e) => {
      socketRef.current = null;
      if (e.code === 1001 || e.code === 1008) {
        // Explicit administrative terminal closures should block retries
        setStatus("disconnected");
        return;
      }

      setStatus("connecting");
      // Calculate Backoff: delay = baseDelay * 2^attempts
      const delay = Math.min(
        maxReconnectDelay,
        baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      );

      console.warn(
        `⚠️ Transport closed. Initiating exponential backoff retry in ${delay}ms (Attempt ${reconnectAttemptsRef.current + 1})`,
      );
      reconnectAttemptsRef.current += 1;

      setTimeout(() => {
        connectWebSocket();
      }, delay);
    };

    ws.onerror = (error) => {
      console.error(
        "❌ Pipeline circuit socket interface error caught:",
        error,
      );
      ws.close();
    };
  }, [symbol]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (socketRef.current) {
        // Standard normal closure code on clean layout unmounts
        socketRef.current.close(1000);
      }
    };
  }, [connectWebSocket]);

  // Expose network circuit metrics safely down the react view tree
  const connected = status === "connected";

  return (
    <TelemetryContext.Provider
      value={{ data, connected, status, symbol, setSymbol }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error(
      "useTelemetry must be executed internal to a TelemetryProvider tree structural boundary",
    );
  }
  return context;
};
