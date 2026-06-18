import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { LoadingFallback } from "@/components/LoadingFallback";

export function AdminRoute() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return <LoadingFallback label="Verifying admin access..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
        <section
          role="alert"
          className="max-w-md w-full rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 shadow-xl text-center"
        >
          <h1 className="text-2xl font-semibold mb-3">Admins only</h1>
          <p className="text-slate-200 mb-6">
            You don't have permission to view this area of ProductionBinder.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-3 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            Back to dashboard
          </a>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
