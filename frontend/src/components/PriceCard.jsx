import { useTelemetry } from "../context/useTelemetry";
import {
  formatMarketPrice,
  formatPriceChange,
  formatCompactVolume,
  formatSpread,
} from "../utils/formatters";

const PriceCard = () => {
  const { data, priceDirection, symbol } = useTelemetry();

  if (!data) {
    return (
      <div className="w-full p-6 rounded-2xl terminal-card font-mono flex flex-col items-center justify-center gap-3 min-h-[220px]">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Synchronizing Ingestion Pipeline [{symbol}]...
        </span>
      </div>
    );
  }

  const cleanSymbol = data.symbol || symbol.replace("-", "/");
  const price = typeof data.price === "number" ? data.price : 0;
  const change = typeof data.change === "number" ? data.change : 0;
  const volume = typeof data.volume === "number" ? data.volume : 0;
  const high = typeof data.high === "number" ? data.high : price;
  const low = typeof data.low === "number" ? data.low : price;
  const spread = typeof data.spread === "number" ? data.spread : 0;
  const isWhale = Boolean(data.is_whale || data.whale_alert);
  const whaleThreshold = data.whale_threshold || 0;

  const isBullish = change >= 0;

  // Calculate 24h range percentage
  const rangeSpan = high - low;
  const currentRangePosition =
    rangeSpan > 0 ? Math.min(100, Math.max(0, ((price - low) / rangeSpan) * 100)) : 50;

  // Volatility evaluation
  const volatilityLevel =
    spread > 5.0 ? "ELEVATED" : spread > 2.5 ? "ACTIVE" : "STABLE";
  const volatilityBadgeColor =
    spread > 5.0
      ? "bg-rose-950/50 text-rose-400 border-rose-900/40"
      : spread > 2.5
      ? "bg-amber-950/50 text-amber-400 border-amber-900/40"
      : "bg-emerald-950/50 text-emerald-400 border-emerald-900/40";

  return (
    <div
      className={`w-full p-5 md:p-6 rounded-2xl terminal-card font-mono flex flex-col justify-between gap-5 transition-all select-none ${
        priceDirection === "up"
          ? "flash-up"
          : priceDirection === "down"
          ? "flash-down"
          : ""
      }`}
    >
      {/* Top Meta Bar */}
      <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base font-extrabold text-slate-100 tracking-wider">
            {cleanSymbol}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
            SPOT ORACLE
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isWhale && (
            <div className="flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50 animate-pulse">
              <span>🐋 WHALE THRESHOLD TRIGGERED</span>
            </div>
          )}
          <div
            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${volatilityBadgeColor}`}
          >
            VOLATILITY: {volatilityLevel} ({formatSpread(spread)})
          </div>
        </div>
      </div>

      {/* Main Big Price Display */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-100 tracking-tight tabular-nums">
            ${formatMarketPrice(price)}
          </span>
          <span className="text-xs text-slate-500 font-semibold">USD</span>
        </div>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs md:text-sm font-bold tabular-nums self-start sm:self-auto ${
            isBullish
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/50"
              : "bg-rose-950/40 text-rose-400 border-rose-800/50"
          }`}
        >
          <span>{isBullish ? "▲" : "▼"}</span>
          <span>{formatPriceChange(change)}</span>
          <span className="text-[10px] opacity-70">24H</span>
        </div>
      </div>

      {/* 24-Hour Range Bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] font-medium text-slate-400 tabular-nums">
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[10px]">24H LOW:</span>
            <span className="text-slate-300 font-bold">${formatMarketPrice(low)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[10px]">24H HIGH:</span>
            <span className="text-slate-300 font-bold">${formatMarketPrice(high)}</span>
          </div>
        </div>
        {/* Track Slider */}
        <div className="relative w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400 rounded-full"
            style={{ width: `${currentRangePosition}%` }}
          />
        </div>
      </div>

      {/* Metrics Footer Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-[#1a2333] pt-3 text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            24h Turnover Volume
          </span>
          <span className="font-extrabold text-slate-200 tabular-nums">
            {formatCompactVolume(volume)}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Whale Alert Cap
          </span>
          <span className="font-extrabold text-amber-400 tabular-nums">
            {whaleThreshold > 0 ? formatCompactVolume(whaleThreshold) : "Dynamic"}
          </span>
        </div>

        <div className="flex flex-col col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Stream Status
          </span>
          <span className="font-extrabold text-emerald-400 uppercase tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Full-Duplex WS
          </span>
        </div>
      </div>
    </div>
  );
};

export default PriceCard;
