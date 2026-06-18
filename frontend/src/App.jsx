import React from "react";
// Import the global streaming state engine provider
import { TelemetryProvider } from "./context/TelemetryContext";
// Import technical defense sandbox shields
import ErrorBoundary from "./components/ErrorBoundary";
// Import downstream telemetry data consumers
import PriceCard from "./components/PriceCard";
import NetworkDiagnostics from "./components/NetworkDiagnostics";
import RoomMetrics from "./components/RoomMetrics";

const App = () => {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-start gap-6 p-8 select-none">
      {/* 1. Global Sandbox Error Boundary Guard */}
      <ErrorBoundary>
        {/* 2. Global Stream Context Node Provider */}
        <TelemetryProvider>
          {/* Dashboard Branding Header */}
          <div className="flex flex-col items-center gap-1 mt-4 mb-2">
            <h1 className="text-sm font-black uppercase tracking-[0.4em] text-neutral-400">
              Sats Trading Monitor
            </h1>
            <p className="text-[9px] font-mono font-black text-neutral-600 uppercase tracking-widest">
              High-Frequency Institutional Telemetry v4.2
            </p>
          </div>

          {/* 3. Stream-Dependent Interactive Display Components */}
          <PriceCard />
          <NetworkDiagnostics />
          <RoomMetrics />
        </TelemetryProvider>
      </ErrorBoundary>
    </div>
  );
};

export default App;
