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
  const [status, setStatus] = useState("connecting"); // connecting | connected | disconnected
  const [symbol, setSymbol] = useState("BTC-USDT");
  const [priceHistory, setPriceHistory] = useState([]);

  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectDelay = 16000;
  const baseReconnectDelay = 1000;

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    setStatus("connecting");
    const token =
      CONFIG.HANDSHAKE_TOKEN || "sats_dev_fallback_secure_token_2026";

    // Sanitize and guarantee the correct /ws prefix format path securely
    const baseWsUrl = CONFIG.BACKEND_WS_URL.endsWith("/ws")
      ? CONFIG.BACKEND_WS_URL
      : `${CONFIG.BACKEND_WS_URL}/ws`;

    const wsUrl = `${baseWsUrl}/price/${symbol}?token=${token}`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log(`── 🔌 TELEMETRY VECTOR CONNECTED: [${symbol}] ──`);
      setStatus("connected");
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        setData(payload);

        if (payload && typeof payload.price === "number") {
          setPriceHistory((prev) => {
            const nextHistory = [
              ...prev,
              { price: payload.price, time: Date.now() },
            ];
            if (nextHistory.length > 30) {
              nextHistory.shift();
            }
            return nextHistory;
          });
        }
      } catch (err) {
        console.error("❌ Malformed data payload frame rejected:", err);
      }
    };

    ws.onclose = (e) => {
      console.log(`── 🔌 SOCKET CLOSED WITH CODE: ${e.code} ──`);

      // Clean connection tracking ref safely if this closed socket is still the active one
      if (socketRef.current === ws) {
        socketRef.current = null;
      }

      // 🛡️ SAFEGUARD FILTER: Intentional closure (1000) hone par reconnect skip karein
      if (e.code === 1000 || e.code === 1001 || e.code === 1008) {
        if (e.code !== 1000) {
          setStatus("disconnected");
        }
        return;
      }

      // Only execute reconnection scripts if transport dropped unexpectedly
      setStatus("connecting");
      const delay = Math.min(
        maxReconnectDelay,
        baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current),
      );

      console.warn(
        `⚠️ Transport closed unexpectedly. Reconnecting in ${delay}ms`,
      );
      reconnectAttemptsRef.current += 1;

      setTimeout(() => {
        // Double check that the user hasn't shifted rooms before executing retry block
        if (wsUrl.includes(symbol)) {
          connectWebSocket();
        }
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
    setPriceHistory([]);
    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000); // Trigger clean intentional disconnect signal
      }
    };
  }, [symbol, connectWebSocket]);

  const connected = status === "connected";

  return (
    <TelemetryContext.Provider
      value={{ data, connected, status, symbol, setSymbol, priceHistory }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error(
      "useTelemetry must be executed internal to a TelemetryProvider structural boundary",
    );
  }
  return context;
};
