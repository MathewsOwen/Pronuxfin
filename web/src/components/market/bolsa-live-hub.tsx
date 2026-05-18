"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { memo, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  BarChart3,
  Globe2,
  Layers,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  INDEX_PROXY_LABELS,
  INDEX_PROXY_TICKERS,
  sortQuotesForDesk,
} from "@/lib/market/indices";
import type { QuoteSnapshot } from "@/lib/market/types";
import { formatRelativeTime } from "@/lib/market/time";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  RevealBlock,
  RevealOnce,
  RevealStaggerList,
} from "@/components/marketing/landing-reveal";
import { useQuotesStream } from "@/components/market/quotes-stream-provider";
import { useCryptoSectorQuotesBook } from "@/hooks/use-crypto-sector-quotes";
import { useSectorQuotesBook } from "@/hooks/use-sector-quotes";
import {
  CRYPTO_SECTOR_ORDER,
  type CryptoSectorId,
} from "@/lib/market/crypto-sector-universe";
import {
  SECTOR_ORDER,
  type MarketRegionId,
  type SectorId,
} from "@/lib/market/sector-universe";

const EMPTY_QUOTE_ROWS: QuoteSnapshot[] = [];

function quoteCurrencyCode(row: QuoteSnapshot, fallback: string) {
  const c = row.currency?.trim()?.toUpperCase();
  return c && /^[A-Z]{3}$/.test(c) ? c : fallback;
}

