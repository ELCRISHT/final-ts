import React from "react";
import { HomeIcon, RefreshCwIcon } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("TrackSmart ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#0a0f1e] p-4">
          <div className="text-center max-w-sm w-full animate-fade-in">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6">
              An unexpected error occurred. Please reload the page or go home.
            </p>
            {this.state.error && (
              <p className="text-xs text-slate-600 font-mono mb-6 bg-white/3 p-3 rounded-xl text-left break-all">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="ts-btn-primary btn btn-sm gap-2 px-5"
              >
                <RefreshCwIcon className="size-4" /> Reload
              </button>
              <button
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = "/"; }}
                className="btn btn-sm btn-ghost gap-2 px-5 text-slate-400 border border-white/10"
              >
                <HomeIcon className="size-4" /> Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
