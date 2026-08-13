import { useState, useEffect } from "react";
import { useTelemetry } from "../context/useTelemetry";
import { CONFIG } from "../config";
import { formatMarketPrice, formatPriceChange, formatCompactVolume } from "../utils/formatters";

const MarketTickerStrip = () => {
  const { symbol, setSymbol, data: activeData } = useTelemetry();
  const [tickerData, setTickerData] = useState({});

  // Poll central cache endpoint or diagnostics to update prices for all pairs
  useEffect(() => {
    let isSubscribed = true;

    const fetchAllTickers = async () => {
      try {
        const promises = CONFIG.SUPPORTED_PAIRS.map(async (pair) => {
          const apiSymbol = pair.id.replace("-", "");
          const formattedSymbol = apiSymbol.includes("SATS") && !apiSymbol.includes("1000")
            ? `1000${apiSymbol}`
            : apiSymbol;

          try {
            const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=spot&symbol=${formattedSymbol}`);
            if (res.ok) {
              const json = await res.json();
              const item = json.result?.list?.[0];
              if (item) {
                return {
                  id: pair.id,
                  price: parseFloat(item.lastPrice || 0),
                  change: parseFloat(item.price24hPcnt || 0) * 100,
                  volume: parseFloat(item.turnover24h || 0),
                  high: parseFloat(item.highPrice24h || 0),
                  low: parseFloat(item.lowPrice24h || 0),
                };
              }
            }
          } catch {
            // Fallback gracefully
          }
          return null;
        });

        const results = await Promise.all(promises);
        if (!isSubscribed) return;

        const nextData = {};
        results.forEach((r) => {
          if (r) nextData[r.id] = r;
        });

        setTickerData((prev) => ({ ...prev, ...nextData }));
      } catch {
        // Fallback gracefully
      }
    };

    fetchAllTickers();
    const interval = setInterval(fetchAllTickers, 6000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      {CONFIG.SUPPORTED_PAIRS.map((pair) => {
        const item = tickerData[pair.id];
        const isSelected = symbol === pair.id;
        
        // If this is the active symbol, prefer the live activeData
        const livePrice = (isSelected && activeData?.price) ? activeData.price : item?.price;
        const liveChange = (isSelected && typeof activeData?.change === "number") ? activeData.change : item?.change;
        const liveVolume = (isSelected && typeof activeData?.volume === "number") ? activeData.volume : item?.volume;

        const price = livePrice || 0;
        const change = liveChange || 0;
        const volume = liveVolume || 0;
        const isBullish = change >= 0;

        return (
          <div
            key={pair.id}
            onClick={() => setSymbol(pair.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              isSelected
                ? "bg-[#0f172a]/90 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.08)]"
                : "bg-[#0d131f]/70 border-[#1b2438] hover:border-slate-700 hover:bg-[#111a2c]/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-slate-200">
                  {pair.symbol}
                </span>
                {isSelected && (
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    ACTIVE
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-mono font-semibold tabular-nums ${
                  isBullish ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatPriceChange(change)}
              </span>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm md:text-base font-mono font-extrabold text-slate-100 tabular-nums">
                {price > 0 ? `$${formatMarketPrice(price)}` : "--"}
              </span>
              <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                Vol {formatCompactVolume(volume)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketTickerStrip;
