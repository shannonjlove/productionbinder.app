export function DashboardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading ProductionBinder dashboard"
      className="min-h-screen w-full px-6 py-8"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-56 rounded-lg bg-white/10 animate-pulse" />
          <div className="h-10 w-32 rounded-lg bg-white/10 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-40 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
