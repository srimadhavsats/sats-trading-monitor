import React, { createContext, useContext, useState, useEffect } from "react";
import { CONFIG } from "../config";
import { storage } from "../utils/storage";

const TelemetryContext = createContext(null);

export const TelemetryProvider = ({ children }) => {
  const [selectedSymbol, setSelectedSymbol] = useState(() =>
    storage.get("selected_symbol", "BTC-USDT"),
  );
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [sessionHigh, setSessionHigh] = useState(null);
  const [sessionLow, setSessionLow] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const maxTicks = CONFIG.MAX_CHART_TICKS || 30;

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let isMounted = true;
    let connectionAttempts = 0;

    const connect = () => {
      if (!isMounted) return;

      const authToken = "sats_dev_fallback_secure_token_2026";
      // Construct routing link dynamically while ensuring exact formatting rules apply
      const wsUrl = `${CONFIG.BACKEND_WS_URL}/ws/price/${selectedSymbol}?token=${authToken}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (isMounted) {
          setConnected(true);
          connectionAttempts = 0;
          console.log(
            `[Context] Context Telemetry Connected: ${selectedSymbol}`,
          );
        }
      };

      socket.onmessage = (event) => {
        if (!isMounted || document.hidden) return;

        try {
          const incomingData = JSON.parse(event.data);
          if (!incomingData || !incomingData.price) return;

          const currentPrice = incomingData.price;

          setSessionHigh((prev) =>
            prev === null || currentPrice > prev ? currentPrice : prev,
          );
          setSessionLow((prev) =>
            prev === null || currentPrice < prev ? currentPrice : prev,
          );

          setData(incomingData);
          setHistory((prev) => [...prev, currentPrice].slice(-maxTicks));
          setLastUpdated(new Date());
        } catch (err) {
          console.error("[Context] Stream frame parse anomaly:", err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setConnected(false);

        const baselineDelay = CONFIG.HEARTBEAT_RECONNECT_MS || 3000;
        const calculatedBackoff =
          baselineDelay * Math.pow(2, connectionAttempts);
        const finalReconnectDelay = Math.min(30000, calculatedBackoff);

        console.warn(
          `[Context] Reconnecting stream in ${finalReconnectDelay}ms`,
        );
        connectionAttempts++;
        reconnectTimer = setTimeout(connect, finalReconnectDelay);
      };

      socket.onerror = () => {
        if (socket) socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [selectedSymbol, maxTicks]);

  const changeSymbol = (newSym) => {
    setSelectedSymbol(newSym);
    storage.set("selected_symbol", newSym);
    setHistory([]);
    setData(null);
    setSessionHigh(null);
    setSessionLow(null);
    setLastUpdated(null);
  };

  return (
    <TelemetryContext.Provider
      value={{
        selectedSymbol,
        data,
        connected,
        history,
        sessionHigh,
        sessionLow,
        lastUpdated,
        changeSymbol,
      }}
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
