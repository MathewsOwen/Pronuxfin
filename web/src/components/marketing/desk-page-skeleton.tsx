export function DeskPageSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 sm:py-14"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-9 w-72 max-w-full animate-pulse rounded-lg bg-white/10" />
      <div className="h-4 w-full max-w-lg animate-pulse rounded bg-white/[0.06]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
