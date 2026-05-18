"use client";

import { useId, useMemo, useState } from "react";
import {
  chartInnerSize,
  formatAxisNumber,
  linearScale,
  niceAxisMax,
} from "@/lib/charts/geometry";
import type { ScenarioBandSeries } from "@/lib/projecao/scenario-projection";

const BAND_COLORS: Record<ScenarioBandSeries["id"], { stroke: string; dot: string }> = {
  pessimistic: { stroke: "var(--market-down)", dot: "var(--market-down)" },
  base: { stroke: "var(--primary)", dot: "var(--primary)" },
  optimistic: { stroke: "var(--market-up)", dot: "var(--market-up)" },
};

export function ScenarioProjectionChart({
  series,
  locale,
  ariaLabel,
  formatValue,
  emptyLabel,
  legend,
}: {
  series: ScenarioBandSeries[];
  locale: string;
  ariaLabel: string;
  formatValue: (v: number) => string;
  emptyLabel: string;
  legend: Record<ScenarioBandSeries["id"], string>;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [hoverYear, setHoverYear] = useState<number | null>(null);

  const layout = useMemo(() => {
    const height = 280;
    const width = 720;
    const { width: innerW, height: innerH, pad } = chartInnerSize(width, height);
    const allValues = series.flatMap((s) => s.points.map((p) => p.balance));
    const min = 0;
    const max = niceAxisMax(Math.max(...allValues, 1));
    const maxYear = Math.max(...series.flatMap((s) => s.points.map((p) => p.year)), 1);

    const mapped = series.map((s) => ({
      ...s,
      points: s.points.map((p) => {
        const x = pad.left + (p.year / maxYear) * innerW;
        const y = pad.top + innerH - linearScale(p.balance, min, max, innerH);
        return { ...p, x, y };
      }),
    }));

    const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => pad.top + innerH - t * innerH);
    return { width, height, pad, innerW, innerH, max, maxYear, mapped, gridY };
  }, [series]);

  if (series.length === 0 || series.every((s) => s.points.length < 2)) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const activeYear = hoverYear ?? layout.mapped[0]?.points.at(-1)?.year ?? 0;

  return (
    <div className="space-y-3">
      <div className="relative">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-auto w-full select-none"
          role="img"
          aria-label={ariaLabel}
        >
          <rect
            x={0}
            y={0}
            width={layout.width}
            height={layout.height}
            rx={16}
            fill="oklch(0 0 0 / 0.22)"
          />
          {layout.gridY.map((y, i) => (
            <g key={i}>
              <line
                x1={layout.pad.left}
                x2={layout.width - layout.pad.right}
                y1={y}
                y2={y}
                stroke="oklch(1 0 0 / 0.06)"
                strokeDasharray="4 6"
              />
              <text
                x={layout.pad.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px] tabular-nums"
              >
                {formatAxisNumber(layout.max * (1 - i / 4), locale)}
              </text>
            </g>
          ))}

          <defs>
            <linearGradient id={`${gradientId}-base`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {layout.mapped.map((s) => {
            const line = s.points.map((p) => `${p.x},${p.y}`).join(" ");
            const base = s.points[0];
            const area =
              s.id === "base" && base
                ? `M ${layout.pad.left} ${layout.pad.top + layout.innerH} L ${s.points.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${s.points.at(-1)!.x} ${layout.pad.top + layout.innerH} Z`
                : null;
            const colors = BAND_COLORS[s.id];
            return (
              <g key={s.id} opacity={s.id === "base" ? 1 : 0.78}>
                {area ? <path d={area} fill={`url(#${gradientId}-base)`} /> : null}
                <polyline
                  points={line}
                  fill="none"
                  stroke={colors.stroke}
                  strokeWidth={s.id === "base" ? 2.75 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.id === "base" ? undefined : "6 4"}
                />
                {s.points
                  .filter((p) => p.year === activeYear)
                  .map((p) => (
                    <circle
                      key={`${s.id}-${p.year}`}
                      cx={p.x}
                      cy={p.y}
                      r={5}
                      fill={colors.dot}
                    />
                  ))}
              </g>
            );
          })}

          {layout.mapped[0]?.points.map((p) => (
            <rect
              key={`hover-${p.year}`}
              x={p.x - layout.innerW / Math.max(layout.maxYear, 1) / 2}
              y={layout.pad.top}
              width={layout.innerW / Math.max(layout.maxYear, 1)}
              height={layout.innerH}
              fill="transparent"
              onMouseEnter={() => setHoverYear(p.year)}
              onMouseLeave={() => setHoverYear(null)}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute left-4 top-4 rounded-xl border border-white/15 bg-black/80 px-3 py-2 text-[11px] shadow-lg backdrop-blur-sm">
          <p className="font-mono text-muted-foreground">
            {activeYear === 0 ? "T₀" : `Y${activeYear}`}
          </p>
          {layout.mapped.map((s) => {
            const pt = s.points.find((p) => p.year === activeYear);
            if (!pt) return null;
            return (
              <p
                key={s.id}
                className="mt-0.5 font-medium"
                style={{ color: BAND_COLORS[s.id].stroke }}
              >
                {legend[s.id]}: {formatValue(pt.balance)}
              </p>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {layout.mapped.map((s) => (
          <span key={s.id} className="inline-flex items-center gap-2">
            <span
              className="inline-block h-0.5 w-6 rounded-full"
              style={{ background: BAND_COLORS[s.id].stroke }}
            />
            {legend[s.id]} ({s.annualReturnPct.toFixed(1)}% a.a.)
          </span>
        ))}
      </div>
    </div>
  );
}
