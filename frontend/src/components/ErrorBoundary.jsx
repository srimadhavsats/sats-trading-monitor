import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Component panic caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-xl mx-auto p-6 border border-rose-900/60 rounded-2xl bg-[#090d16] text-slate-200 font-mono shadow-2xl">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-rose-400">
              <span className="text-sm">⚠️</span>
              <h3 className="text-xs font-black uppercase tracking-wider">
                Interface Exception Isolated
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A rendering exception occurred within a child component. The runtime has been sandboxed safely.
            </p>
            <div className="mt-1 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-32 select-all custom-scrollbar">
              {this.state.error?.toString() || "Unknown Component Exception"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-center text-xs font-bold uppercase tracking-wider py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-500 transition-all rounded-xl text-slate-200 cursor-pointer"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
