import { Component, type ErrorInfo, type ReactNode } from "react";

type RouteErrorBoundaryProps = {
  children: ReactNode;
};

type RouteErrorBoundaryState = {
  hasError: boolean;
};

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ProductionBinder route error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
          <section
            role="alert"
            className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-950/30 p-6 shadow-xl"
          >
            <h1 className="text-2xl font-semibold mb-3">
              ProductionBinder could not load
            </h1>
            <p className="text-slate-200 mb-6">
              A dashboard module failed to load. This can happen after a new
              deployment or a stale browser cache.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              Reload
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
