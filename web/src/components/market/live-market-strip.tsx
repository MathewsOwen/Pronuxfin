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
  const duplex = [...rows, ...rows];

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
          <span className="flex items-center gap-2 rounded border border-emerald-500/35 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <span
              className="size-1.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.72_0.17_155)]"
              aria-hidden
            />
            {t("stripLive")}
          </span>
          <p className="hidden max-w-xl text-[11px] leading-snug text-muted-foreground lg:block">
            {t("stripHint")}{" "}
            {payload.simulated ? (
              <span className="text-amber-400/95">{t("stripDemoEquities")}</span>
            ) : (
              <span className="text-amber-200/80">{t("stripLiveEquities")}</span>
            )}
            {" · "}
            {payload.cryptoSimulated ? (
              <span className="text-amber-400/95">{t("stripDemoCrypto")}</span>
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
        <div className="flex w-max gap-12 px-8 animate-marquee-fin motion-reduce:w-full motion-reduce:max-w-6xl motion-reduce:flex-wrap motion-reduce:justify-center">
          {duplex.map((q, idx) => (
            <TickerItem key={`${q.symbol}-${idx}`} quote={q} uiLocale={uiLocale} />
          ))}
        </div>
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
