import { cn } from "@/lib/utils";

export function QuotePriceSkeleton({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block h-4 animate-pulse rounded bg-white/10", className)}
      aria-hidden
    />
  );
}