function formatQuoteMoney(
  value: number | null | undefined,
  row: QuoteSnapshot,
  locale: string,
  fallbackCur: string,
) {
  if (value == null) return "—";
  const code = quoteCurrencyCode(row, fallbackCur);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

function quoteVisualEquals(a: QuoteSnapshot, b: QuoteSnapshot) {
  return (
    a.symbol === b.symbol &&
    (a.shortName ?? "") === (b.shortName ?? "") &&
    (a.currency ?? "") === (b.currency ?? "") &&
    a.regularMarketPrice === b.regularMarketPrice &&
    a.regularMarketChange === b.regularMarketChange &&
    a.regularMarketChangePercent === b.regularMarketChangePercent
  );
}

function normalizeQuoteSearch(value: string) {
  return value.trim().toLowerCase();
}

function filterQuotes(rows: QuoteSnapshot[], query: string) {
  const needle = normalizeQuoteSearch(query);
  if (!needle) return rows;
  return rows.filter((row) => {
    const symbol = row.symbol.toLowerCase();
    const name = row.shortName?.toLowerCase() ?? "";
    return symbol.includes(needle) || name.includes(needle);
  });
}

function quoteBadgeClasses(row: QuoteSnapshot, fallbackCurrency: string) {
  if (row.segment === "crypto") {
    return "border-fuchsia-500/35 bg-fuchsia-950/40 text-fuchsia-100";
  }
  const code = quoteCurrencyCode(row, fallbackCurrency);
  return code === "USD"
    ? "border-teal-500/35 bg-teal-950/35 text-teal-100"
    : "border-amber-500/35 bg-amber-950/40 text-amber-100";
}

function quoteMonogram(row: QuoteSnapshot) {
  const raw = row.symbol.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  return raw.slice(0, Math.min(3, raw.length)) || "Q";
}

const TABLE_PAGE_SIZE = 18;

function formatCompactVolume(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function topByPct(rows: QuoteSnapshot[], direction: "up" | "down", limit: number) {
  return [...rows]
    .filter((row) =>
      row.regularMarketChangePercent != null &&
      (direction === "up"
        ? row.regularMarketChangePercent >= 0
        : row.regularMarketChangePercent < 0),
    )
    .sort((a, b) =>
      direction === "up"
        ? (b.regularMarketChangePercent ?? Number.NEGATIVE_INFINITY) -
          (a.regularMarketChangePercent ?? Number.NEGATIVE_INFINITY)
        : (a.regularMarketChangePercent ?? Number.POSITIVE_INFINITY) -
          (b.regularMarketChangePercent ?? Number.POSITIVE_INFINITY),
    )
    .slice(0, limit);
}

function topByVolume(rows: QuoteSnapshot[], limit: number) {
  return [...rows]
    .filter((row) => row.regularMarketVolume != null)
    .sort(
      (a, b) =>
        (b.regularMarketVolume ?? Number.NEGATIVE_INFINITY) -
        (a.regularMarketVolume ?? Number.NEGATIVE_INFINITY),
    )
    .slice(0, limit);
}

type QuoteSortKey = "symbol" | "name" | "price" | "change" | "pct";
type QuoteSortDirection = "asc" | "desc";
type QuoteSortState = {
  key: QuoteSortKey;
  direction: QuoteSortDirection;
};

function defaultDirectionForSort(key: QuoteSortKey): QuoteSortDirection {
  return key === "symbol" || key === "name" ? "asc" : "desc";
}

function nextSortState(current: QuoteSortState, key: QuoteSortKey): QuoteSortState {
  if (current.key !== key) {
    return { key, direction: defaultDirectionForSort(key) };
  }
  return {
    key,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}

function compareNullableNumbers(a: number | null | undefined, b: number | null | undefined) {
  const left = a ?? Number.NEGATIVE_INFINITY;
  const right = b ?? Number.NEGATIVE_INFINITY;
  return left - right;
}

function sortQuotes(rows: QuoteSnapshot[], state: QuoteSortState) {
  const sorted = [...rows].sort((a, b) => {
    let cmp = 0;
    switch (state.key) {
      case "symbol":
        cmp = a.symbol.localeCompare(b.symbol);
        break;
      case "name":
        cmp = (a.shortName ?? "").localeCompare(b.shortName ?? "");
        break;
      case "price":
        cmp = compareNullableNumbers(a.regularMarketPrice, b.regularMarketPrice);
        break;
      case "change":
        cmp = compareNullableNumbers(a.regularMarketChange, b.regularMarketChange);
        break;
      case "pct":
        cmp = compareNullableNumbers(
          a.regularMarketChangePercent,
          b.regularMarketChangePercent,
        );
        break;
    }
    if (cmp === 0) return a.symbol.localeCompare(b.symbol);
    return state.direction === "asc" ? cmp : -cmp;
  });
  return sorted;
}

function ariaSortValue(state: QuoteSortState, key: QuoteSortKey) {
  if (state.key !== key) return "none";
  return state.direction === "asc" ? "ascending" : "descending";
}

export function BolsaLiveHub() {
  const locale = useLocale();
  const tDesk = useTranslations("MarketDesk");
  const t = useTranslations("BolsaHub");
  const payload = useQuotesStream();
  const [region, setRegion] = useState<MarketRegionId>("br");
  const [sector, setSector] = useState<SectorId>("commodities");
  const [cryptoSector, setCryptoSector] = useState<CryptoSectorId>("layer1");
  const [equitySearch, setEquitySearch] = useState("");
  const [cryptoMajorSearch, setCryptoMajorSearch] = useState("");
  const [cryptoSectorSearch, setCryptoSectorSearch] = useState("");
  const [equityVisibleCount, setEquityVisibleCount] = useState(TABLE_PAGE_SIZE);
  const [cryptoMajorVisibleCount, setCryptoMajorVisibleCount] = useState(TABLE_PAGE_SIZE);
  const [cryptoSectorVisibleCount, setCryptoSectorVisibleCount] = useState(TABLE_PAGE_SIZE);
  const [equitySort, setEquitySort] = useState<QuoteSortState>({
    key: "pct",
    direction: "desc",
  });
  const [cryptoMajorSort, setCryptoMajorSort] = useState<QuoteSortState>({
    key: "pct",
    direction: "desc",
  });
  const [cryptoSectorSort, setCryptoSectorSort] = useState<QuoteSortState>({
    key: "pct",
    direction: "desc",
  });
  const sectorBook = useSectorQuotesBook(region, sector);
  const cryptoSectorBook = useCryptoSectorQuotesBook(cryptoSector);
  const prevPctRef = useRef<Record<string, number>>({});
  const fadeFlashRef = useRef(0);
  const clearFlashRef = useRef(0);
  const [flash, setFlash] = useState<Record<string, "up" | "down">>({});

  const sectorFallBackCur = region === "br" ? "BRL" : "USD";

  function selectRegion(nextRegion: MarketRegionId) {
    setRegion(nextRegion);
    setEquitySearch("");
    setEquityVisibleCount(TABLE_PAGE_SIZE);
  }

  function selectSector(nextSector: SectorId) {
    setSector(nextSector);
    setEquitySearch("");
    setEquityVisibleCount(TABLE_PAGE_SIZE);
  }

  function selectCryptoSector(nextSector: CryptoSectorId) {
    setCryptoSector(nextSector);
    setCryptoSectorSearch("");
    setCryptoSectorVisibleCount(TABLE_PAGE_SIZE);
  }

  function updateEquitySearch(nextSearch: string) {
    setEquitySearch(nextSearch);
    setEquityVisibleCount(TABLE_PAGE_SIZE);
  }

  function updateCryptoMajorSearch(nextSearch: string) {
    setCryptoMajorSearch(nextSearch);
    setCryptoMajorVisibleCount(TABLE_PAGE_SIZE);
  }

  function updateCryptoSectorSearch(nextSearch: string) {
    setCryptoSectorSearch(nextSearch);
    setCryptoSectorVisibleCount(TABLE_PAGE_SIZE);
  }

  function updateEquitySort(nextSort: SetStateAction<QuoteSortState>) {
    setEquitySort(nextSort);
    setEquityVisibleCount(TABLE_PAGE_SIZE);
  }

  function updateCryptoMajorSort(nextSort: SetStateAction<QuoteSortState>) {
    setCryptoMajorSort(nextSort);
    setCryptoMajorVisibleCount(TABLE_PAGE_SIZE);
  }

  function updateCryptoSectorSort(nextSort: SetStateAction<QuoteSortState>) {
    setCryptoSectorSort(nextSort);
    setCryptoSectorVisibleCount(TABLE_PAGE_SIZE);
  }

  useEffect(() => {
    const merged = [
      ...(payload.results ?? []),
      ...(payload.crypto ?? []),
      ...(sectorBook.results ?? []),
      ...(cryptoSectorBook.results ?? []),
    ];
    const highlights: Record<string, "up" | "down"> = {};
    for (const r of merged) {
      const sym = r.symbol;
      const pct = r.regularMarketChangePercent;
      if (!sym || pct == null) continue;
      const prev = prevPctRef.current[sym];
      if (prev !== undefined && prev !== pct) {
        highlights[sym] = pct > prev ? "up" : "down";
      }
      prevPctRef.current[sym] = pct;
    }

    window.clearTimeout(fadeFlashRef.current);
    window.clearTimeout(clearFlashRef.current);

    if (Object.keys(highlights).length === 0) return;

    fadeFlashRef.current = window.setTimeout(() => {
      setFlash(highlights);
      clearFlashRef.current = window.setTimeout(() => setFlash({}), 700);
    }, 0);

    return () => {
      window.clearTimeout(fadeFlashRef.current);
      window.clearTimeout(clearFlashRef.current);
    };
  }, [payload, sectorBook, cryptoSectorBook]);

  const sortedRows = useMemo(
    () => sortQuotesForDesk(payload.results ?? []),
    [payload.results],
  );

  const indexRows = useMemo(() => {
    return INDEX_PROXY_TICKERS.map((sym) =>
      sortedRows.find((r) => r.symbol === sym),
    ).filter((r): r is NonNullable<typeof r> => Boolean(r));
  }, [sortedRows]);

  const cryptoRows = useMemo(() => payload.crypto ?? EMPTY_QUOTE_ROWS, [payload.crypto]);
  const filteredSectorRows = useMemo(
    () => filterQuotes(sectorBook.results ?? EMPTY_QUOTE_ROWS, equitySearch),
    [sectorBook.results, equitySearch],
  );
  const filteredCryptoRows = useMemo(
    () => filterQuotes(cryptoRows, cryptoMajorSearch),
    [cryptoRows, cryptoMajorSearch],
  );
  const filteredCryptoSectorRows = useMemo(
    () => filterQuotes(cryptoSectorBook.results ?? EMPTY_QUOTE_ROWS, cryptoSectorSearch),
    [cryptoSectorBook.results, cryptoSectorSearch],
  );
  const orderedSectorRows = useMemo(
    () => sortQuotes(filteredSectorRows, equitySort),
    [filteredSectorRows, equitySort],
  );
  const orderedCryptoRows = useMemo(
    () => sortQuotes(filteredCryptoRows, cryptoMajorSort),
    [filteredCryptoRows, cryptoMajorSort],
  );
  const orderedCryptoSectorRows = useMemo(
    () => sortQuotes(filteredCryptoSectorRows, cryptoSectorSort),
    [filteredCryptoSectorRows, cryptoSectorSort],
  );
  const visibleSectorRows = useMemo(
    () => orderedSectorRows.slice(0, equityVisibleCount),
    [orderedSectorRows, equityVisibleCount],
  );
  const visibleCryptoRows = useMemo(
    () => orderedCryptoRows.slice(0, cryptoMajorVisibleCount),
    [orderedCryptoRows, cryptoMajorVisibleCount],
  );
  const visibleCryptoSectorRows = useMemo(
    () => orderedCryptoSectorRows.slice(0, cryptoSectorVisibleCount),
    [orderedCryptoSectorRows, cryptoSectorVisibleCount],
  );
  const tapeUniverse = useMemo(() => {
    const merged = new Map<string, QuoteSnapshot>();
    for (const row of [...sortedRows, ...cryptoRows]) {
      merged.set(row.symbol, row);
    }
    return [...merged.values()];
  }, [sortedRows, cryptoRows]);
  const topGainers = useMemo(() => topByPct(tapeUniverse, "up", 5), [tapeUniverse]);
  const topLosers = useMemo(() => topByPct(tapeUniverse, "down", 5), [tapeUniverse]);
  const topVolume = useMemo(() => topByVolume(cryptoRows, 5), [cryptoRows]);

  const tapeSyncLabel =
    payload.fetchedAt != null
      ? formatRelativeTime(new Date(payload.fetchedAt).toISOString(), locale)
      : "—";

  const sectorSyncLabel =
    sectorBook.fetchedAt > 0
      ? formatRelativeTime(new Date(sectorBook.fetchedAt).toISOString(), locale)
      : t("sectorAwaiting");

  const cryptoSectorSyncLabel =
    cryptoSectorBook.fetchedAt > 0
      ? formatRelativeTime(new Date(cryptoSectorBook.fetchedAt).toISOString(), locale)
      : t("cryptoSectorAwaiting");

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <RevealOnce className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-zinc-950/55 p-8 sm:p-10 surface-rise">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] terminal-grid-bg" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4 border-l-[3px] border-amber-400/80 pl-5">
            <Badge
              variant="outline"
              className="gap-1 border-amber-500/40 bg-amber-950/30 font-mono text-[10px] uppercase tracking-wider text-amber-300"
            >
              <Layers className="size-3.5" aria-hidden />
              {t("badgeGlobal")}
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
              {t("h1Lead")}{" "}
              <span className="text-gradient-brand">{t("h1Accent")}</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>
          </div>
          <div className="glass-panel card-shine flex w-full max-w-xl flex-col gap-3 rounded-2xl px-4 py-3 font-mono text-[11px] lg:w-auto lg:max-w-none">
            <div className="grid gap-2 sm:grid-cols-3">
              <TelemetryCard
                label={t("tapeLastUpdated")}
                value={tapeSyncLabel}
                accentClass="border-amber-500/25 bg-amber-950/18"
              />
              <TelemetryCard
                label={t("sectorBookLastUpdated")}
                value={sectorSyncLabel}
                accentClass="border-teal-500/25 bg-teal-950/18"
              />
              <TelemetryCard
                label={t("cryptoSectorLastUpdated")}
                value={cryptoSectorSyncLabel}
                accentClass="border-fuchsia-500/25 bg-fuchsia-950/18"
              />
            </div>
            <div className="flex flex-wrap gap-2 border-t border-white/[0.08] pt-3">
              {payload.results.length === 0 ? (
                <span className="rounded border border-rose-500/35 bg-rose-950/40 px-2 py-1 font-medium text-rose-300">
                  {tDesk("equitiesBadgeUnavailable")}
                </span>
              ) : payload.equitiesPartial ? (
                <span className="rounded border border-amber-500/35 bg-amber-950/40 px-2 py-1 font-medium text-amber-200">
                  {tDesk("equitiesBadgePartial")}
                </span>
              ) : (
                <span className="rounded border border-emerald-500/30 bg-emerald-950/25 px-2 py-1 font-medium text-emerald-300">
                  {tDesk("equitiesBadgeLive")}
                </span>
              )}
              {(payload.crypto?.length ?? 0) === 0 ? (
                <span className="rounded border border-rose-500/35 bg-rose-950/40 px-2 py-1 font-medium text-rose-300">
                  {tDesk("cryptoBadgeUnavailable")}
                </span>
              ) : payload.cryptoPartial ? (
                <span className="rounded border border-amber-500/35 bg-amber-950/40 px-2 py-1 font-medium text-amber-200">
                  {tDesk("cryptoBadgePartial")}
                </span>
              ) : (
                <span className="rounded border border-sky-500/30 bg-sky-950/25 px-2 py-1 font-medium text-sky-300">
                  {tDesk("cryptoBadgeLive")}
                </span>
              )}
              {sectorBook.results.length === 0 ? (
                <span className="rounded border border-rose-500/35 bg-rose-950/40 px-2 py-1 font-medium text-rose-300">
                  {t("sectorBadgeUnavailable")}
                </span>
              ) : sectorBook.partial ? (
                <span className="rounded border border-amber-500/35 bg-amber-950/40 px-2 py-1 font-medium text-amber-200">
                  {t("sectorBadgePartial")}
                </span>
              ) : (
                <span className="rounded border border-teal-500/30 bg-teal-950/25 px-2 py-1 font-medium text-teal-300">
                  {t("sectorBadgeLive")}
                </span>
              )}
              {cryptoSectorBook.results.length === 0 ? (
                <span className="rounded border border-rose-500/35 bg-rose-950/40 px-2 py-1 font-medium text-rose-300">
                  {t("cryptoSectorBadgeUnavailable")}
                </span>
              ) : cryptoSectorBook.partial ? (
                <span className="rounded border border-amber-500/35 bg-amber-950/40 px-2 py-1 font-medium text-amber-200">
                  {t("cryptoSectorBadgePartial")}
                </span>
              ) : (
                <span className="rounded border border-fuchsia-500/30 bg-fuchsia-950/25 px-2 py-1 font-medium text-fuchsia-300">
                  {t("cryptoSectorBadgeLive")}
                </span>
              )}
              <Link
                href="/noticias"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "ml-auto h-8 border-white/15 bg-transparent font-mono text-[11px]",
                )}
              >
                {t("newsRadar")}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </RevealOnce>

      <div className="glass-panel mt-8 flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-950/[0.12] p-4 text-xs leading-relaxed text-muted-foreground surface-rise">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden />
        <div className="space-y-2">
          <p>{t("riskDisclaimer")}</p>
          <p className="border-t border-amber-500/15 pt-2 text-[11px]">{t("sectorDataFoot")}</p>
        </div>
      </div>

      <section className="mt-8 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-400/90">
              {t("summaryEyebrow")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("summaryHint")}</p>
          </div>
        </div>
        <RevealStaggerList as="div" className="grid gap-3 lg:grid-cols-3">
          <RevealBlock tight>
            <SummaryCard
              title={t("summaryTopGainers")}
              rows={topGainers}
              locale={locale}
              fallbackCurrency="BRL"
              volumeMode={false}
            />
          </RevealBlock>
          <RevealBlock tight>
            <SummaryCard
              title={t("summaryTopLosers")}
              rows={topLosers}
              locale={locale}
              fallbackCurrency="BRL"
              volumeMode={false}
            />
          </RevealBlock>
          <RevealBlock tight>
            <SummaryCard
              title={t("summaryMostTraded")}
              rows={topVolume}
              locale={locale}
              fallbackCurrency="BRL"
              volumeMode
            />
          </RevealBlock>
        </RevealStaggerList>
      </section>

      <section id="indices" className="scroll-mt-28 mt-10 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-amber-400/90">
              {t("indicesEyebrow")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{t("indicesHint")}</p>
          </div>
          <BarChart3 className="size-5 text-amber-500/40" aria-hidden />
        </div>
        <RevealStaggerList as="div" className="grid gap-3 sm:grid-cols-3">
          {indexRows.map((row) => (
            <RevealBlock tight key={row.symbol}>
              <IndexProxyCard row={row} locale={locale} />
            </RevealBlock>
          ))}
        </RevealStaggerList>
      </section>

      <RevealOnce className="card-shine mt-10 overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,oklch(0.17_0.05_262/0.66),oklch(0.12_0.04_262/0.72))] shadow-[inset_0_1px_0_oklch(0.88_0.06_85_/_.06)] surface-rise">
        <div
          id="equities-sector-book"
          className="scroll-mt-28 flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/85">
              {t("sectorBookEyebrow")}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("sectorBookLead", {
                sector: t(`sectorTitles.${sector}`),
                count: sectorBook.universeCount,
              })}
            </p>
          </div>
          <RefreshCw className="size-4 shrink-0 text-amber-400/70 max-sm:hidden" aria-hidden />
        </div>

        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-4 py-4 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectorRegion")}
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => selectRegion("br")}
                aria-pressed={region === "br"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors",
                  region === "br"
                    ? "border-amber-500/55 bg-amber-950/50 text-amber-100"
                    : "border-white/15 bg-transparent text-muted-foreground hover:border-amber-500/35 hover:text-foreground",
                )}
              >
                <MapPin className="size-3.5" aria-hidden />
                {t("sectorRegionBr")}
              </button>
              <button
                type="button"
                onClick={() => selectRegion("intl")}
                aria-pressed={region === "intl"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-[11px] transition-colors",
                  region === "intl"
                    ? "border-teal-500/50 bg-teal-950/35 text-teal-100"
                    : "border-white/15 bg-transparent text-muted-foreground hover:border-teal-500/35 hover:text-foreground",
                )}
              >
                <Globe2 className="size-3.5" aria-hidden />
                {t("sectorRegionIntl")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="flex w-max gap-2">
              {SECTOR_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectSector(id)}
                  aria-current={sector === id}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                    sector === id
                      ? region === "br"
                        ? "border-amber-500/50 bg-amber-950/55 text-amber-100"
                        : "border-teal-500/45 bg-teal-950/40 text-teal-100"
                      : "border-white/12 bg-transparent text-muted-foreground hover:border-white/22 hover:text-foreground",
                  )}
                >
                  {t(`sectorTitles.${id}`)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground/90">
              {region === "br" ? t("sectorSourceBrapiLabel") : t("sectorSourceYahooLabel")}
            </span>{" "}
            {region === "br" ? t("sectorSourceBrapiBlurb") : t("sectorSourceYahooBlurb")}
          </p>

          <DeskTableToolbar
            searchValue={equitySearch}
            onSearchChange={updateEquitySearch}
            onClearSearch={() => updateEquitySearch("")}
            searchLabel={t("searchLabel")}
            searchPlaceholder={t("searchPlaceholder")}
            clearLabel={t("searchClear")}
            resultsLabel={t("searchResults", {
              shown: orderedSectorRows.length,
              total: sectorBook.results?.length ?? 0,
            })}
            sortLabel={t("sortStatus", {
              field: t(`sortFields.${equitySort.key}`),
              direction: t(`sortDirections.${equitySort.direction}`),
            })}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/85 backdrop-blur-md">
                <SortableHeader
                  label={t("thTicker")}
                  sortKey="symbol"
                  state={equitySort}
                  onToggle={updateEquitySort}
                />
                <SortableHeader
                  label={t("thDesc")}
                  sortKey="name"
                  state={equitySort}
                  onToggle={updateEquitySort}
                />
                <SortableHeader
                  label={t("thLast")}
                  sortKey="price"
                  state={equitySort}
                  onToggle={updateEquitySort}
                />
                <SortableHeader
                  label={t("thDeltaAbs")}
                  sortKey="change"
                  state={equitySort}
                  onToggle={updateEquitySort}
                />
                <SortableHeader
                  label={t("thDeltaPct")}
                  sortKey="pct"
                  state={equitySort}
                  onToggle={updateEquitySort}
                />
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {visibleSectorRows.map((row) => (
                <QuoteRow
                  key={`${region}-${sector}-${row.symbol}`}
                  row={row}
                  flashDir={flash[row.symbol]}
                  locale={locale}
                  fallbackCurrency={sectorFallBackCur}
                />
              ))}
              {orderedSectorRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
                    {t("searchNoMatches")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <DeskTablePager
          shown={visibleSectorRows.length}
          total={orderedSectorRows.length}
          onShowMore={() =>
            setEquityVisibleCount((current) =>
              Math.min(current + TABLE_PAGE_SIZE, orderedSectorRows.length),
            )
          }
          onShowAll={() => setEquityVisibleCount(orderedSectorRows.length)}
          onShowLess={() => setEquityVisibleCount(TABLE_PAGE_SIZE)}
          labels={{
            showing: t("pagerShowing", {
              shown: visibleSectorRows.length,
              total: orderedSectorRows.length,
            }),
            more: t("pagerMore"),
            all: t("pagerAll"),
            less: t("pagerLess"),
          }}
        />
      </RevealOnce>

      <RevealOnce className="card-shine mt-10 overflow-hidden rounded-2xl border border-sky-500/15 bg-[linear-gradient(180deg,oklch(0.16_0.055_250/0.65),oklch(0.11_0.04_262/0.72))] shadow-[inset_0_1px_0_oklch(0.55_0.18_250_/_.08)] surface-rise">
        <div
          id="crypto-major-tape"
          className="scroll-mt-28 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6"
        >
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200/85">
            {t("cryptoMajorsTitle")}
          </span>
          <RefreshCw className="size-4 text-sky-400/70" aria-hidden />
        </div>
        <div className="border-b border-white/[0.06] px-4 py-2.5 sm:px-6">
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t("cryptoMajorsLead")}</p>
        </div>
        <div className="border-b border-white/[0.06] px-4 py-4 sm:px-6">
          <DeskTableToolbar
            searchValue={cryptoMajorSearch}
            onSearchChange={updateCryptoMajorSearch}
            onClearSearch={() => updateCryptoMajorSearch("")}
            searchLabel={t("searchLabel")}
            searchPlaceholder={t("searchPlaceholder")}
            clearLabel={t("searchClear")}
            resultsLabel={t("searchResults", {
              shown: orderedCryptoRows.length,
              total: cryptoRows.length,
            })}
            sortLabel={t("sortStatus", {
              field: t(`sortFields.${cryptoMajorSort.key}`),
              direction: t(`sortDirections.${cryptoMajorSort.direction}`),
            })}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/85 backdrop-blur-md">
                <SortableHeader
                  label={t("thPair")}
                  sortKey="symbol"
                  state={cryptoMajorSort}
                  onToggle={updateCryptoMajorSort}
                />
                <SortableHeader
                  label={t("thName")}
                  sortKey="name"
                  state={cryptoMajorSort}
                  onToggle={updateCryptoMajorSort}
                />
                <SortableHeader
                  label={t("thLast")}
                  sortKey="price"
                  state={cryptoMajorSort}
                  onToggle={updateCryptoMajorSort}
                />
                <SortableHeader
                  label={t("thDeltaBrl")}
                  sortKey="change"
                  state={cryptoMajorSort}
                  onToggle={updateCryptoMajorSort}
                />
                <SortableHeader
                  label={t("thDeltaPct")}
                  sortKey="pct"
                  state={cryptoMajorSort}
                  onToggle={updateCryptoMajorSort}
                />
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {visibleCryptoRows.map((row) => (
                <QuoteRow
                  key={row.symbol}
                  row={row}
                  flashDir={flash[row.symbol]}
                  locale={locale}
                  fallbackCurrency="BRL"
                />
              ))}
              {orderedCryptoRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
                    {t("searchNoMatches")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <DeskTablePager
          shown={visibleCryptoRows.length}
          total={orderedCryptoRows.length}
          onShowMore={() =>
            setCryptoMajorVisibleCount((current) =>
              Math.min(current + TABLE_PAGE_SIZE, orderedCryptoRows.length),
            )
          }
          onShowAll={() => setCryptoMajorVisibleCount(orderedCryptoRows.length)}
          onShowLess={() => setCryptoMajorVisibleCount(TABLE_PAGE_SIZE)}
          labels={{
            showing: t("pagerShowing", {
              shown: visibleCryptoRows.length,
              total: orderedCryptoRows.length,
            }),
            more: t("pagerMore"),
            all: t("pagerAll"),
            less: t("pagerLess"),
          }}
        />
        <p className="border-t border-white/[0.06] px-4 py-3 text-center text-[10px] leading-relaxed text-muted-foreground sm:px-6">
          {t("cryptoFootLead")}{" "}
          <a
            href="https://www.coingecko.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-sky-400 underline-offset-2 hover:underline"
          >
            CoinGecko
          </a>
          {t("cryptoFootTrail")}
        </p>
      </RevealOnce>

      <RevealOnce className="card-shine mt-10 overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-[linear-gradient(180deg,oklch(0.17_0.065_320/0.62),oklch(0.11_0.04_262/0.72))] shadow-[inset_0_1px_0_oklch(0.66_0.22_330_/_.08)] surface-rise">
        <div
          id="crypto-sector-book"
          className="scroll-mt-28 flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/85">
              {t("cryptoSectorEyebrow")}
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("cryptoSectorLead", {
                sector: t(`cryptoSectorTitles.${cryptoSector}`),
                count: cryptoSectorBook.universeCount,
              })}
            </p>
          </div>
          <RefreshCw className="size-4 shrink-0 text-fuchsia-400/70 max-sm:hidden" aria-hidden />
        </div>

        <div className="flex flex-col gap-4 border-b border-white/[0.06] px-4 py-4 sm:px-6">
          <div className="overflow-x-auto pb-1">
            <div className="flex w-max gap-2">
              {CRYPTO_SECTOR_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => selectCryptoSector(id)}
                  aria-current={cryptoSector === id}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap transition-colors",
                    cryptoSector === id
                      ? "border-fuchsia-500/50 bg-fuchsia-950/45 text-fuchsia-100"
                      : "border-white/12 bg-transparent text-muted-foreground hover:border-white/22 hover:text-foreground",
                  )}
                >
                  {t(`cryptoSectorTitles.${id}`)}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground/90">
              {t("cryptoSectorSourceLabel")}
            </span>{" "}
            {t("cryptoSectorSourceBlurb")}
          </p>

          <DeskTableToolbar
            searchValue={cryptoSectorSearch}
            onSearchChange={updateCryptoSectorSearch}
            onClearSearch={() => updateCryptoSectorSearch("")}
            searchLabel={t("searchLabel")}
            searchPlaceholder={t("searchPlaceholder")}
            clearLabel={t("searchClear")}
            resultsLabel={t("searchResults", {
              shown: orderedCryptoSectorRows.length,
              total: cryptoSectorBook.results?.length ?? 0,
            })}
            sortLabel={t("sortStatus", {
              field: t(`sortFields.${cryptoSectorSort.key}`),
              direction: t(`sortDirections.${cryptoSectorSort.direction}`),
            })}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/95 text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200/85 backdrop-blur-md">
                <SortableHeader
                  label={t("thPair")}
                  sortKey="symbol"
                  state={cryptoSectorSort}
                  onToggle={updateCryptoSectorSort}
                />
                <SortableHeader
                  label={t("thName")}
                  sortKey="name"
                  state={cryptoSectorSort}
                  onToggle={updateCryptoSectorSort}
                />
                <SortableHeader
                  label={t("thLast")}
                  sortKey="price"
                  state={cryptoSectorSort}
                  onToggle={updateCryptoSectorSort}
                />
                <SortableHeader
                  label={t("thDeltaBrl")}
                  sortKey="change"
                  state={cryptoSectorSort}
                  onToggle={updateCryptoSectorSort}
                />
                <SortableHeader
                  label={t("thDeltaPct")}
                  sortKey="pct"
                  state={cryptoSectorSort}
                  onToggle={updateCryptoSectorSort}
                />
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {visibleCryptoSectorRows.map((row) => (
                <QuoteRow
                  key={`${cryptoSector}-${row.symbol}`}
                  row={row}
                  flashDir={flash[row.symbol]}
                  locale={locale}
                  fallbackCurrency="BRL"
                />
              ))}
              {orderedCryptoSectorRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-6">
                    {t("searchNoMatches")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <DeskTablePager
          shown={visibleCryptoSectorRows.length}
          total={orderedCryptoSectorRows.length}
          onShowMore={() =>
            setCryptoSectorVisibleCount((current) =>
              Math.min(current + TABLE_PAGE_SIZE, orderedCryptoSectorRows.length),
            )
          }
          onShowAll={() => setCryptoSectorVisibleCount(orderedCryptoSectorRows.length)}
          onShowLess={() => setCryptoSectorVisibleCount(TABLE_PAGE_SIZE)}
          labels={{
            showing: t("pagerShowing", {
              shown: visibleCryptoSectorRows.length,
              total: orderedCryptoSectorRows.length,
            }),
            more: t("pagerMore"),
            all: t("pagerAll"),
            less: t("pagerLess"),
          }}
        />

        <p className="border-t border-white/[0.06] px-4 py-3 text-center text-[10px] leading-relaxed text-muted-foreground sm:px-6">
          {t("cryptoSectorFoot")}
        </p>
      </RevealOnce>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        {t("ctaDesk")}{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          {t("ctaRegister")}
        </Link>
      </p>
    </div>
  );
}

const IndexProxyCard = memo(function IndexProxyCard({
  row,
  locale,
}: {
  row: QuoteSnapshot;
  locale: string;
}) {
  const pct = row.regularMarketChangePercent;
  const up = pct != null && pct >= 0;
  const priceLabel = formatQuoteMoney(row.regularMarketPrice, row, locale, "BRL");

  return (
    <div className="surface-rise rounded-xl border border-amber-500/20 bg-zinc-950/60 px-4 py-3 font-mono shadow-inner">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
        {row.symbol}
      </p>
      <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
        {INDEX_PROXY_LABELS[row.symbol] ?? row.shortName ?? "—"}
      </p>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {priceLabel}
        </span>
        <span
          className={cn(
            "text-xs font-semibold",
            pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
        </span>
      </div>
    </div>
  );
});

function DeskTableToolbar({
  searchValue,
  onSearchChange,
  onClearSearch,
  searchLabel,
  searchPlaceholder,
  clearLabel,
  resultsLabel,
  sortLabel,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  searchLabel: string;
  searchPlaceholder: string;
  clearLabel: string;
  resultsLabel: string;
  sortLabel: string;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-3 shadow-[inset_0_1px_0_oklch(1_0_0/0.03)] lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-end">
      <div className="grid gap-2">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {searchLabel}
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 border-white/12 bg-white/[0.045] pl-8 pr-9 font-mono text-[12px]"
          />
          {searchValue ? (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-1.5 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
              aria-label={clearLabel}
              title={clearLabel}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <ToolbarPill>{resultsLabel}</ToolbarPill>
        <ToolbarPill>{sortLabel}</ToolbarPill>
      </div>
    </div>
  );
}

function ToolbarPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-muted-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
      {children}
    </span>
  );
}

function DeskTablePager({
  shown,
  total,
  onShowMore,
  onShowAll,
  onShowLess,
  labels,
}: {
  shown: number;
  total: number;
  onShowMore: () => void;
  onShowAll: () => void;
  onShowLess: () => void;
  labels: { showing: string; more: string; all: string; less: string };
}) {
  if (total <= 0) return null;
  const hasMore = shown < total;
  const canCollapse = total > TABLE_PAGE_SIZE && shown > TABLE_PAGE_SIZE;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] bg-black/15 px-4 py-3 sm:px-6">
      <span className="text-[11px] text-muted-foreground">{labels.showing}</span>
      <div className="flex flex-wrap gap-2">
        {hasMore ? (
          <>
            <button
              type="button"
              onClick={onShowMore}
              className="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-foreground transition-colors hover:border-white/22 hover:bg-white/[0.06]"
            >
              {labels.more}
            </button>
            <button
              type="button"
              onClick={onShowAll}
              className="rounded-lg border border-white/12 bg-white/[0.03] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-white/22 hover:bg-white/[0.06] hover:text-foreground"
            >
              {labels.all}
            </button>
          </>
        ) : null}
        {canCollapse ? (
          <button
            type="button"
            onClick={onShowLess}
            className="rounded-lg border border-white/12 bg-transparent px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-white/22 hover:bg-white/[0.04] hover:text-foreground"
          >
            {labels.less}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  sortKey,
  state,
  onToggle,
}: {
  label: string;
  sortKey: QuoteSortKey;
  state: QuoteSortState;
  onToggle: Dispatch<SetStateAction<QuoteSortState>>;
}) {
  const active = state.key === sortKey;

  return (
    <th
      aria-sort={ariaSortValue(state, sortKey)}
      className="px-4 py-3 font-medium sm:px-6"
    >
      <button
        type="button"
        onClick={() => onToggle((current) => nextSortState(current, sortKey))}
        className={cn(
          "inline-flex items-center gap-1.5 transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-inherit",
        )}
      >
        <span>{label}</span>
        <ArrowUpDown
          className={cn(
            "size-3.5",
            active ? "opacity-100" : "opacity-45",
          )}
          aria-hidden
        />
        {active ? (
          <span className="text-[9px] text-muted-foreground">
            {state.direction === "asc" ? "ASC" : "DESC"}
          </span>
        ) : null}
      </button>
    </th>
  );
}

function TelemetryCard({
  label,
  value,
  accentClass,
}: {
  label: string;
  value: string;
  accentClass: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]",
        accentClass,
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  rows,
  locale,
  fallbackCurrency,
  volumeMode,
}: {
  title: string;
  rows: QuoteSnapshot[];
  locale: string;
  fallbackCurrency: string;
  volumeMode: boolean;
}) {
  return (
    <div className="card-shine h-full rounded-2xl border border-white/10 bg-[linear-gradient(180deg,oklch(0.16_0.048_262/0.72),oklch(0.11_0.038_262/0.82))] p-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/85">
          {title}
        </p>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          TOP 5
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {rows.length > 0 ? (
          rows.map((row, idx) => (
            <div
              key={`${title}-${row.symbol}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[10px] text-muted-foreground">
                  {idx + 1}
                </span>
                <QuoteAvatar row={row} fallbackCurrency={fallbackCurrency} size={26} />
                <div className="min-w-0">
                  <p className="truncate font-mono text-[12px] font-semibold text-foreground">
                    {row.symbol}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {volumeMode
                      ? formatCompactVolume(row.regularMarketVolume, locale)
                      : formatQuoteMoney(
                          row.regularMarketPrice,
                          row,
                          locale,
                          fallbackCurrency,
                        )}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px] font-semibold",
                  row.regularMarketChangePercent == null
                    ? "text-muted-foreground"
                    : row.regularMarketChangePercent >= 0
                      ? "text-emerald-400"
                      : "text-rose-400",
                )}
              >
                {row.regularMarketChangePercent == null
                  ? "—"
                  : `${row.regularMarketChangePercent >= 0 ? "+" : ""}${row.regularMarketChangePercent.toFixed(2)}%`}
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-sm text-muted-foreground">
            —
          </p>
        )}
      </div>
    </div>
  );
}

function QuoteAvatar({
  row,
  fallbackCurrency,
  size = 28,
}: {
  row: QuoteSnapshot;
  fallbackCurrency: string;
  size?: number;
}) {
  const fallback = (
    <span
      aria-hidden
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-mono text-[10px] font-semibold tracking-wide",
        quoteBadgeClasses(row, fallbackCurrency),
      )}
      style={{ width: size, height: size }}
    >
      {quoteMonogram(row)}
    </span>
  );

  if (!row.imageUrl) return fallback;

  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-black/20 shadow-[0_0_0_1px_oklch(1_0_0/0.04),0_6px_18px_oklch(0_0_0/0.22)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Image
        src={row.imageUrl}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}

const QuoteRow = memo(
  function QuoteRowInner({
    row,
    flashDir,
    locale,
    fallbackCurrency,
  }: {
    row: QuoteSnapshot;
    flashDir?: "up" | "down";
    locale: string;
    fallbackCurrency: string;
  }) {
    const pct = row.regularMarketChangePercent;
    const ch = row.regularMarketChange;
    const up = pct != null && pct >= 0;
    const cur = quoteCurrencyCode(row, fallbackCurrency);
    const detailHref = row.segment === "crypto" ? null : `/ativo/${row.symbol}`;

    const priceLabel = formatQuoteMoney(row.regularMarketPrice, row, locale, fallbackCurrency);
    const changeLabel =
      ch != null
        ? `${up ? "+" : ""}${formatQuoteMoney(ch, row, locale, fallbackCurrency)}`
        : "—";

    return (
      <tr
        className={cn(
          "surface-rise-row border-b border-white/[0.06] transition-colors duration-500 odd:bg-white/[0.02] hover:bg-white/[0.05]",
          flashDir === "up" && "bg-emerald-500/15",
          flashDir === "down" && "bg-rose-500/12",
        )}
      >
        <td className="px-4 py-2.5 font-heading text-[13px] font-semibold sm:px-6">
          <div className="flex items-center gap-2">
            <QuoteAvatar row={row} fallbackCurrency={fallbackCurrency} />
            <div className="flex min-w-0 flex-col">
              {detailHref ? (
                <Link
                  href={detailHref}
                  className="w-fit transition-colors hover:text-primary"
                >
                  {row.symbol}
                </Link>
              ) : (
                <span>{row.symbol}</span>
              )}
              {row.segment === "crypto" && row.marketCapRank != null ? (
                <span className="font-mono text-[10px] font-medium text-muted-foreground">
                  #{row.marketCapRank}
                </span>
              ) : null}
            </div>
          </div>
        </td>
        <td className="max-w-[240px] truncate px-4 py-2.5 text-[13px] text-muted-foreground sm:max-w-[320px] sm:px-6">
          {detailHref ? (
            <Link
              href={detailHref}
              className="transition-colors hover:text-foreground"
            >
              {row.shortName ?? "—"}
            </Link>
          ) : (
            row.shortName ?? "—"
          )}
        </td>
        <td className="px-4 py-2.5 font-mono text-[13px] sm:px-6">{priceLabel}</td>
        <td className="px-4 py-2.5 font-mono text-[13px] sm:px-6">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold",
              ch == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {ch != null ? (
              up ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )
            ) : null}
            {changeLabel}
          </span>
        </td>
        <td className="px-4 py-2.5 font-mono text-[13px] sm:px-6">
          <span
            title={cur}
            className={cn(
              "inline-block font-semibold",
              pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-rose-400",
            )}
          >
            {pct == null ? "—" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
          </span>
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.flashDir === next.flashDir &&
    prev.locale === next.locale &&
    prev.fallbackCurrency === next.fallbackCurrency &&
    quoteVisualEquals(prev.row, next.row),
);
