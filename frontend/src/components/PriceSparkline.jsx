import { useState } from "react";
import { useTelemetry } from "../context/useTelemetry";
import { formatMarketPrice, formatPriceChange } from "../utils/formatters";
import TradingViewEmbed from "./TradingViewEmbed";

const PriceSparkline = () => {
  const { priceHistory, activeTab, setActiveTab, symbol } = useTelemetry();
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const cleanSymbol = symbol.replace("-", "/");

  // If there are less than 2 data points, show buffer loader in sparkline view
  const renderSparkline = () => {
    if (priceHistory.length < 2) {
      return (
        <div className="w-full h-64 flex flex-col items-center justify-center gap-2 text-xs text-slate-500 font-mono">
          <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-bold tracking-wider uppercase">
            Accumulating Tick Vectors ({priceHistory.length}/2)...
          </span>
        </div>
      );
    }

    const prices = priceHistory.map((d) => d.price);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice;

    const width = 800;
    const height = 260;
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const pointsArray = priceHistory.map((point, index) => {
      const x = padding + (index / (priceHistory.length - 1)) * chartWidth;
      const y =
        padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;
      return { x, y, price: point.price, time: point.time };
    });

    const pointsString = pointsArray.map((p) => `${p.x},${p.y}`).join(" ");

    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isBullish = lastPrice >= firstPrice;
    const delta = lastPrice - firstPrice;
    const deltaPercent = firstPrice > 0 ? (delta / firstPrice) * 100 : 0;

    const strokeColor = isBullish ? "#10b981" : "#f43f5e";
    const gradientId = isBullish ? "bullishGradient" : "bearishGradient";

    const closedPointsString = `${padding},${height - padding} ${pointsString} ${
      width - padding
    },${height - padding}`;

    return (
      <div className="flex flex-col gap-3">
        {/* Sparkline Top Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-[#1a2333] pb-2">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
              35-Tick High-Frequency Pulse
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">WINDOW DELTA:</span>
              <span
                className={`font-extrabold tabular-nums ${
                  isBullish ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {delta >= 0 ? `+$${formatMarketPrice(delta)}` : `-$${formatMarketPrice(Math.abs(delta))}`} ({formatPriceChange(deltaPercent)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 tabular-nums">
            <div>
              <span className="text-slate-500 text-[10px] mr-1">MIN:</span>
              <span className="text-slate-200 font-bold">${formatMarketPrice(minPrice)}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] mr-1">MAX:</span>
              <span className="text-slate-200 font-bold">${formatMarketPrice(maxPrice)}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Vector SVG Canvas */}
        <div className="relative w-full h-64 select-none">
          <svg
            className="w-full h-full"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Background Horizontal Gridlines */}
            <line
              x1={padding}
              y1={padding}
              x2={width - padding}
              y2={padding}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <line
              x1={padding}
              y1={height / 2}
              x2={width - padding}
              y2={height / 2}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="#1e293b"
              strokeDasharray="4 4"
              strokeWidth="1"
            />

            {/* Shaded Area Under Vector Wave */}
            <polygon points={closedPointsString} fill={`url(#${gradientId})`} />

            {/* Primary Sharp Trend Tracking Line */}
            <polyline
              fill="none"
              points={pointsString}
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Interactive Coordinate Nodes */}
            {pointsArray.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint?.idx === idx ? "5" : idx === pointsArray.length - 1 ? "4" : "2"}
                fill={idx === pointsArray.length - 1 ? strokeColor : "#1e293b"}
                stroke={strokeColor}
                strokeWidth={idx === pointsArray.length - 1 ? "2" : "1"}
                className="transition-all cursor-pointer"
                onMouseEnter={() => setHoveredPoint({ ...pt, idx })}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}

            {/* Live Crosshair Indicator if Hovered */}
            {hoveredPoint && (
              <g>
                <line
                  x1={hoveredPoint.x}
                  y1={padding}
                  x2={hoveredPoint.x}
                  y2={height - padding}
                  stroke="#64748b"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r="6"
                  fill="#f8fafc"
                  stroke={strokeColor}
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono shadow-xl pointer-events-none z-10 flex items-center gap-3"
            >
              <span className="text-slate-400">TICK #{hoveredPoint.idx + 1}</span>
              <span className="text-slate-100 font-extrabold tabular-nums">
                ${formatMarketPrice(hoveredPoint.price)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-5 rounded-2xl terminal-card flex flex-col gap-4">
      {/* Chart View Switcher Header */}
      <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black uppercase text-slate-300 tracking-wider">
            {cleanSymbol} Advanced Charting
          </span>
        </div>

        <div className="flex items-center bg-[#090d16] border border-[#1b2438] p-1 rounded-xl gap-1 font-mono">
          <button
            onClick={() => setActiveTab("sparkline")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "sparkline"
                ? "bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚡ Real-Time Pulse
          </button>
          <button
            onClick={() => setActiveTab("tradingview")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "tradingview"
                ? "bg-slate-800 text-emerald-400 border border-slate-700/80 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📊 TradingView Pro
          </button>
        </div>
      </div>

      {/* Render Active Chart Mode */}
      {activeTab === "sparkline" ? renderSparkline() : <TradingViewEmbed />}
    </div>
  );
};

export default PriceSparkline;
