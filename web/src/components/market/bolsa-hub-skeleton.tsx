export function BolsaHubSkeleton() {
  return (
    <div
      className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-10 w-64 max-w-full animate-pulse rounded-xl bg-white/10" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
      <span className="sr-only">Loading market desk…</span>
    </div>
  );
}
