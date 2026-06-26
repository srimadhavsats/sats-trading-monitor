import React, { useState } from "react";
import { CONFIG } from "../config";

const ThresholdController = () => {
  const [symbol, setSymbol] = useState("BTC-USDT");
  const [threshold, setThreshold] = useState(5000000);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const handleApplyThreshold = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setIsError(false);

    // Client-side validation is UX. Not security,
    // Catch obvious errors early to save network bandwidth and guide the user.
    if (!threshold || threshold <= 0) {
      setIsError(true);
      setStatusMsg(
        "UX Input Check: Volume allocation must be a positive number.",
      );
      return;
    }

    try {
      const baseUrl =
        CONFIG.BACKEND_URL ||
        CONFIG.BACKEND_WS_URL.replace("ws://", "http://").replace("/ws", "");
      const response = await fetch(`${baseUrl}/config/thresholds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: symbol,
          threshold: parseFloat(threshold),
        }),
      });

      // Defensive Parsing Check: Handle scenarios where the response isn't structured JSON
      let data = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        // Digest generic error structures gracefully without leaking internals
        throw new Error(
          data.detail || `Gateway Error Status Code: ${response.status}`,
        );
      }

      setIsError(false);
      setStatusMsg(
        `Success: ${symbol} threshold set to ${data.updated_threshold}`,
      );
    } catch (err) {
      setIsError(true);
      // Fallback display logic guarantees the raw traceback string never blows up the user's browser
      setStatusMsg(err.message || "Pipeline interaction failed unexpectedly.");
    }
  };

  return (
    <div className="w-96 p-5 border rounded-2xl bg-neutral-900/95 backdrop-blur-2xl border-neutral-800 font-mono flex flex-col gap-3">
      <div className="flex flex-col gap-0.5 border-b border-neutral-800/60 pb-2">
        <h4 className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
          Dynamic Parameter Matrix
        </h4>
        <p className="text-[7px] text-neutral-600 uppercase font-bold tracking-wider">
          Hardened runtime override console with backend fallback parsing
        </p>
      </div>

      <form
        onSubmit={handleApplyThreshold}
        className="flex flex-col gap-3 text-[10px]"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[7px] font-black text-neutral-500 uppercase tracking-wider">
            Target Node Selector
          </label>
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-300 font-bold focus:border-neutral-700 outline-none cursor-pointer"
          >
            <option value="BTC-USDT">BTC / USDT</option>
            <option value="ETH-USDT">ETH / USDT</option>
            <option value="SOL-USDT">SOL / USDT</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[7px] font-black text-neutral-500 uppercase tracking-wider">
            Whale Volume Cap ($)
          </label>
          <input
            type="number"
            value={threshold}
            min="1"
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-neutral-200 font-bold focus:border-neutral-700 outline-none tabular-nums"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-[0.98] transition-all text-neutral-300 font-black uppercase tracking-widest rounded-lg text-[8px]"
        >
          Inject Config Frame
        </button>
      </form>

      {statusMsg && (
        <div
          className={`mt-1 p-2 border text-[8px] font-bold uppercase tracking-wide rounded-md text-center ${
            isError
              ? "text-rose-400 bg-rose-950/20 border-rose-900/40"
              : "text-emerald-400 bg-emerald-950/20 border-emerald-900/40"
          }`}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
};

export default ThresholdController;
