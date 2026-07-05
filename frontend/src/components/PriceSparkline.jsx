import React from "react";
import { useTelemetry } from "../context/TelemetryContext";

const PriceSparkline = () => {
  const { priceHistory } = useTelemetry();

  // Guard clause: We need at least 2 coordinate points to draw a geometric vector path
  if (priceHistory.length < 2) {
    return (
      <div className="w-full h-12 flex items-center justify-center text-[8px] text-neutral-600 font-mono font-black uppercase tracking-widest">
        Buffering Tick Vectors...
      </div>
    );
  }

  // Extract raw prices to map mathematical space bounds
  const prices = priceHistory.map((d) => d.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const priceRange = maxPrice - minPrice === 0 ? 1 : maxPrice - minPrice;

  // Viewbox canvas space geometry definitions
  const width = 300;
  const height = 48;
  const padding = 2;
  const chartHeight = height - padding * 2;

  // Map temporal price points into relative SVG grid pixels
  const points = priceHistory
    .map((point, index) => {
      const x = (index / (priceHistory.length - 1)) * width;
      // Invert Y axis mapping since SVG coordinate systems evaluate 0 from the roof block
      const y =
        padding + (1 - (point.price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Determine trend vector direction to color code the spark layer boundary
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const isBullish = lastPrice >= firstPrice;
  const strokeColor = isBullish ? "stroke-emerald-400" : "stroke-rose-400";
  const fillColor = isBullish ? "fill-emerald-500/5" : "fill-rose-500/5";

  // Build an enclosing closed path string to render a gradient shadow panel under the wave
  const closedPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <div className="w-full border border-neutral-800/40 bg-neutral-950 p-2 rounded-xl flex flex-col gap-1 select-none font-mono">
      <div className="flex items-center justify-between text-[7px] text-neutral-500 font-bold uppercase tracking-wider px-1">
        <span>30-Tick Pulse Trend</span>
        <span className="tabular-nums text-neutral-400">
          Δ ${(lastPrice - firstPrice).toFixed(2)}
        </span>
      </div>

      <div className="relative w-full h-12 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          {/* Shaded Area Under Canvas Path Vector */}
          <polygon points={closedPoints} className={fillColor} />

          {/* Primary Sharp Trend Tracking Line */}
          <polyline
            fill="none"
            points={points}
            className={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default PriceSparkline;
