"use client";

import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import {
  chartInnerSize,
  formatAxisNumber,
  formatAxisPercent,
  linearScale,
  niceAxisMax,
} from "@/lib/charts/geometry";
import { cn } from "@/lib/utils";

export type ChartSeriesPoint = {
  label: string;
  value: number;
  /** Tooltip secundário */
  hint?: string;
  /** Cor da barra (barras); padrão = accent do gráfico */
  tone?: "emerald" | "primary" | "sky" | "rose";
};

type ProfessionalChartProps = {
  data: ChartSeriesPoint[];
  height?: number;
  locale: string;
  ariaLabel: string;
  valueMode?: "number" | "percent";
  formatValue?: (value: number) => string;
  accent?: "emerald" | "primary" | "sky" | "rose";
  emptyLabel?: string;
};

const ACCENTS = {
  emerald: {
    stroke: "var(--market-up)",
    fillTop: "color-mix(in oklch, var(--market-up) 42%, transparent)",
    fillBottom: "color-mix(in oklch, var(--market-up) 2%, transparent)",
    dot: "var(--market-up)",
  },
  primary: {
    stroke: "var(--primary)",
    fillTop: "color-mix(in oklch, var(--primary) 38%, transparent)",
    fillBottom: "color-mix(in oklch, var(--primary) 2%, transparent)",
    dot: "var(--primary)",
  },
  sky: {
    stroke: "var(--cognitive)",
    fillTop: "color-mix(in oklch, var(--cognitive) 35%, transparent)",
    fillBottom: "color-mix(in oklch, var(--cognitive) 2%, transparent)",
    dot: "var(--cognitive)",
  },
  rose: {
    stroke: "var(--market-down)",
    fillTop: "color-mix(in oklch, var(--market-down) 38%, transparent)",
    fillBottom: "color-mix(in oklch, var(--market-down) 2%, transparent)",
    dot: "var(--market-down)",
  },
} as const;

function useChartLayout(data: ChartSeriesPoint[], height: number, valueMode: "number" | "percent") {
  return useMemo(() => {
    const width = 720;
    const { width: innerW, height: innerH, pad } = chartInnerSize(width, height);
    const values = data.map((d) => d.value);
    const min = valueMode === "percent" ? 0 : Math.min(0, ...values);
    const max = niceAxisMax(Math.max(...values, 0.001));
    const points = data.map((d, i) => {
      const x = pad.left + (i / Math.max(data.length - 1, 1)) * innerW;
      const y = pad.top + innerH - linearScale(d.value, min, max, innerH);
      return { ...d, x, y };
    });
    const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => pad.top + innerH - t * innerH);
    return { width, height, pad, innerW, innerH, min, max, points, gridY };
  }, [data, height, valueMode]);
}

function ChartFrame({
  children,
  layout,
  locale,
  valueMode,
  ariaLabel,
  accentStroke = "var(--primary)",
}: {
  children: ReactNode;
  layout: ReturnType<typeof useChartLayout>;
  locale: string;
  valueMode: "number" | "percent";
  ariaLabel: string;
  accentStroke?: string;
}) {
  const gridId = useId().replace(/:/g, "");
  const glowId = useId().replace(/:/g, "");
  const { width, height, pad, max, gridY, innerW } = layout;
  const formatY = (v: number) =>
    valueMode === "percent" ? formatAxisPercent(v, locale) : formatAxisNumber(v, locale);

  const vLines = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => pad.left + t * innerW,
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full select-none drop-shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <pattern id={`${gridId}-mesh`} width="24" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M 24 0 L 0 0 0 24"
            fill="none"
            stroke="oklch(1 0 0 / 0.03)"
            strokeWidth="0.5"
          />
        </pattern>
        <linearGradient id={`${gridId}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.12 0.02 265 / 0.95)" />
          <stop offset="50%" stopColor="oklch(0.08 0.015 265 / 0.88)" />
          <stop offset="100%" stopColor="oklch(0.06 0.01 265 / 0.92)" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id={`${gridId}-spot`} cx="72%" cy="18%" r="55%">
          <stop offset="0%" stopColor={accentStroke} stopOpacity="0.12" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={0} y={0} width={width} height={height} rx={16} fill={`url(#${gridId}-bg)`} />
      <rect x={0} y={0} width={width} height={height} rx={16} fill={`url(#${gridId}-mesh)`} />
      <rect x={0} y={0} width={width} height={height} rx={16} fill={`url(#${gridId}-spot)`} />
      <rect
        x={pad.left}
        y={pad.top}
        width={innerW}
        height={layout.innerH}
        rx={8}
        fill="oklch(0 0 0 / 0.18)"
        stroke="oklch(1 0 0 / 0.05)"
        strokeWidth={1}
      />
      {vLines.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={x}
          x2={x}
          y1={pad.top}
          y2={pad.top + layout.innerH}
          stroke="oklch(1 0 0 / 0.03)"
          strokeDasharray="2 8"
        />
      ))}
      {gridY.map((y, i) => (
        <g key={i}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y}
            y2={y}
            stroke="oklch(1 0 0 / 0.07)"
            strokeDasharray="4 6"
          />
          <text
            x={pad.left - 8}
            y={y + 4}
            textAnchor="end"
            className="fill-muted-foreground text-[10px] tabular-nums"
          >
            {formatY(max * (1 - i / 4))}
          </text>
        </g>
      ))}
      <g filter={`url(#${glowId})`}>{children}</g>
    </svg>
  );
}

