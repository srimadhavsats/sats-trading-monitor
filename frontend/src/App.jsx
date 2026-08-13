import { TelemetryProvider } from "./context/TelemetryContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import MarketTickerStrip from "./components/MarketTickerStrip";
import PriceCard from "./components/PriceCard";
import PriceSparkline from "./components/PriceSparkline";
import WhaleLedgerLog from "./components/WhaleLedgerLog";
import ThresholdController from "./components/ThresholdController";
import NetworkDiagnostics from "./components/NetworkDiagnostics";
import RoomMetrics from "./components/RoomMetrics";
import ConnectionBanner from "./components/ConnectionBanner";
import StatusBar from "./components/StatusBar";

const App = () => {
  return (
    <ErrorBoundary>
      <TelemetryProvider>
        <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-300">
          {/* Top Global Command Header */}
          <Header />

          {/* Main Dashboard Viewport Container */}
          <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
            {/* Global Recovery Notice if transport drops */}
            <ConnectionBanner />

            {/* Top Multi-Asset Overview Ticker Strip */}
            <MarketTickerStrip />

            {/* Pro Terminal Multi-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left & Center Main Stage: Active Asset & Advanced Visualizer */}
              <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                <PriceCard />
                <PriceSparkline />
                <NetworkDiagnostics />
              </section>

              {/* Right Stage: Whale Tape, Threshold Matrix & Room Distribution */}
              <aside className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
                <WhaleLedgerLog />
                <ThresholdController />
                <RoomMetrics />
              </aside>
            </div>
          </main>

          {/* Bottom Terminal Status Bar */}
          <StatusBar />
        </div>
      </TelemetryProvider>
    </ErrorBoundary>
  );
};

export default App;
