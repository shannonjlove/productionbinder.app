type LoadingFallbackProps = {
  label?: string;
};

export function LoadingFallback({
  label = "Loading ProductionBinder...",
}: LoadingFallbackProps) {
  return (
    <main
      className="min-h-screen flex items-center justify-center bg-slate-950 text-white"
      aria-busy="true"
    >
      <div role="status" className="flex flex-col items-center gap-4">
        <div
          aria-hidden="true"
          className="h-10 w-10 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin"
        />
        <p className="text-sm text-slate-300">{label}</p>
      </div>
    </main>
  );
}
