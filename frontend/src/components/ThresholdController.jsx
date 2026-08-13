import { useState } from "react";
import { CONFIG } from "../config";
import { formatCompactVolume } from "../utils/formatters";

const ThresholdController = () => {
  const [targetSymbol, setTargetSymbol] = useState("BTC-USDT");
  const [threshold, setThreshold] = useState(50000000);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const presets = [
    { label: "$1M", value: 1000000 },
    { label: "$5M", value: 5000000 },
    { label: "$10M", value: 10000000 },
    { label: "$25M", value: 25000000 },
    { label: "$50M", value: 50000000 },
    { label: "$100M", value: 100000000 },
  ];

  const handleApplyThreshold = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setIsError(false);

    if (!threshold || threshold <= 0) {
      setIsError(true);
      setStatusMsg("Threshold allocation must be a positive numeric value.");
      return;
    }

    setIsSubmitting(true);
    try {
      const baseUrl = CONFIG.BACKEND_URL.endsWith("/")
        ? CONFIG.BACKEND_URL.slice(0, -1)
        : CONFIG.BACKEND_URL;

      const response = await fetch(`${baseUrl}/config/thresholds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: targetSymbol,
          threshold: parseFloat(threshold),
        }),
      });

      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        throw new Error(data.detail || `Server error (Code ${response.status})`);
      }

      setIsError(false);
      setStatusMsg(
        `Success: ${targetSymbol} threshold updated to ${formatCompactVolume(data.updated_threshold)}`
      );

      setTimeout(() => setStatusMsg(""), 5000);
    } catch (err) {
      setIsError(true);
      setStatusMsg(err.message || "Failed to update configuration parameter.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full p-5 rounded-2xl terminal-card font-mono flex flex-col gap-3 select-none">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-[#1a2333] pb-3">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400">⚙️</span>
          <h3 className="text-xs font-black text-slate-200 uppercase tracking-wider">
            Whale Threshold Matrix
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-bold uppercase">
          Dynamic Hot-Reload
        </span>
      </div>

      <form onSubmit={handleApplyThreshold} className="flex flex-col gap-3 text-xs">
        {/* Symbol Select & Input Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Asset Target
            </label>
            <select
              value={targetSymbol}
              onChange={(e) => setTargetSymbol(e.target.value)}
              className="bg-[#090d16] border border-[#1b2438] rounded-xl p-2.5 text-slate-200 font-semibold focus:border-emerald-500/80 outline-none cursor-pointer"
            >
              {CONFIG.SUPPORTED_PAIRS.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.symbol} ({pair.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Volume Cap ($ USD)
            </label>
            <input
              type="number"
              value={threshold}
              min="1"
              step="100000"
              onChange={(e) => setThreshold(e.target.value)}
              className="bg-[#090d16] border border-[#1b2438] rounded-xl p-2.5 text-slate-100 font-bold focus:border-emerald-500/80 outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                type="button"
                key={p.label}
                onClick={() => setThreshold(p.value)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                  threshold === p.value
                    ? "bg-emerald-950/60 text-emerald-400 border-emerald-700/60"
                    : "bg-[#090d16] text-slate-400 border-[#1b2438] hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 active:scale-[0.99] transition-all text-emerald-400 font-black uppercase tracking-wider rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <span>Applying Config...</span>
            </>
          ) : (
            <span>🚀 Inject Config Frame</span>
          )}
        </button>
      </form>

      {/* Status Feedback Toast */}
      {statusMsg && (
        <div
          className={`p-2.5 border text-xs font-semibold rounded-xl text-center ${
            isError
              ? "text-rose-400 bg-rose-950/30 border-rose-900/40"
              : "text-emerald-400 bg-emerald-950/30 border-emerald-900/40"
          }`}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
};

export default ThresholdController;
