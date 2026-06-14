import React, { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Route technical crash telemetry directly into the browser console context
    console.error("── 💥 CRITICAL INTERFACE RENDERING PANIC ──");
    console.error("Exception Vector:", error);
    console.error("Component Stack Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-rose-900/60 rounded-2xl bg-neutral-950 text-neutral-200 w-96 font-mono border-dashed shadow-2xl shadow-rose-950/10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="text-xs">⚠️</span>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">
                UI Circuit Fault Isolated
              </h3>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              A fatal rendering exception occurred within a downstream layout node. The execution layer has been sandboxed to safeguard app runtime states.
            </p>
            <div className="mt-1 p-3 bg-neutral-900/60 border border-neutral-800/80 rounded text-[9px] text-rose-300/90 overflow-x-auto whitespace-pre-wrap max-h-24 select-all unique-scrollbar">
              {this.state.error?.toString() || "Unknown Component Exception"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-center text-[9px] font-black uppercase tracking-wider py-2 bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition-all rounded text-neutral-400 hover:text-neutral-200"
            >
              Force Component Reset
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
