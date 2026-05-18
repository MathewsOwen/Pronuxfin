"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQuotesStream } from "@/components/market/quotes-stream-provider";
import { sortQuotesForDesk } from "@/lib/market/indices";
import type { QuoteSnapshot } from "@/lib/market/types";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function formatBrtTime(ts: number, uiLocale: string) {
  if (ts <= 0) return "—";
  return new Intl.DateTimeFormat(uiLocale, {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ts));
}

export function LiveMarketStrip() {
  const t = useTranslations("MarketDesk");
  const uiLocale = useLocale();
  const payload = useQuotesStream();

  const rows = [
    ...sortQuotesForDesk(payload.results ?? []),
    ...(payload.crypto ?? []),
  ];
  const duplex = rows.length > 0 ? [...rows, ...rows] : [];
  const mode =
    payload.dataMode ??
    (rows.length === 0
      ? "degraded"
      : payload.simulated || payload.cryptoSimulated
        ? "partial"
        : "live");

  return (
    <div className="relative z-40 border-b border-amber-500/25 bg-zinc-950/92 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] terminal-grid-bg" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-500/15 px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-amber-400/95">
            {t("stripEyebrow")}
          </span>
          <span className="hidden h-3 w-px bg-amber-500/30 sm:block" aria-hidden />
          <span
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
              mode === "live" &&
                "border-emerald-500/35 bg-emerald-950/40 text-emerald-400",
              mode === "partial" &&
                "border-amber-500/35 bg-amber-950/40 text-amber-200",
              mode === "degraded" &&
                "border-rose-500/35 bg-rose-950/40 text-rose-300",
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                mode === "live" && "bg-emerald-400 shadow-[0_0_8px_oklch(0.72_0.17_155)]",
                mode === "partial" && "bg-amber-400",
                mode === "degraded" && "bg-rose-400",
              )}
              aria-hidden
            />
            {mode === "live"
              ? t("stripLive")
              : mode === "partial"
                ? t("stripBadgePartial")
                : t("stripBadgeDegraded")}
          </span>
          <p className="hidden max-w-xl text-[11px] leading-snug text-muted-foreground lg:block">
            {t("stripHint")}{" "}
            {mode === "degraded" ? (
              <span className="text-rose-300/95">{t("stripDegraded")}</span>
            ) : payload.equitiesPartial || payload.results.length === 0 ? (
              <span className="text-amber-200/90">{t("stripPartialEquities")}</span>
            ) : (
              <span className="text-emerald-300/90">{t("stripLiveEquities")}</span>
            )}
            {" · "}
            {payload.cryptoSimulated || (payload.crypto?.length ?? 0) === 0 ? (
              <span className="text-amber-200/90">{t("stripPartialCrypto")}</span>
            ) : payload.cryptoPartial ? (
              <span className="text-amber-200/90">{t("cryptoBadgePartial")}</span>
            ) : (
              <span className="text-sky-300/90">{t("stripLiveCrypto")}</span>
            )}
            <span className="text-foreground/70"> · </span>
            {payload.fetchedAt > 0 ? (
              <span className="font-medium text-sky-300/90">
                {t("stripLastFetch", { time: formatBrtTime(payload.fetchedAt, uiLocale) })}
              </span>
            ) : (
              <span className="font-medium text-amber-200/90">{t("stripAwaitingLive")}</span>
            )}
          </p>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] tabular-nums text-muted-foreground lg:hidden">
            {payload.fetchedAt > 0 ? formatBrtTime(payload.fetchedAt, uiLocale) : "…"}
          </span>
        </div>
        <Link
          href="/bolsa"
          className="ml-auto inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-medium text-amber-300/95 hover:text-amber-200 hover:underline"
        >
          {t("stripCta")}
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
      <div className="ticker-hover-pause relative overflow-hidden py-2">
        {duplex.length > 0 ? (
          <div className="flex w-max gap-12 px-8 animate-marquee-fin motion-reduce:w-full motion-reduce:max-w-6xl motion-reduce:flex-wrap motion-reduce:justify-center">
            {duplex.map((q, idx) => (
              <TickerItem key={`${q.symbol}-${idx}`} quote={q} uiLocale={uiLocale} />
            ))}
          </div>
        ) : (
          <p className="px-6 py-1 text-center font-mono text-[11px] text-muted-foreground">
            {t("stripTickerEmpty")}
          </p>
        )}
      </div>
    </div>
  );
}

function TickerItem({ quote, uiLocale }: { quote: QuoteSnapshot; uiLocale: string }) {
  const pct = quote.regularMarketChangePercent;
  const up = pct != null && pct >= 0;
  const rawCur = quote.currency?.trim();
  const code =
    rawCur && /^[A-Z]{3}$/i.test(rawCur) ? rawCur.toUpperCase() : "BRL";
  const price =
    quote.regularMarketPrice != null
      ? (() => {
          try {
            return new Intl.NumberFormat(uiLocale, {
              style: "currency",
              currency: code,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(quote.regularMarketPrice);
          } catch {
            return `${code} ${quote.regularMarketPrice.toFixed(2)}`;
          }
        })()
      : "—";

  return (
    <div className="flex shrink-0 items-baseline gap-3 border-r border-white/[0.06] pr-12 font-mono text-[13px] tabular-nums last:border-0 last:pr-0">
      <span className="font-semibold tracking-tight text-foreground">{quote.symbol}</span>
      <span className="text-muted-foreground">{price}</span>
      <span
        className={cn(
          "text-[11px] font-semibold",
          pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-rose-400",
        )}
      >
        {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
      </span>
    </div>
  );
}
