"use client";

import { Loader2, Radio, RefreshCw, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuotesStream } from "@/components/market/quotes-stream-provider";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Link } from "@/i18n/navigation";
import {
  collectDeskQuotes,
  filterDeskQuotesForSearch,
  findDeskQuote,
} from "@/lib/market/portfolio-live-search";
import type { MarketDataMode, QuoteSnapshot } from "@/lib/market/types";
import { isValidWatchlistSymbol, normalizeWatchlistSymbol } from "@/lib/user-watchlist/load";
import { cn } from "@/lib/utils";

type LookupResponse = {
  ok: boolean;
  quote?: QuoteSnapshot;
  simulated?: boolean;
  dataMode?: MarketDataMode;
  message?: string;
};

function PortfolioLiveMarketPanelInner({
  symbol,
  onSelectSymbol,
  onUseLivePrice,
}: {
  symbol: string;
  onSelectSymbol: (quote: QuoteSnapshot) => void;
  onUseLivePrice: (price: number, quote: QuoteSnapshot) => void;
}) {
  const t = useTranslations("Portfolio");
  const locale = useLocale();
  const deskPayload = useQuotesStream();
  const deskQuotes = useMemo(() => collectDeskQuotes(deskPayload), [deskPayload]);
  const deskQuotesRef = useRef(deskQuotes);
  deskQuotesRef.current = deskQuotes;

  const [search, setSearch] = useState(symbol);
  const debouncedSearch = useDebouncedValue(search, 220);
  const [lookupQuote, setLookupQuote] = useState<QuoteSnapshot | null>(null);
  const [lookupMode, setLookupMode] = useState<MarketDataMode | null>(null);
  const [lookupSimulated, setLookupSimulated] = useState(false);
  const [pending, setPending] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);

  const suggestions = useMemo(() => {
    if (debouncedSearch.trim().length < 2) return [];
    return filterDeskQuotesForSearch(deskQuotes, debouncedSearch, 8);
  }, [deskQuotes, debouncedSearch]);

  const activeQuote = useMemo(() => {
    const clean = normalizeWatchlistSymbol(symbol);
    if (!clean) return null;
    return findDeskQuote(deskQuotes, clean) ?? lookupQuote;
  }, [deskQuotes, lookupQuote, symbol]);

  const activeMode: MarketDataMode | null =
    lookupMode ?? (activeQuote ? (deskPayload.dataMode ?? "live") : null);

  const applyDeskQuote = useCallback((quote: QuoteSnapshot) => {
    setLookupQuote(quote);
    setLookupMode(deskPayload.dataMode ?? "live");
    setLookupSimulated(Boolean(deskPayload.simulated));
    setLookupError(null);
  }, [deskPayload.dataMode, deskPayload.simulated]);

  const fetchLookup = useCallback(
    async (symbolInput: string, forceApi = false) => {
      const clean = normalizeWatchlistSymbol(symbolInput);
      if (!clean || !isValidWatchlistSymbol(clean)) {
        setLookupQuote(null);
        setLookupError(t("liveInvalidSymbol"));
        return;
      }

      const fromDesk = findDeskQuote(deskQuotesRef.current, clean);
      if (!forceApi && fromDesk?.regularMarketPrice != null) {
        applyDeskQuote(fromDesk);
        return;
      }

      lookupAbortRef.current?.abort();
      const controller = new AbortController();
      lookupAbortRef.current = controller;

      setPending(true);
      setLookupError(null);
      try {
        const res = await fetch(`/api/quotes/lookup?symbol=${encodeURIComponent(clean)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = (await res.json().catch(() => ({}))) as LookupResponse;
        if (controller.signal.aborted) return;
        if (!res.ok || !data.ok || !data.quote) {
          setLookupQuote(null);
          setLookupError(data.message ?? t("liveQuoteUnavailable"));
          return;
        }
        setLookupQuote(data.quote);
        setLookupMode(data.dataMode ?? "live");
        setLookupSimulated(Boolean(data.simulated));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setLookupQuote(null);
        setLookupError(t("liveQuoteUnavailable"));
      } finally {
        if (!controller.signal.aborted) setPending(false);
      }
    },
    [applyDeskQuote, t],
  );

  useEffect(() => {
    setSearch(symbol);
  }, [symbol]);

  useEffect(() => {
    const clean = normalizeWatchlistSymbol(symbol);
    if (!clean) {
      setLookupQuote(null);
      setLookupError(null);
      return;
    }
    const fromDesk = findDeskQuote(deskQuotesRef.current, clean);
    if (fromDesk?.regularMarketPrice != null) {
      applyDeskQuote(fromDesk);
      return;
    }
    void fetchLookup(clean, true);
    return () => lookupAbortRef.current?.abort();
  }, [symbol, fetchLookup, applyDeskQuote]);

  useEffect(() => {
    const clean = normalizeWatchlistSymbol(symbol);
    if (!clean) return;
    const fromDesk = findDeskQuote(deskQuotes, clean);
    if (fromDesk?.regularMarketPrice != null) applyDeskQuote(fromDesk);
  }, [deskQuotes, symbol, applyDeskQuote]);

  function selectQuote(quote: QuoteSnapshot) {
    onSelectSymbol(quote);
    setSearch(quote.symbol);
    applyDeskQuote(quote);
    if (quote.regularMarketPrice != null && Number.isFinite(quote.regularMarketPrice)) {
      onUseLivePrice(quote.regularMarketPrice, quote);
    }
  }

  const money = (value: number | null | undefined, currency?: string) => {
    if (value == null || !Number.isFinite(value)) return "—";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency ?? "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return String(value);
    }
  };

  const pct = (value: number | null | undefined) => {
    if (value == null || !Number.isFinite(value)) return "—";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  return (
    <section
      className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4 md:p-5"
      aria-labelledby="portfolio-live-market-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary/90">
            {t("liveEyebrow")}
          </p>
          <h3 id="portfolio-live-market-title" className="font-heading mt-1 text-base font-semibold">
            {t("liveTitle")}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("liveLead")}</p>
        </div>
        {activeQuote ? (
          <Badge
            className={cn(
              "gap-1 border",
              activeMode === "live" && !lookupSimulated
                ? "border-status-live/30 bg-status-live/10 text-status-live"
                : "border-border bg-primary/10 text-status-warning",
            )}
          >
            <Radio className="size-3" aria-hidden />
            {activeMode === "live" && !lookupSimulated ? t("liveBadge") : t("liveBadgeUnavailable")}
          </Badge>
        ) : null}
      </div>

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const clean = normalizeWatchlistSymbol(search);
              if (isValidWatchlistSymbol(clean)) void fetchLookup(clean, true);
            }
          }}
          placeholder={t("liveSearchPlaceholder")}
          className="border-white/15 bg-black/25 pl-10 font-mono"
          aria-label={t("liveSearchPlaceholder")}
          autoComplete="off"
        />
      </div>

      {suggestions.length > 0 ? (
        <ul className="mt-3 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-1">
          {suggestions.map((quote) => (
            <li key={quote.symbol}>
              <button
                type="button"
                onClick={() => selectQuote(quote)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.06]"
              >
                <span>
                  <span className="font-mono font-medium text-foreground">{quote.symbol}</span>
                  {quote.shortName ? (
                    <span className="mt-0.5 block text-xs text-muted-foreground">{quote.shortName}</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-right tabular-nums">
                  <span className="block text-foreground">
                    {money(quote.regularMarketPrice, quote.currency)}
                  </span>
                  <span
                    className={cn(
                      "text-xs",
                      (quote.regularMarketChangePercent ?? 0) >= 0
                        ? "text-market-up"
                        : "text-market-down",
                    )}
                  >
                    {pct(quote.regularMarketChangePercent)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {activeQuote ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-sm font-semibold">{activeQuote.symbol}</p>
            <p className="text-xs text-muted-foreground">{activeQuote.shortName ?? "—"}</p>
            <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">
              {money(activeQuote.regularMarketPrice, activeQuote.currency)}
            </p>
            <p
              className={cn(
                "text-sm tabular-nums",
                (activeQuote.regularMarketChangePercent ?? 0) >= 0
                  ? "text-market-up"
                  : "text-market-down",
              )}
            >
              {pct(activeQuote.regularMarketChangePercent)} {t("liveDayMove")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending || activeQuote.regularMarketPrice == null}
              className={cn(buttonVariants({ size: "sm" }), "glow-ring")}
              onClick={() => {
                if (activeQuote.regularMarketPrice != null) {
                  onUseLivePrice(activeQuote.regularMarketPrice, activeQuote);
                }
              }}
            >
              {t("liveUsePrice")}
            </button>
            <button
              type="button"
              disabled={pending}
              aria-label={t("liveRefresh")}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              onClick={() => void fetchLookup(activeQuote.symbol, true)}
            >
              {pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              <span className="hidden sm:inline">{t("liveRefresh")}</span>
            </button>
            <Link
              href={`/ativo/${activeQuote.symbol}`}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("liveOpenAsset")}
            </Link>
          </div>
        </div>
      ) : null}

      {lookupError ? (
        <p className="mt-3 text-xs text-status-warning" role="status">
          {lookupError}
        </p>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">{t("liveFootnote")}</p>
    </section>
  );
}

export const PortfolioLiveMarketPanel = memo(PortfolioLiveMarketPanelInner);
