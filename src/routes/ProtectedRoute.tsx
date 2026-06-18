import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LoadingFallback } from "@/components/LoadingFallback";

export function ProtectedRoute() {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback label="Checking your ProductionBinder session..." />;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
        <section
          role="alert"
          className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-950/30 p-6 shadow-xl"
        >
          <h1 className="text-2xl font-semibold mb-3">Authentication Error</h1>
          <p className="text-slate-200 mb-6">
            {error instanceof Error
              ? error.message
              : "Something went wrong while checking your session."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-3 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            Retry
          </button>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <Outlet />;
}
