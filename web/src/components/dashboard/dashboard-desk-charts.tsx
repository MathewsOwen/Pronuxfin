"use client";

import { useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  allocationColors,
  type PortfolioAllocationSlice,
  type PortfolioFlowPoint,
} from "@/lib/user-portfolio/chart-data";

type DashboardDeskChartsProps = {
  locale: string;
  currency: string;
  flowSeries: PortfolioFlowPoint[];
  allocation: PortfolioAllocationSlice[];
};

export function DashboardDeskCharts({
  locale,
  currency,
  flowSeries,
  allocation,
}: DashboardDeskChartsProps) {
  const t = useTranslations("Dashboard");
  const gradientId = useId().replace(/:/g, "");

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }),
    [locale, currency],
  );

  const flowMax = Math.max(...flowSeries.map((p) => p.value), 1);
  const allocTotal = allocation.reduce((s, a) => s + a.value, 0) || 1;
  const colors = allocationColors(allocation.length);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="glass-panel card-shine rounded-3xl border border-white/12 p-6 shadow-none ring-0 lg:col-span-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("flowTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("flowSubtitleLive")}</p>
        {flowSeries.length < 2 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("flowEmpty")}</p>
        ) : (
          <svg
            viewBox="0 0 640 220"
            className="mt-6 h-auto w-full"
            role="img"
            aria-label={t("flowTitle")}
          >
            <defs>
              <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.11 165 / 0.45)" />
                <stop offset="100%" stopColor="oklch(0.72 0.11 165 / 0.02)" />
              </linearGradient>
            </defs>
            {(() => {
              const pad = { l: 8, r: 8, t: 12, b: 28 };
              const w = 640 - pad.l - pad.r;
              const h = 220 - pad.t - pad.b;
              const pts = flowSeries.map((p, i) => {
                const x = pad.l + (i / Math.max(flowSeries.length - 1, 1)) * w;
                const y = pad.t + h - (p.value / flowMax) * h;
                return { x, y, ...p };
              });
              const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
              const area = `${pad.l},${pad.t + h} ${line} ${pad.l + w},${pad.t + h}`;
              return (
                <>
                  <path d={`M ${area} Z`} fill={`url(#${gradientId}-area)`} />
                  <polyline
                    points={line}
                    fill="none"
                    stroke="oklch(0.72 0.11 165)"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {pts.map((p, i) => (
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" fill="oklch(0.72 0.11 165)" />
                      <text
                        x={p.x}
                        y={pad.t + h + 18}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px]"
                      >
                        {p.label}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
          </svg>
        )}
        {flowSeries.length >= 2 ? (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {t("flowLatest")}: {money.format(flowSeries.at(-1)!.value)}
          </p>
        ) : null}
      </div>

      <div className="glass-panel card-shine rounded-3xl border border-white/12 p-6 shadow-none ring-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {t("allocationTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("allocationSubtitleLive")}</p>
        {allocation.length === 0 ? (
          <p className="mt-8 text-sm text-muted-foreground">{t("allocationEmpty")}</p>
        ) : (
          <>
            <svg viewBox="0 0 200 200" className="mx-auto mt-6 h-44 w-44" role="img">
              {(() => {
                let angle = -90;
                return allocation.map((slice, i) => {
                  const pct = slice.value / allocTotal;
                  const sweep = pct * 360;
                  const start = polar(100, 100, 72, angle);
                  const end = polar(100, 100, 72, angle + sweep);
                  const large = sweep > 180 ? 1 : 0;
                  angle += sweep;
                  return (
                    <path
                      key={slice.symbol}
                      d={`M 100 100 L ${start.x} ${start.y} A 72 72 0 ${large} 1 ${end.x} ${end.y} Z`}
                      fill={colors[i]}
                      opacity={0.92}
                    />
                  );
                });
              })()}
              <circle cx="100" cy="100" r="42" fill="oklch(0.12 0.02 265)" />
              <text
                x="100"
                y="96"
                textAnchor="middle"
                className="fill-foreground text-[11px] font-semibold"
              >
                {allocation.length}
              </text>
              <text
                x="100"
                y="112"
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {t("allocationPositions")}
              </text>
            </svg>
            <ul className="mt-4 space-y-2">
              {allocation.map((slice, i) => (
                <li key={slice.symbol} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: colors[i] }}
                    />
                    <span className="truncate font-mono">{slice.symbol}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {((slice.value / allocTotal) * 100).toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
