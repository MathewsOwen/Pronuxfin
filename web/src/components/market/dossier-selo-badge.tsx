import { Award, ShieldCheck } from "lucide-react";
import type { SeloGrade } from "@/lib/analytica/selo-types";
import { cn } from "@/lib/utils";

const GRADE_STYLES: Record<SeloGrade, string> = {
  0: "border-market-down/50 bg-market-down/15 text-market-down shadow-[0_0_24px_oklch(0.62_0.22_25/0.15)]",
  1: "border-market-down/35 bg-market-down/10 text-market-down",
  2: "border-status-warning/40 bg-status-warning/10 text-status-warning",
  3: "border-white/25 bg-white/[0.06] text-foreground",
  4: "border-primary/35 bg-primary/10 text-primary",
  5: "border-market-up/45 bg-market-up/12 text-market-up shadow-[0_0_28px_oklch(0.72_0.18_145/0.18)]",
};

const STAR_FILL: Record<SeloGrade, string> = {
  0: "text-market-down/40",
  1: "text-market-down/55",
  2: "text-status-warning/70",
  3: "text-muted-foreground",
  4: "text-primary",
  5: "text-market-up",
};

type Props = {
  grade: SeloGrade;
  label: string;
  size?: "sm" | "lg";
  className?: string;
};

export function DossierSeloStars({
  grade,
  className,
}: {
  grade: SeloGrade;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-hidden>
      {([0, 1, 2, 3, 4] as const).map((i) => (
        <span
          key={i}
          className={cn(
            "text-sm leading-none",
            i < grade ? STAR_FILL[grade] : "text-white/15",
          )}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function DossierSeloBadge({ grade, label, size = "sm", className }: Props) {
  const large = size === "lg";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",
        GRADE_STYLES[grade],
        large ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
        className,
      )}
    >
      <Award className={cn(large ? "size-4" : "size-3.5")} />
      <span className="font-mono tabular-nums">{grade}/5</span>
      <span className="hidden sm:inline">·</span>
      <span className={cn("font-medium", large ? "text-sm" : "text-xs")}>{label}</span>
      <DossierSeloStars grade={grade} />
    </div>
  );
}

export function DossierDataConfidenceBadge({
  score,
  label,
  className,
}: {
  tier: string;
  score: number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <ShieldCheck className="size-3.5 text-status-live" />
      <span>{label}</span>
      <span className="font-mono tabular-nums text-foreground">{score}%</span>
    </div>
  );
}
