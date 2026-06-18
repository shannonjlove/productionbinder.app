import { lazy, Suspense } from "react";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

const ProductionDashboard = lazy(() =>
  import("@/components/ProductionDashboard").then((module) => ({
    default: module.ProductionDashboard,
  }))
);

const ParallaxHeroBackground = lazy(() =>
  import("@/components/ParallaxHeroBackground").then((module) => ({
    default: module.ParallaxHeroBackground,
  }))
);

export default function Index() {
  return (
    <RouteErrorBoundary>
      <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        <Suspense fallback={null}>
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 pointer-events-none"
          >
            <ParallaxHeroBackground />
          </div>
        </Suspense>

        <section className="relative z-10 min-h-screen">
          <Suspense fallback={<DashboardSkeleton />}>
            <ProductionDashboard />
          </Suspense>
        </section>
      </main>
    </RouteErrorBoundary>
  );
}
