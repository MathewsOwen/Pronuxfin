"use client";

import { ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQuotesStream } from "@/components/market/quotes-stream-provider";
import { CountryFlag } from "@/components/market/country-flag";
import { sortQuotesForDesk } from "@/lib/market/indices";
import { deskMarketMetaForSymbol } from "@/lib/market/desk-market-display";
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
    <div className="relative z-40 border-b border-primary/20 bg-zinc-950/92 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 opacity-[0.055] terminal-grid-bg" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-zinc-950 to-transparent" />
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2 sm:px-6">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-muted-foreground">
            {t("stripEyebrow")}
          </span>
          <span className="hidden h-3 w-px bg-border sm:block" aria-hidden />
          <span
            className={cn(
              "flex items-center gap-2 rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider",
              mode === "live" &&
                "border-status-live/35 bg-status-live/10 text-status-live",
              mode === "partial" &&
                "border-status-warning/35 bg-status-warning/10 text-status-warning",
              mode === "degraded" &&
                "border-status-degraded/35 bg-status-degraded/10 text-status-degraded",
            )}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                mode === "live" && "bg-status-live shadow-[0_0_8px_var(--status-live-glow)]",
                mode === "partial" && "bg-status-warning",
                mode === "degraded" && "bg-status-degraded",
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
              <span className="text-market-down/95">{t("stripDegraded")}</span>
            ) : payload.equitiesPartial || payload.results.length === 0 ? (
              <span className="text-status-warning/90">{t("stripPartialEquities")}</span>
            ) : (
              <span className="text-market-up/90">{t("stripLiveEquities")}</span>
            )}
            {" · "}
            {payload.cryptoSimulated || (payload.crypto?.length ?? 0) === 0 ? (
              <span className="text-status-warning/90">{t("stripPartialCrypto")}</span>
            ) : payload.cryptoPartial ? (
              <span className="text-status-warning/90">{t("cryptoBadgePartial")}</span>
            ) : (
              <span className="text-status-live/90">{t("stripLiveCrypto")}</span>
            )}
            <span className="text-foreground/70"> · </span>
            {payload.fetchedAt > 0 ? (
              <span className="font-medium text-status-live/90">
                {t("stripLastFetch", { time: formatBrtTime(payload.fetchedAt, uiLocale) })}
              </span>
            ) : (
              <span className="font-medium text-status-warning/90">{t("stripAwaitingLive")}</span>
            )}
          </p>
          <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] tabular-nums text-muted-foreground lg:hidden">
            {payload.fetchedAt > 0 ? formatBrtTime(payload.fetchedAt, uiLocale) : "…"}
          </span>
        </div>
        <Link
          href="/bolsa"
          className="ml-auto inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-medium text-primary hover:text-primary/80 hover:underline"
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

  const isEquity = quote.segment !== "crypto";
  const marketMeta = isEquity ? deskMarketMetaForSymbol(quote.symbol) : null;
  const inner = (
    <>
      {marketMeta ? (
        <CountryFlag
          countryCode={marketMeta.countryCode}
          emojiFallback={marketMeta.flag}
          size={12}
          className="self-center"
        />
      ) : null}
      <span className="font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
        {quote.symbol}
      </span>
      <span className="text-muted-foreground">{price}</span>
      <span
        className={cn(
          "text-[11px] font-semibold",
          pct == null ? "text-muted-foreground" : up ? "text-market-up" : "text-market-down",
        )}
      >
        {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
      </span>
    </>
  );

  return (
    <div className="flex shrink-0 items-center gap-2 border-r border-white/[0.06] pr-12 font-mono text-[13px] tabular-nums last:border-0 last:pr-0">
      {isEquity ? (
        <Link
          href={`/ativo/${quote.symbol}`}
          className="group flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          {inner}
        </Link>
      ) : (
        inner
      )}
    </div>
  );
}
