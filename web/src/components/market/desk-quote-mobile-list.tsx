"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { QuoteSnapshot } from "@/lib/market/types";
import { cn } from "@/lib/utils";

function quoteCurrency(row: QuoteSnapshot, fallback: string) {
  return row.currency ?? fallback;
}

function formatMoney(
  value: number | null | undefined,
  row: QuoteSnapshot,
  locale: string,
  fallbackCurrency: string,
) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: quoteCurrency(row, fallbackCurrency),
    maximumFractionDigits: row.segment === "crypto" ? 0 : 2,
  }).format(value);
}

function formatPct(pct: number | null | undefined, locale: string) {
  if (pct == null || !Number.isFinite(pct)) return null;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    signDisplay: "exceptZero",
    maximumFractionDigits: 2,
  }).format(pct / 100);
}

export function DeskQuoteMobileList({
  rows,
  locale,
  fallbackCurrency,
  flash,
  caption,
  emptyLabel,
}: {
  rows: QuoteSnapshot[];
  locale: string;
  fallbackCurrency: string;
  flash?: Record<string, "up" | "down">;
  caption: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p
        className="md:hidden rounded-xl border border-border bg-black/20 px-4 py-6 text-center text-sm text-muted-foreground"
        role="status"
      >
        {emptyLabel}
      </p>
    );
  }

  return (
    <ul className="space-y-2 px-4 py-3 md:hidden sm:px-6" aria-label={caption}>
      {rows.map((row) => {
        const pct = row.regularMarketChangePercent;
        const up = pct != null && pct >= 0;
        const flashDir = flash?.[row.symbol];
        const href = row.segment === "crypto" ? null : `/ativo/${row.symbol}`;
        const pctLabel = formatPct(pct, locale);

        const inner = (
          <article
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-3 transition-colors",
              flashDir === "up" && "bg-market-up/10",
              flashDir === "down" && "bg-market-down/10",
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              {row.imageUrl ? (
                <span className="relative inline-flex size-8 shrink-0 overflow-hidden rounded-full border border-white/10">
                  <Image src={row.imageUrl} alt="" fill sizes="32px" className="object-cover" />
                </span>
              ) : (
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[10px] text-muted-foreground">
                  {row.symbol.slice(0, 2)}
                </span>
              )}
              <div className="min-w-0">
                <p className="font-mono text-sm font-semibold text-foreground">{row.symbol}</p>
                <p className="truncate text-xs text-muted-foreground">{row.shortName ?? row.symbol}</p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-heading text-base font-semibold tabular-nums">
                {formatMoney(row.regularMarketPrice, row, locale, fallbackCurrency)}
              </p>
              {pctLabel != null ? (
                <p
                  className={cn(
                    "font-mono text-[11px] font-medium",
                    up ? "text-market-up" : "text-market-down",
                  )}
                >
                  {pctLabel}
                </p>
              ) : null}
            </div>
          </article>
        );

        return (
          <li key={row.symbol}>
            {href ? (
              <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}
