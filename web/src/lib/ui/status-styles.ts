import { cn } from "@/lib/utils";

/** Feed / API connectivity — cyan-teal, not brand primary */
export const statusLiveBadge =
  "border-status-live/35 bg-status-live/10 text-status-live";

export const statusLiveDot =
  "bg-status-live shadow-[0_0_8px_var(--status-live-glow)]";

/** Partial data, curated reference, illustration */
export const statusWarningBadge =
  "border-status-warning/35 bg-status-warning/10 text-status-warning";

export const statusWarningDot = "bg-status-warning";

/** Unavailable / error / degraded */
export const statusDegradedBadge =
  "border-status-degraded/35 bg-status-degraded/10 text-status-degraded";

export const statusDegradedDot = "bg-status-degraded";

/** P&L and price direction — separate from brand green */
export const marketUpText = "text-market-up";
export const marketDownText = "text-market-down";

export function marketDirectionClass(up: boolean | null | undefined) {
  if (up == null) return "text-muted-foreground";
  return up ? marketUpText : marketDownText;
}

/** Marketing eyebrows — calm hierarchy */
export const eyebrowClass =
  "font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground";

export const cognitiveAccent = "text-cognitive";
export const cognitiveBorder = "border-cognitive/25";
export const cognitiveSurface = "border-cognitive/20 bg-cognitive/8";

export function statusModeBadge(mode: "live" | "partial" | "degraded") {
  return cn(
    "flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
    mode === "live" && statusLiveBadge,
    mode === "partial" && statusWarningBadge,
    mode === "degraded" && statusDegradedBadge,
  );
}

export function statusModeDot(mode: "live" | "partial" | "degraded") {
  return cn(
    "size-1.5 shrink-0 rounded-full",
    mode === "live" && statusLiveDot,
    mode === "partial" && statusWarningDot,
    mode === "degraded" && statusDegradedDot,
  );
}
