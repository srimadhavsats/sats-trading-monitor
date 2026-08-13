import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { CONFIG } from "../config";
import { storage } from "../utils/storage";
import { TelemetryContext } from "./context";

export const TelemetryProvider = ({ children }) => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [symbol, setSymbol] = useState(() => storage.get("active_symbol", "BTC-USDT"));
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceDirection, setPriceDirection] = useState("neutral");
  const [allMarketData, setAllMarketData] = useState({});
  const [audioEnabled, setAudioEnabled] = useState(() => storage.get("audio_enabled", true));
  const [activeTab, setActiveTab] = useState("sparkline");

  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const prevPriceRef = useRef(null);
  const audioContextRef = useRef(null);
  const flashTimerRef = useRef(null);
  const connectWebSocketRef = useRef(null);

  const maxReconnectDelay = 16000;
  const baseReconnectDelay = 1000;

  // Persist preferences
  useEffect(() => {
    storage.set("active_symbol", symbol);
  }, [symbol]);

  useEffect(() => {
    storage.set("audio_enabled", audioEnabled);
  }, [audioEnabled]);

  // Audio synthesizer for whale order alert chime
  const playWhaleChime = useCallback(() => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          audioContextRef.current = new AudioContext();
        }
      }
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore audio autoplay restrictions gracefully
    }
  }, [audioEnabled]);

  // Background ticker poll for multi-asset overview bar
  useEffect(() => {
    const fetchGlobalTickers = async () => {
      try {
        const baseUrl = CONFIG.BACKEND_URL.endsWith("/")
          ? CONFIG.BACKEND_URL.slice(0, -1)
          : CONFIG.BACKEND_URL;

        const resp = await fetch(`${baseUrl}/health/diagnostics`);
        if (!resp.ok) return;
      } catch {
        // Fallback gracefully
      }
    };

    fetchGlobalTickers();
    const interval = setInterval(fetchGlobalTickers, 4000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close(1000);
      socketRef.current = null;
    }

    const token = CONFIG.HANDSHAKE_TOKEN || "sats_dev_fallback_secure_token_2026";

    const baseWsUrl = CONFIG.BACKEND_WS_URL.endsWith("/ws")
      ? CONFIG.BACKEND_WS_URL
      : `${CONFIG.BACKEND_WS_URL}/ws`;

    const wsUrl = `${baseWsUrl}/price/${symbol}?token=${token}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (!payload || typeof payload !== "object") return;

        setData(payload);

        setAllMarketData((prev) => ({
          ...prev,
          [symbol]: payload,
        }));

        if (typeof payload.price === "number") {
          const currentPrice = payload.price;

          if (prevPriceRef.current !== null) {
            if (currentPrice > prevPriceRef.current) {
              setPriceDirection("up");
            } else if (currentPrice < prevPriceRef.current) {
              setPriceDirection("down");
            }

            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
            flashTimerRef.current = setTimeout(() => {
              setPriceDirection("neutral");
            }, 800);
          }
          prevPriceRef.current = currentPrice;

          setPriceHistory((prev) => {
            const nextHistory = [
              ...prev,
              { price: currentPrice, time: Date.now() },
            ];
            if (nextHistory.length > 35) {
              nextHistory.shift();
            }
            return nextHistory;
          });
        }

        if (payload.is_whale || payload.whale_alert) {
          playWhaleChime();
        }
      } catch (err) {
        console.error("[Telemetry] Malformed message frame:", err);
      }
    };

    ws.onclose = (e) => {
      if (socketRef.current === ws) {
        socketRef.current = null;
      }

      if (e.code === 1000 || e.code === 1001 || e.code === 1008) {
        if (e.code !== 1000) {
          setStatus("disconnected");
        }
        return;
      }

      setStatus("connecting");
      const delay = Math.min(
        maxReconnectDelay,
        baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current)
      );

      reconnectAttemptsRef.current += 1;

      setTimeout(() => {
        if (socketRef.current === null && connectWebSocketRef.current) {
          connectWebSocketRef.current();
        }
      }, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [symbol, playWhaleChime]);

  // Keep connectWebSocket in ref for timeout access
  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  useEffect(() => {
    prevPriceRef.current = null;
    connectWebSocket();

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close(1000);
      }
    };
  }, [symbol, connectWebSocket]);

  const connected = status === "connected";

  return (
    <TelemetryContext.Provider
      value={{
        data,
        connected,
        status,
        symbol,
        setSymbol,
        priceHistory,
        priceDirection,
        allMarketData,
        audioEnabled,
        setAudioEnabled,
        activeTab,
        setActiveTab,
        playWhaleChime,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};
