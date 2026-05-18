"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Activity, RefreshCw } from "lucide-react";
import { INDEX_PROXY_LABELS } from "@/lib/market/indices";
import type { QuoteSnapshot, QuotesPayload } from "@/lib/market/types";
import { cn } from "@/lib/utils";

const PULSE_SYMBOLS = ["BOVA11", "PETR4", "VALE3", "BTC"] as const;

type PulseRow = {
  symbol: string;
  label: string;
  quote: QuoteSnapshot | null;
  simulated: boolean;
};

export function ProjecaoMarketPulse() {
  const t = useTranslations("ProjecaoHub.pulse");
  const locale = useLocale();
  const [payload, setPayload] = useState<QuotesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function load() {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/quotes", { cache: "no-store" });
      if (!res.ok) throw new Error("quotes");
      const json = (await res.json()) as QuotesPayload;
      setPayload(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => clearInterval(id);
  }, []);

  const rows = resolvePulseRows(payload);

  return (
    <section className="surface-rise card-shine rounded-2xl border border-white/10 bg-black/25 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="font-heading text-lg font-semibold tracking-tight">{t("title")}</h2>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/12 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} aria-hidden />
          {t("refresh")}
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-market-down">{t("error")}</p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((item) => (
            <PulseCard key={item.symbol} item={item} locale={locale} noQuoteLabel={t("noQuote")} />
          ))}
        </div>
      )}

      <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {payload?.fetchedAt
          ? t("synced", {
              time: new Intl.DateTimeFormat(locale, { timeStyle: "medium" }).format(
                new Date(payload.fetchedAt),
              ),
            })
          : t("syncPending")}
        {payload?.dataMode === "degraded" ? ` · ${t("unavailable")}` : ""}
      </p>
    </section>
  );
}

function resolvePulseRows(payload: QuotesPayload | null): PulseRow[] {
  const equity = payload?.results ?? [];
  const crypto = payload?.crypto ?? [];
  const simulated = Boolean(payload?.simulated || payload?.cryptoSimulated);

  return PULSE_SYMBOLS.map((symbol) => {
    const quote = equity.find((q) => q.symbol === symbol) ?? crypto.find((q) => q.symbol === symbol);
    return {
      symbol,
      label: INDEX_PROXY_LABELS[symbol] ?? quote?.shortName ?? symbol,
      quote: quote ?? null,
      simulated,
    };
  });
}

function PulseCard({
  item,
  locale,
  noQuoteLabel,
}: {
  item: PulseRow;
  locale: string;
  noQuoteLabel: string;
}) {
  const q = item.quote;
  const pct = q?.regularMarketChangePercent;
  const up = pct != null && pct >= 0;

  const price =
    q?.regularMarketPrice != null
      ? new Intl.NumberFormat(locale, {
          style: "currency",
          currency: q.currency ?? "BRL",
          maximumFractionDigits: item.symbol === "BTC" ? 0 : 2,
        }).format(q.regularMarketPrice)
      : "—";

  const change =
    pct != null
      ? new Intl.NumberFormat(locale, {
          style: "percent",
          signDisplay: "exceptZero",
          maximumFractionDigits: 2,
        }).format(pct / 100)
      : "—";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {item.label}
        </p>
        <span className="font-mono text-[10px] text-muted-foreground">{item.symbol}</span>
      </div>
      <p className="mt-2 font-heading text-xl font-semibold tracking-tight">{price}</p>
      <p
        className={cn(
          "mt-1 font-mono text-sm font-medium",
          up ? "text-market-up" : "text-market-down",
        )}
      >
        {change}
      </p>
      {item.quote == null ? (
        <p className="mt-2 text-[10px] uppercase tracking-wider text-market-down/90">{noQuoteLabel}</p>
      ) : null}
    </div>
  );
}