function ChartTooltip({
  point,
  formatValue,
  className,
}: {
  point: { x: number; y: number; label: string; value: number; hint?: string };
  formatValue: (v: number) => string;
  className?: string;
}) {
  return (
    <g className={className}>
      <line
        x1={point.x}
        x2={point.x}
        y1={28}
        y2={point.y}
        stroke="oklch(1 0 0 / 0.15)"
        strokeDasharray="3 4"
      />
      <circle cx={point.x} cy={point.y} r={5} fill="oklch(0.14 0.02 265)" stroke={ACCENTS.emerald.dot} strokeWidth={2} />
      <foreignObject x={Math.min(point.x - 72, 520)} y={8} width={144} height={56}>
        <div className="rounded-lg border border-white/15 bg-black/85 px-2.5 py-1.5 text-[11px] shadow-lg backdrop-blur-sm">
          <p className="font-mono text-muted-foreground">{point.label}</p>
          <p className="font-semibold text-foreground">{formatValue(point.value)}</p>
          {point.hint ? <p className="text-muted-foreground">{point.hint}</p> : null}
        </div>
      </foreignObject>
    </g>
  );
}

export function ProfessionalAreaChart({
  data,
  height = 260,
  locale,
  ariaLabel,
  valueMode = "number",
  formatValue,
  accent = "primary",
  emptyLabel = "—",
}: ProfessionalChartProps) {
  const gradientId = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const layout = useChartLayout(data, height, valueMode);
  const colors = ACCENTS[accent];
  const fmt =
    formatValue ??
    ((v: number) =>
      valueMode === "percent" ? formatAxisPercent(v, locale) : formatAxisNumber(v, locale));

  if (data.length < 2) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const { points, pad, innerH, max } = layout;
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M ${pad.left} ${pad.top + innerH} L ${points.map((p) => `${p.x} ${p.y}`).join(" L ")} L ${points.at(-1)!.x} ${pad.top + innerH} Z`;
  const active = hover != null ? points[hover] : null;

  const volumeBars = points.map((p, i) => {
    const prev = points[i - 1]?.value ?? p.value;
    const vol = Math.abs(p.value - prev) / Math.max(max, 0.001);
    const barH = vol * innerH * 0.22;
    return { x: p.x, h: barH };
  });

  return (
    <div className="relative">
      <ChartFrame
        layout={layout}
        locale={locale}
        valueMode={valueMode}
        ariaLabel={ariaLabel}
        accentStroke={colors.stroke}
      >
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.fillTop} />
            <stop offset="55%" stopColor={colors.fillTop} stopOpacity="0.35" />
            <stop offset="100%" stopColor={colors.fillBottom} />
          </linearGradient>
          <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.55" />
            <stop offset="50%" stopColor={colors.stroke} />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity="0.75" />
          </linearGradient>
        </defs>
        {volumeBars.map((b, i) => (
          <rect
            key={`vol-${i}`}
            x={b.x - 3}
            y={pad.top + innerH - b.h}
            width={6}
            height={b.h}
            rx={2}
            fill={colors.stroke}
            opacity={0.12}
          />
        ))}
        <path d={area} fill={`url(#${gradientId}-area)`} />
        <polyline
          points={line}
          fill="none"
          stroke={`url(#${gradientId}-line)`}
          strokeWidth={2.75}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <rect
            key={p.label}
            x={p.x - layout.innerW / data.length / 2}
            y={pad.top}
            width={layout.innerW / data.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {active ? <ChartTooltip point={active} formatValue={fmt} /> : null}
        {points.map((p, i) =>
          p.label ? (
            <text
              key={`lbl-${p.label}-${i}`}
              x={p.x}
              y={layout.height - 10}
              textAnchor="middle"
              className={cn(
                "fill-muted-foreground text-[9px] font-mono",
                hover === i && "fill-foreground",
              )}
            >
              {p.label}
            </text>
          ) : null,
        )}
      </ChartFrame>
    </div>
  );
}

export function ProfessionalBarChart({
  data,
  height = 240,
  locale,
  ariaLabel,
  valueMode = "number",
  formatValue,
  accent = "emerald",
  emptyLabel = "—",
}: ProfessionalChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const layout = useChartLayout(data, height, valueMode);
  const fmt =
    formatValue ??
    ((v: number) =>
      valueMode === "percent" ? formatAxisPercent(v, locale) : formatAxisNumber(v, locale));

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const { points, pad, innerW, innerH, min, max } = layout;
  const barW = Math.min(48, (innerW / data.length) * 0.62);
  const active = hover != null ? points[hover] : null;
  const baselineY = pad.top + innerH - linearScale(0, min, max, innerH);
  const signed = min < 0;

  return (
    <div className="relative">
      <ChartFrame layout={layout} locale={locale} valueMode={valueMode} ariaLabel={ariaLabel}>
        {signed ? (
          <line
            x1={pad.left}
            x2={layout.width - pad.right}
            y1={baselineY}
            y2={baselineY}
            stroke="oklch(1 0 0 / 0.12)"
          />
        ) : null}
        {points.map((p, i) => {
          const barColors = ACCENTS[p.tone ?? accent];
          const positive = p.value >= 0;
          const y = signed ? (positive ? p.y : baselineY) : p.y;
          const barH = signed
            ? positive
              ? baselineY - p.y
              : p.y - baselineY
            : pad.top + innerH - p.y;
          const x = p.x - barW / 2;
          return (
            <g
              key={`${p.label}-${i}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={Math.max(barH, 1)}
                rx={6}
                fill={hover === i ? barColors.stroke : barColors.fillTop}
                opacity={hover === i ? 1 : 0.88}
              />
            </g>
          );
        })}
        {active ? <ChartTooltip point={active} formatValue={fmt} /> : null}
        {points.map((p, i) =>
          p.label ? (
            <text
              key={`lbl-bar-${p.label}-${i}`}
              x={p.x}
              y={layout.height - 10}
              textAnchor="middle"
              className={cn(
                "fill-muted-foreground text-[9px] font-mono",
                hover === i && "fill-foreground",
              )}
            >
              {p.label}
            </text>
          ) : null,
        )}
      </ChartFrame>
    </div>
  );
}

export function ProfessionalLineChart(props: ProfessionalChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const layout = useChartLayout(props.data, props.height ?? 240, props.valueMode ?? "percent");
  const colors = ACCENTS[props.accent ?? "sky"];
  const valueMode = props.valueMode ?? "percent";
  const fmt =
    props.formatValue ??
    ((v: number) =>
      valueMode === "percent" ? formatAxisPercent(v, props.locale) : formatAxisNumber(v, props.locale));

  if (props.data.length < 2) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">{props.emptyLabel ?? "—"}</p>
    );
  }

  const { points } = layout;
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const active = hover != null ? points[hover] : null;

  return (
    <div className="relative">
      <ChartFrame
        layout={layout}
        locale={props.locale}
        valueMode={valueMode}
        ariaLabel={props.ariaLabel}
      >
        <polyline
          points={line}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((p, i) => (
          <circle
            key={p.label}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3.5}
            fill={colors.dot}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {active ? <ChartTooltip point={active} formatValue={fmt} /> : null}
        {points.map((p, i) =>
          p.label ? (
            <text
              key={`lbl-line-${p.label}-${i}`}
              x={p.x}
              y={layout.height - 10}
              textAnchor="middle"
              className={cn(
                "fill-muted-foreground text-[9px] font-mono",
                hover === i && "fill-foreground",
              )}
            >
              {p.label}
            </text>
          ) : null,
        )}
      </ChartFrame>
    </div>
  );
}
