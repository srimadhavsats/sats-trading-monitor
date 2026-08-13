import { useEffect, useRef } from "react";
import { useTelemetry } from "../context/useTelemetry";

const TradingViewEmbed = () => {
  const { symbol } = useTelemetry();
  const containerRef = useRef(null);

  const cleanSymbol = symbol.replace("-", "");
  const formattedSymbol = cleanSymbol.includes("SATS") && !cleanSymbol.includes("1000")
    ? `1000${cleanSymbol}`
    : cleanSymbol;
  const tvSymbol = `BINANCE:${formattedSymbol}`;

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // Clear previous widget
    currentContainer.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.id = `tv_widget_${formattedSymbol}`;
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";
    currentContainer.appendChild(widgetContainer);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== "undefined") {
        new window.TradingView.widget({
          autosize: true,
          symbol: tvSymbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0d131f",
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: widgetContainer.id,
          studies: [
            "MASimple@tv-basicstudies",
            "MAExp@tv-basicstudies",
            "RSI@tv-basicstudies",
          ],
        });
      }
    };

    currentContainer.appendChild(script);

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
    };
  }, [tvSymbol, formattedSymbol]);

  return (
    <div className="w-full h-[460px] rounded-xl overflow-hidden border border-[#1b2438] bg-[#090d16] relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default TradingViewEmbed;
