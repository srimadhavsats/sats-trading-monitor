import React, { useState, useEffect } from "react";
// Import centralized config and theme mappings
import { CONFIG } from "../config";
import { THEME } from "../theme";
// Import centralized telemetry formatting utilities
import {
  formatMarketPrice,
  formatCompactVolume,
  formatPriceChange,
  formatSpread,
} from "../utils/formatters";
// Import centralized client storage abstraction layer
import { storage } from "../utils/storage";

const lineCommand = (point, i, a) => {
  const [x, y] = point;
  if (i === 0) return `M ${x},${y}`;
  const [px, py] = a[i - 1];
  const cpx1 = px + (x - px) * 0.5;
  const cpy1 = py;
  const cpx2 = x - (x - px) * 0.5;
  const cpy2 = y;
  return `C ${cpx1},${cpy1} ${cpx2},${cpy2} ${x},${y}`;
};

const PriceCard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(() =>
    storage.get("selected_symbol", "BTC-USDT"),
  );
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [sessionHigh, setSessionHigh] = useState(null);
  const [sessionLow, setSessionLow] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const maxTicks = CONFIG.MAX_CHART_TICKS;

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let isMounted = true;
    let connectionAttempts = 0;

    const connect = () => {
      if (!isMounted) return;

      // Security Configuration: Establish the fallback authorization signature credential
      const authToken = "sats_dev_fallback_secure_token_2026";

      // Defensive Control: Append the validation token parameter cleanly into the connection URI path
      const wsUrl = `${CONFIG.BACKEND_WS_URL}/ws/price/${selectedSymbol}?token=${authToken}`;
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        if (isMounted) {
          setConnected(true);
          connectionAttempts = 0;
          console.log(`✅ Telemetry Link Established: ${selectedSymbol}`);
        }
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
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
          console.error("❌ Oracle Data Error:", err);
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
          `📡 Network link dropped. Retrying gateway connection in ${finalReconnectDelay}ms (Attempt ${connectionAttempts + 1})`,
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
  }, [selectedSymbol]);

  const handleSymbolChange = (sym) => {
    setSelectedSymbol(sym);
    storage.set("selected_symbol", sym);
    setHistory([]);
    setSessionHigh(null);
    setSessionLow(null);
    setLastUpdated(null);
  };

  if (!data) {
    return (
      <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-900/40 w-96 animate-pulse flex flex-col justify-center items-center h-80">
        <p className="text-neutral-500 font-mono text-[10px] uppercase tracking-widest text-center">
          {connected
            ? "Receiving Data Feed..."
            : "Establishing Telemetry Link..."}
        </p>
      </div>
    );
  }

  const currentHistory =
    history.length > 0 ? history : [data.price, data.price];
  const minPrice = Math.min(...currentHistory);
  const maxPrice = Math.max(...currentHistory);
  const priceRange = (maxPrice - minPrice) * 1.4 || 1;
  const chartMin = minPrice - priceRange * 0.2;
  const prevPrice =
    history.length > 1 ? history[history.length - 2] : data.price;

  const isClimbing = data.price > prevPrice;
  const isDropping = data.price < prevPrice;
  const velocityColor = isClimbing
    ? THEME.velocity.bullish
    : isDropping
      ? THEME.velocity.bearish
      : THEME.velocity.neutral;

  const getPlotY = (price) => 128 - ((price - chartMin) / priceRange) * 128;
  const points = currentHistory.map((p, i) => [
    (i / (maxTicks - 1)) * 384,
    getPlotY(p),
  ]);
  const dAttr = points.map((point, i, a) => lineCommand(point, i, a)).join(" ");

  return (
    <div className="p-6 border rounded-2xl bg-neutral-900/95 backdrop-blur-2xl w-96 relative border-neutral-800">
      <div className="absolute left-6 top-6 flex gap-2 z-50">
        {CONFIG.TRACKED_SYMBOLS.map((sym) => (
          <button
            key={sym}
            onClick={() => handleSymbolChange(sym)}
            className={`text-[8px] font-black px-2 py-1 rounded border transition-all ${selectedSymbol === sym ? "bg-neutral-100 text-black border-neutral-100" : "bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600"}`}
          >
            {sym.split("-")[0]}
          </button>
        ))}
      </div>

      <div className="relative z-30 mb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.3em] pl-24">
            {data.symbol || selectedSymbol}
          </h3>
          <div
            className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase flex items-center gap-1 ${connected ? THEME.status.online : THEME.status.offline}`}
          >
            <span className={connected ? "animate-pulse" : ""}>●</span>
            {connected ? "Live" : "Offline"}
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <h2
            className="text-5xl font-black tabular-nums tracking-tighter italic"
            style={{ color: velocityColor }}
          >
            ${formatMarketPrice(data.price)}
          </h2>
          <span
            className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-[4px] ${data.change > 0 ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50" : data.change < 0 ? "bg-rose-950/80 text-rose-400 border border-rose-800/50" : "bg-neutral-950/80 text-neutral-400 border border-neutral-800/50"}`}
          >
            {formatPriceChange(data.change)}
          </span>
        </div>

        <div className="flex gap-3 mt-2 pl-0.5 items-center">
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-black text-neutral-600 uppercase tracking-wider">
              High
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-400">
              ${sessionHigh ? formatMarketPrice(sessionHigh) : "--.--"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[7px] font-black text-neutral-600 uppercase tracking-wider">
              Low
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-400">
              ${sessionLow ? formatMarketPrice(sessionLow) : "--.--"}
            </span>
          </div>
          <div className="flex items-center gap-1 border-l border-neutral-800/80 pl-2.5">
            <span className="text-[7px] font-black text-neutral-600 uppercase tracking-wider">
              24H Spread
            </span>
            <span className="text-[10px] font-mono font-bold text-neutral-300">
              {formatSpread(data.spread)}
            </span>
          </div>
        </div>

        {data.is_whale && (
          <div className="mt-3 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded flex justify-between items-center animate-pulse">
            <span className="text-[7px] font-black tracking-widest text-neutral-400 uppercase">
              Alert: Volume Threshold Breach
            </span>
            <span className="text-[8px] font-mono font-bold text-neutral-500">
              Target Reached
            </span>
          </div>
        )}
      </div>

      <div className="relative h-32 w-full bg-black/60 rounded-xl border border-neutral-800/40 overflow-hidden mb-5">
        <div className="absolute right-2.5 top-2 text-[7px] font-mono font-black text-neutral-700 select-none z-40 pointer-events-none uppercase tracking-wider">
          Ceiling: ${formatMarketPrice(maxPrice)}
        </div>
        <div className="absolute right-2.5 bottom-2 text-[7px] font-mono font-black text-neutral-700 select-none z-40 pointer-events-none uppercase tracking-wider">
          Floor: ${formatMarketPrice(minPrice)}
        </div>

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 384 128"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="32"
            x2="384"
            y2="32"
            stroke="#171717"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1="64"
            x2="384"
            y2="64"
            stroke="#171717"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1="96"
            x2="384"
            y2="96"
            stroke="#171717"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          <path
            d={`${dAttr} L 384,128 L 0,128 Z`}
            fill={velocityColor}
            fillOpacity={THEME.chart.fillOpacity}
            className="transition-all duration-1000"
          />
          <path
            d={dAttr}
            fill="none"
            stroke={velocityColor}
            strokeWidth={THEME.chart.strokeWidth}
            className="transition-all duration-1000"
          />
        </svg>
      </div>

      <div className="flex justify-between items-end border-t border-neutral-800 pt-4">
        <div className="flex flex-col gap-1">
          <p className="text-neutral-600 text-[8px] font-black uppercase tracking-widest">
            Data Pipeline
          </p>
          <p className="text-[11px] font-mono font-black text-neutral-300">
            Singapore / Bybit
          </p>
        </div>

        <div className="flex flex-col gap-1 text-right">
          <p className="text-neutral-600 text-[8px] font-black uppercase tracking-widest">
            24H Turnover
          </p>
          <p className="text-[11px] font-mono font-black text-neutral-200">
            {formatCompactVolume(data.volume)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
