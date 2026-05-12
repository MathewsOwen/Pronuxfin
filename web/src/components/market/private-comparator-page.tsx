"use client";

import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Scale,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import type { AssetDossier } from "@/lib/market/types";
import {
  buildWatchlistRadarSignal,
  type WatchlistAttentionLevel,
  type WatchlistRadarReason,
} from "@/lib/user-watchlist/intelligence";
import { formatRelativeTime } from "@/lib/market/time";
import type { WatchlistAlertRule } from "@/lib/user-watchlist/alerts";
import type { WatchlistSignalSnapshot } from "@/lib/user-watchlist/history";
import type { UserWatchlistItemView } from "@/lib/user-watchlist/load";
import { cn } from "@/lib/utils";

const MAX_COMPARE_ITEMS = 4;

export function PrivateComparatorPage({
  watchlistItems,
  selectedSymbols,
  dossiers,
  previousSignals,
  effectiveRules,
  locale,
}: {
  watchlistItems: UserWatchlistItemView[];
  selectedSymbols: string[];
  dossiers: AssetDossier[];
  previousSignals: Record<string, WatchlistSignalSnapshot>;
  effectiveRules: WatchlistAlertRule[];
  locale: string;
}) {
  const t = useTranslations("Comparator");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  function navigateTo(symbols: string[]) {
    const next = [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean))].slice(
      0,
      MAX_COMPARE_ITEMS,
    );
    if (next.length === 0) {
      router.push(pathname);
      return;
    }
    const params = new URLSearchParams({ symbols: next.join(",") });
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleSelected(symbol: string) {
    startTransition(() => {
      const active = selectedSymbols.includes(symbol);
      const next = active
        ? selectedSymbols.filter((item) => item !== symbol)
        : [...selectedSymbols, symbol].slice(0, MAX_COMPARE_ITEMS);
      navigateTo(next);
    });
  }

  async function removeFromWatchlist(symbol: string) {
    setRemovingSymbol(symbol);
    setMutationError(null);
    try {
      const res = await fetch("/api/user/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) {
        throw new Error("watchlist_remove_failed");
      }
      navigateTo(selectedSymbols.filter((item) => item !== symbol));
      router.refresh();
    } catch {
      setMutationError(t("watchlistMutationError"));
    } finally {
      setRemovingSymbol(null);
    }
  }

  const assistantHref = buildCompareAssistantHref(dossiers, locale);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] md:px-8">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {t("heroPillPrivate")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillWatchlist")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillComparator")}
          </Badge>
        </div>
        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-3 leading-relaxed text-muted-foreground">{t("pageLead")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="glass-panel rounded-2xl border border-white/10 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("watchlistCount")}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {watchlistItems.length}
              </p>
            </div>
            <div className="glass-panel rounded-2xl border border-white/10 px-4 py-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                {t("selectionCount")}
              </p>
              <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                {selectedSymbols.length}/{MAX_COMPARE_ITEMS}
              </p>
            </div>
          </div>
        </div>
      </header>

      <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
        <CardHeader>
          <CardTitle className="font-heading">{t("watchlistTitle")}</CardTitle>
          <CardDescription>{t("watchlistSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {watchlistItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-8 text-center">
              <Bookmark className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {t("emptyTitle")}
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("emptyLead")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link
                  href="/bolsa"
                  className={cn(buttonVariants({ size: "lg" }), "glow-ring")}
                >
                  {t("emptyCtaMarket")}
                </Link>
                <Link
                  href="/dashboard"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  {t("emptyCtaDashboard")}
                </Link>
              </div>
            </div>
          ) : (
            <>
              {mutationError ? (
                <p className="text-sm text-rose-300">{mutationError}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {selectedSymbols.length > 0 ? (
                  selectedSymbols.map((symbol) => (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => toggleSelected(symbol)}
                      disabled={isPending}
                      className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-60"
                    >
                      {symbol} · {t("selectedChipRemove")}
                    </button>
                  ))
                ) : (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-muted-foreground">
                    {t("selectedChipEmpty")}
                  </span>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {watchlistItems.map((item) => {
                  const active = selectedSymbols.includes(item.symbol);
                  const atLimit = !active && selectedSymbols.length >= MAX_COMPARE_ITEMS;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-3xl border bg-white/[0.03] p-4 transition-colors",
                        active
                          ? "border-primary/25 bg-primary/5"
                          : "border-white/10",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            {item.region === "br" ? t("regionBr") : t("regionIntl")}
                          </p>
                          <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                            {item.symbol}
                          </p>
                        </div>
                        {active ? (
                          <BookmarkCheck className="size-5 text-primary" />
                        ) : (
                          <Bookmark className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant={active ? "secondary" : "outline"}
                          size="sm"
                          onClick={() => toggleSelected(item.symbol)}
                          disabled={isPending || atLimit}
                        >
                          <Scale className="size-4" />
                          {active
                            ? t("watchlistSelected")
                            : atLimit
                              ? t("watchlistLimit")
                              : t("watchlistSelect")}
                        </Button>
                        <Link
                          href={`/ativo/${item.symbol}`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          <ArrowUpRight className="size-4" />
                          {t("watchlistOpenAsset")}
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void removeFromWatchlist(item.symbol);
                          }}
                          disabled={removingSymbol === item.symbol}
                          className="text-rose-300 hover:bg-rose-950/20 hover:text-rose-200"
                        >
                          <Trash2 className="size-4" />
                          {removingSymbol === item.symbol
                            ? t("watchlistRemoving")
                            : t("watchlistRemove")}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
        <CardHeader>
          <CardTitle className="font-heading">{t("comparisonTitle")}</CardTitle>
          <CardDescription>{t("comparisonSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {dossiers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-8 text-center">
              <BarChart3 className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-4 text-lg font-semibold tracking-tight text-foreground">
                {t("comparisonEmptyTitle")}
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {t("comparisonEmptyLead")}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-4 md:grid-cols-2">
              {dossiers.map((dossier) => {
                const signal = buildWatchlistRadarSignal(dossier, effectiveRules);
                const previous = previousSignals[dossier.symbol];
                const priorityDelta = previous
                  ? signal.priority - previous.priority
                  : null;
                return (
                  <Card
                    key={dossier.symbol}
                    className="border-white/10 bg-black/20 shadow-none ring-0"
                  >
                    <CardHeader className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            {dossier.symbol}
                          </p>
                          <CardTitle className="font-heading text-xl tracking-tight">
                            {dossier.companyName}
                          </CardTitle>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                            {dossier.region === "br" ? t("regionBr") : t("regionIntl")}
                          </Badge>
                          <Badge className={attentionBadgeClass(signal.attentionLevel)}>
                            {t(attentionLabelKey(signal.attentionLevel))}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{dossier.sector ?? t("notAvailable")}</CardDescription>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {t("signalPriority", { value: signal.priority })} ·{" "}
                        {signal.reasons
                          .map((reason) => formatComparatorRadarReason(reason, t))
                          .join(" · ")}
                      </p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {priorityDelta != null
                          ? t("signalDelta", {
                              value:
                                priorityDelta > 0
                                  ? `+${priorityDelta}`
                                  : String(priorityDelta),
                            })
                          : t("signalDeltaNew")}
                        {" · "}
                        {t("signalSince", {
                          value: formatRelativeTime(previous?.createdAt ?? null, locale),
                        })}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-3xl font-semibold tracking-tight text-foreground">
                          {formatMoney(dossier.quote.regularMarketPrice, dossier.currency, locale)}
                        </p>
                        <p
                          className={cn(
                            "mt-1 text-sm font-medium",
                            (dossier.quote.regularMarketChangePercent ?? 0) >= 0
                              ? "text-emerald-400"
                              : "text-rose-400",
                          )}
                        >
                          {formatSignedPercent(dossier.quote.regularMarketChangePercent)}
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <MetricRow
                          label={t("metricMarketCap")}
                          value={formatCompactMoney(dossier.marketCap, dossier.currency, locale)}
                        />
                        <MetricRow
                          label={t("metricVolume")}
                          value={formatCompactNumber(dossier.regularMarketVolume, locale)}
                        />
                        <MetricRow
                          label={t("metricPe")}
                          value={formatMultiple(dossier.priceEarnings)}
                        />
                        <MetricRow
                          label={t("metric52Week")}
                          value={`${formatMoney(dossier.fiftyTwoWeekLow, dossier.currency, locale)} / ${formatMoney(dossier.fiftyTwoWeekHigh, dossier.currency, locale)}`}
                        />
                        <MetricRow
                          label={t("metricCountry")}
                          value={dossier.country ?? t("notAvailable")}
                        />
                        <MetricRow
                          label={t("metricExchange")}
                          value={dossier.exchange ?? t("notAvailable")}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Link
                          href={`/ativo/${dossier.symbol}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          {t("openDossier")}
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-6 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
              {t("assistantTitle")}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("assistantLead")}
            </p>
          </div>
          <Link
            href={assistantHref}
            className={cn(buttonVariants({ size: "lg" }), "glow-ring h-11")}
          >
            <Sparkles className="size-4" />
            {dossiers.length >= 2 ? t("assistantCta") : t("assistantCtaGeneric")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[58%] text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function buildCompareAssistantHref(dossiers: AssetDossier[], locale: string) {
  const symbols = dossiers.map((item) => item.symbol);
  const label = symbols.join(", ");
  const prompt =
    locale === "pt-BR"
      ? symbols.length >= 2
        ? `Compare ${label} para um investidor pessoa física. Destaque preço, valuation, liquidez, range de 52 semanas, setor, riscos e qual cenário favorece cada ativo.`
        : `Analise ${label || "os ativos selecionados"} para um investidor pessoa física e organize os principais riscos, valuation e liquidez.`
      : symbols.length >= 2
        ? `Compare ${label} for a retail investor. Highlight price, valuation, liquidity, 52-week range, sector, risks and which scenario benefits each asset.`
        : `Analyze ${label || "the selected assets"} for a retail investor and organize the main risks, valuation and liquidity signals.`;

  const params = new URLSearchParams({
    channel: "equities",
    audience: "pf",
    open: "1",
    prompt,
  });
  if (symbols[0]) {
    params.set("asset", symbols[0]);
  }
  return `/assistant?${params.toString()}`;
}

function formatMoney(value: number | null | undefined, currency: string, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatSignedPercent(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCompactNumber(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatCompactMoney(
  value: number | null | undefined,
  currency: string,
  locale: string,
) {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return formatCompactNumber(value, locale);
  }
}

function formatMultiple(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}x`;
}

function formatComparatorRadarReason(
  reason: WatchlistRadarReason,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  switch (reason.code) {
    case "large_move":
      return t("signalReasonLargeMove", { value: (reason.value ?? 0).toFixed(1) });
    case "news_flow":
      return t("signalReasonNewsFlow", { value: Math.round(reason.value ?? 0) });
    case "near_52w_high":
      return t("signalReasonNearHigh");
    case "near_52w_low":
      return t("signalReasonNearLow");
    case "live_history":
      return t("signalReasonLive");
    case "liquid":
      return t("signalReasonLiquid");
    default:
      return t("signalReasonLive");
  }
}

function attentionLabelKey(level: WatchlistAttentionLevel) {
  switch (level) {
    case "high":
      return "signalAttentionHigh";
    case "medium":
      return "signalAttentionMedium";
    default:
      return "signalAttentionBaseline";
  }
}

function attentionBadgeClass(level: WatchlistAttentionLevel) {
  switch (level) {
    case "high":
      return "border-amber-500/25 bg-amber-950/20 text-amber-100";
    case "medium":
      return "border-sky-500/25 bg-sky-950/20 text-sky-100";
    default:
      return "border-white/10 bg-white/[0.04] text-muted-foreground";
  }
}
