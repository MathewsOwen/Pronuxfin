import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Bookmark,
  ShieldCheck,
  Sparkles,
  Wallet,
  Waves,
} from "lucide-react";
import { DashboardAnalyticsSection } from "@/components/dashboard/dashboard-analytics-section";
import { PortfolioEmptyDeskCallout } from "@/components/dashboard/portfolio-empty-desk-callout";
import { WatchlistSignalSync } from "@/components/dashboard/watchlist-signal-sync";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { loadAssetDossier } from "@/lib/market/load-asset-dossier";
import { formatRelativeTime } from "@/lib/market/time";
import { privateAppMetadata } from "@/lib/page-metadata";
import { getCurrentUser } from "@/lib/session";
import { CompleteNameCard } from "@/components/auth/complete-name-card";
import { AppOnboardingPanel } from "@/components/onboarding/app-onboarding-panel";
import { displayNameForUser, userNeedsName } from "@/lib/user-display";
import {
  buildWatchlistAlertCenter,
  buildWatchlistBriefing,
} from "@/lib/user-watchlist/briefing";
import { listLatestWatchlistSignalSnapshots } from "@/lib/user-watchlist/history";
import {
  buildWatchlistRadarSignal,
  type WatchlistAttentionLevel,
  type WatchlistRadarReason,
} from "@/lib/user-watchlist/intelligence";
import { listUserWatchlist } from "@/lib/user-watchlist/load";
import { listEffectiveWatchlistAlertRules } from "@/lib/user-watchlist/rules";
import { listUserPortfolioPositions } from "@/lib/user-portfolio/load";
import { buildPortfolioSummary } from "@/lib/user-portfolio/snapshot";
import { PortfolioSummaryPanel } from "@/components/tools/portfolio-summary-panel";
import { FinancialRouteDashboardStrip } from "@/components/financial-route/financial-route-dashboard-strip";
import { evaluateUserFinancialRoutes } from "@/lib/financial-route/load";
import { loadEconomicCalendar } from "@/lib/tools/load-economic-calendar";
import { buildPortfolioHref } from "@/lib/market/portfolio-links";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const tShell = await getTranslations("AppShell");
  const tDash = await getTranslations("Dashboard");
  return privateAppMetadata({
    pathname: "/dashboard",
    title: tShell("panel"),
    description: tDash("metaDescription"),
    locale,
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const t = await getTranslations("Dashboard");
  const locale = await getLocale();
  const needsName = user ? userNeedsName(user) : false;
  const greeting = user
    ? displayNameForUser(user) || t("guestFallback")
    : t("guestFallback");
  const watchlistItems = user ? await listUserWatchlist(user.id) : [];
  const portfolioPositions = user ? await listUserPortfolioPositions(user.id) : [];
  const portfolioSummary =
    portfolioPositions.length > 0 ? await buildPortfolioSummary(portfolioPositions) : null;
  const watchlistSymbols = watchlistItems.map((item) => item.symbol);
  const deskSymbols = [
    ...new Set([
      ...watchlistSymbols,
      ...portfolioPositions.map((p) => p.symbol),
    ]),
  ];
  const { events: todayCalendarEvents } = await loadEconomicCalendar({
    days: 1,
    watchlistSymbols: deskSymbols,
    limit: 5,
  });
  const agendaHasLive = todayCalendarEvents.length > 0;
  const financialRoutes = user ? await evaluateUserFinancialRoutes(user.id) : [];
  const effectiveRules = user ? await listEffectiveWatchlistAlertRules(user.id) : [];
  const radarDossiers = (
    await Promise.all(
      watchlistItems.slice(0, 6).map((item) => loadAssetDossier(item.symbol)),
    )
  ).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const previousSnapshots = user
    ? await listLatestWatchlistSignalSnapshots(
        user.id,
        radarDossiers.map((item) => item.symbol),
      )
    : {};
  const radarItems = radarDossiers
    .map((dossier) => ({
      dossier,
      signal: buildWatchlistRadarSignal(dossier, effectiveRules),
      previous: previousSnapshots[dossier.symbol],
    }))
    .sort((a, b) => b.signal.priority - a.signal.priority);
  const briefingItems = buildWatchlistBriefing(radarItems, effectiveRules);
  const alertEvents = buildWatchlistAlertCenter(radarItems, effectiveRules);
  const compareHref = buildCompareHref(radarItems.map((item) => item.dossier.symbol));
  const assistantHref = buildDashboardAssistantHref(
    radarItems.map((item) => item.dossier.symbol),
    locale,
  );
  const radarHighCount = radarItems.filter((item) => item.signal.attentionLevel === "high").length;
  const radarLiveCount = radarItems.filter((item) =>
    item.signal.reasons.some((reason) => reason.code === "live_history"),
  ).length;
  const radarNewsCount = radarItems.filter((item) => item.signal.newsCount > 0).length;

  const moneyFmt = (value: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const kpis = portfolioSummary
    ? [
        {
          label: t("kpiMarketValue"),
          value: moneyFmt(portfolioSummary.marketValue, portfolioSummary.currency),
          delta:
            portfolioSummary.totalPnlPercent != null
              ? `${portfolioSummary.totalPnlPercent >= 0 ? "+" : ""}${portfolioSummary.totalPnlPercent.toFixed(2)}%`
              : "—",
          up: portfolioSummary.totalPnl >= 0,
        },
        {
          label: t("kpiDayPnl"),
          value: moneyFmt(portfolioSummary.dayPnl, portfolioSummary.currency),
          delta: t("kpiDayPnlHint"),
          up: portfolioSummary.dayPnl >= 0,
        },
        {
          label: t("kpiCostBasis"),
          value: moneyFmt(portfolioSummary.costBasis, portfolioSummary.currency),
          delta: t("kpiPositions", { count: portfolioSummary.positionCount }),
          up: null,
        },
        {
          label: t("kpiTotalPnl"),
          value: moneyFmt(portfolioSummary.totalPnl, portfolioSummary.currency),
          delta: t("kpiSimulated"),
          up: portfolioSummary.totalPnl >= 0,
        },
      ]
    : [
        {
          label: t("kpiEmptyPortfolio"),
          value: "—",
          delta: t("kpiEmptyHint"),
          up: null,
        },
        {
          label: t("kpiEmptyRoute"),
          value: "—",
          delta: t("kpiEmptyRouteHint"),
          up: null,
        },
        {
          label: t("kpiEmptyWatchlist"),
          value: String(watchlistItems.length),
          delta: t("kpiEmptyWatchlistHint"),
          up: null,
        },
        {
          label: t("kpiEmptyCalendar"),
          value: String(todayCalendarEvents.length),
          delta: t("kpiEmptyCalendarHint"),
          up: null,
        },
      ];
  const signals = [
    {
      label: t("signalTrustLabel"),
      value: t("signalTrustValue"),
      icon: ShieldCheck,
      tone: "border-emerald-500/25 bg-emerald-950/16 text-emerald-100",
    },
    {
      label: t("signalDataLabel"),
      value: t("signalDataValue"),
      icon: Waves,
      tone: "border-sky-500/25 bg-sky-950/16 text-sky-100",
    },
    {
      label: t("signalSimLabel"),
      value: t("signalSimValue"),
      icon: Sparkles,
      tone: "border-amber-500/25 bg-amber-950/16 text-amber-100",
    },
  ];
  const agendaFallback = [t("agendaItem1"), t("agendaItem2"), t("agendaItem3")];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {user ? <AppOnboardingPanel userId={user.id} /> : null}
      <WatchlistSignalSync
        items={radarItems.map((item) => ({
          symbol: item.dossier.symbol,
          signal: item.signal,
        }))}
      />
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] md:px-8">
        <div className="pointer-events-none absolute -left-6 -top-6 size-40 rounded-full bg-primary/10 blur-3xl" />
        <p className="text-sm font-medium text-muted-foreground">{t("eyebrow")}</p>
        <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
          {t("greeting")} <span className="text-gradient-brand">{greeting}</span>
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
          {portfolioSummary ? t("subtitleLive") : t("subtitleEmpty")}
        </p>
        {needsName ? (
          <div className="mt-5">
            <CompleteNameCard />
          </div>
        ) : null}
        {!portfolioSummary && !needsName ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/carteira" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("ctaPortfolio")}
            </Link>
            <Link href="/rota" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("ctaRoute")}
            </Link>
            <Link href="/bolsa" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("ctaMarket")}
            </Link>
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {t("heroPillOverview")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillLiveReady")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {t("heroPillPrivateDesk")}
          </Badge>
        </div>
      </div>

      {!portfolioSummary && user ? (
        <PortfolioEmptyDeskCallout watchlistCount={watchlistItems.length} />
      ) : null}

      {portfolioSummary ? (
        <PortfolioSummaryPanel summary={portfolioSummary} locale={locale} compact />
      ) : null}

      {user ? (
        <FinancialRouteDashboardStrip routes={financialRoutes} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {signals.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className={`glass-panel card-shine rounded-3xl border px-5 py-4 shadow-none ring-0 ${tone}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">
                  {value}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
                <Icon className="size-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label}>
            <Card className="glass-panel card-shine border-white/12 shadow-none ring-0 transition-transform duration-300 hover:-translate-y-0.5">
              <CardHeader className="pb-2">
                <CardDescription>{k.label}</CardDescription>
                <CardTitle className="font-heading text-2xl tabular-nums tracking-tight">
                  {k.value}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant="secondary"
                  className={
                    k.up === null
                      ? "bg-muted text-muted-foreground"
                      : k.up
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-white/10 bg-white/5"
                  }
                >
                  {k.delta}
                </Badge>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <DashboardAnalyticsSection
        locale={locale}
        portfolioSummary={portfolioSummary}
        assistantHref={assistantHref}
        agendaHasLive={agendaHasLive}
        todayCalendarEvents={todayCalendarEvents}
        agendaFallback={agendaFallback}
      />

      <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="font-heading">{t("radarTitle")}</CardTitle>
            <CardDescription>{t("radarSubtitle")}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/compare"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {t("radarOpenWatchlist")}
            </Link>
            <Link
              href={compareHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                radarItems.length < 2 ? "pointer-events-none opacity-50" : "",
              )}
              aria-disabled={radarItems.length < 2}
            >
              {t("radarOpenComparator")}
            </Link>
            <Link
              href={assistantHref}
              className={cn(
                buttonVariants({ size: "sm" }),
                "glow-ring",
                radarItems.length === 0 ? "pointer-events-none opacity-50" : "",
              )}
              aria-disabled={radarItems.length === 0}
            >
              {t("radarOpenAssistant")}
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {radarItems.length > 0 ? (
            <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div className="grid gap-3 md:grid-cols-3">
                <RadarMetric
                  label={t("radarSummaryHigh")}
                  value={String(radarHighCount)}
                  accent="text-amber-300"
                />
                <RadarMetric
                  label={t("radarSummaryLive")}
                  value={String(radarLiveCount)}
                  accent="text-sky-300"
                />
                <RadarMetric
                  label={t("radarSummaryNews")}
                  value={String(radarNewsCount)}
                  accent="text-emerald-300"
                />
              </div>
              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {t("briefingTitle")}
                  </p>
                  <div className="mt-3 space-y-3">
                    {briefingItems.length > 0 ? (
                      briefingItems.map((item) => (
                        <div
                          key={item.symbol}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold tracking-tight text-foreground">
                                {item.symbol}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {formatBriefingLine(item, t)}
                              </p>
                            </div>
                            <Badge className={attentionBadgeClass(item.attentionLevel)}>
                              {t(attentionLabelKey(item.attentionLevel))}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("briefingEmpty")}</p>
                    )}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      {t("alertCenterTitle")}
                    </p>
                    <Link
                      href="/alerts"
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "sm" }),
                        "h-auto px-0 py-0 text-xs text-primary hover:bg-transparent hover:text-primary/85",
                      )}
                    >
                      {t("alertCenterOpen")}
                    </Link>
                  </div>
                  <div className="mt-3 space-y-3">
                    {alertEvents.length > 0 ? (
                      alertEvents.map((event) => (
                        <div
                          key={`${event.symbol}-${event.kind}`}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold tracking-tight text-foreground">
                                {event.symbol}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {formatAlertCenterLine(event, t)}
                              </p>
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {t("alertCenterSince", {
                                  value: formatRelativeTime(event.previousCreatedAt, locale),
                                })}
                              </p>
                            </div>
                            <Badge className={attentionBadgeClass(event.attentionLevel)}>
                              {t(attentionLabelKey(event.attentionLevel))}
                            </Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">{t("alertCenterEmpty")}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {radarItems.length === 0 ? (
            <EmptyState icon={Bookmark} title={t("radarEmptyTitle")} description={t("radarEmptyLead")}>
              <Link href="/bolsa" className={cn(buttonVariants({ size: "lg" }), "glow-ring")}>
                {t("radarEmptyMarket")}
              </Link>
              <Link href="/compare" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("radarEmptyCompare")}
              </Link>
            </EmptyState>
          ) : (
            <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
              {radarItems.map(({ dossier, signal }) => {
                const move = dossier.quote.regularMarketChangePercent;
                const up = (move ?? 0) >= 0;
                return (
                  <div
                    key={dossier.symbol}
                    className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {dossier.symbol}
                        </p>
                        <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                          {dossier.companyName}
                        </p>
                      </div>
                      <Badge className={attentionBadgeClass(signal.attentionLevel)}>
                        {t(attentionLabelKey(signal.attentionLevel))}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {dossier.sector ?? t("radarNotAvailable")}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {t("radarPriorityValue", { value: signal.priority })} ·{" "}
                      {signal.reasons
                        .map((reason) => formatDashboardRadarReason(reason, t))
                        .join(" · ")}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <RadarMetric
                        label={t("radarMetricPrice")}
                        value={formatMoney(
                          dossier.quote.regularMarketPrice,
                          dossier.currency,
                          locale,
                        )}
                      />
                      <RadarMetric
                        label={t("radarMetricMove")}
                        value={formatSignedPercent(move)}
                        accent={up ? "text-emerald-400" : "text-rose-400"}
                      />
                      <RadarMetric
                        label={t("radarMetricVolume")}
                        value={formatCompactNumber(dossier.regularMarketVolume, locale)}
                      />
                      <RadarMetric
                        label={t("radarMetricNews")}
                        value={String(dossier.relatedNews.length)}
                      />
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link
                        href={`/ativo/${dossier.symbol}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        {t("radarOpenAsset")}
                      </Link>
                      <Link
                        href={buildPortfolioHref(dossier.symbol, {
                          price: dossier.quote.regularMarketPrice,
                        })}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        <Wallet className="size-3.5" />
                        {t("radarPortfolioCta")}
                      </Link>
                      <Link
                        href={`/compare?symbols=${encodeURIComponent(dossier.symbol)}`}
                        className={buttonVariants({ variant: "ghost", size: "sm" })}
                      >
                        {t("radarOpenSingleCompare")}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RadarMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-lg font-semibold tracking-tight text-foreground", accent)}>
        {value}
      </p>
    </div>
  );
}

function buildCompareHref(symbols: string[]) {
  const clean = [...new Set(symbols)].slice(0, 4);
  if (clean.length === 0) return "/compare";
  return `/compare?symbols=${encodeURIComponent(clean.join(","))}`;
}

function buildDashboardAssistantHref(symbols: string[], locale: string) {
  const clean = [...new Set(symbols)].slice(0, 4);
  const label = clean.join(", ");
  const prompt =
    locale === "pt-BR"
      ? clean.length >= 2
        ? `Priorize a minha watchlist ${label} e explique quais ativos merecem mais atenção hoje, considerando variação, liquidez, contexto e notícias relacionadas.`
        : `Analise a minha watchlist e diga quais ativos merecem mais atenção hoje, considerando variação, liquidez, contexto e notícias relacionadas.`
      : clean.length >= 2
        ? `Prioritize my watchlist ${label} and explain which assets deserve more attention today considering move, liquidity, context and related news.`
        : `Analyze my watchlist and explain which assets deserve more attention today considering move, liquidity, context and related news.`;

  const params = new URLSearchParams({
    channel: "equities",
    audience: "pf",
    open: "1",
    prompt,
  });
  if (clean[0]) {
    params.set("asset", clean[0]);
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

function formatDashboardRadarReason(
  reason: WatchlistRadarReason,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  switch (reason.code) {
    case "large_move":
      return t("radarReasonLargeMove", { value: (reason.value ?? 0).toFixed(1) });
    case "news_flow":
      return t("radarReasonNewsFlow", { value: Math.round(reason.value ?? 0) });
    case "near_52w_high":
      return t("radarReasonNearHigh");
    case "near_52w_low":
      return t("radarReasonNearLow");
    case "live_history":
      return t("radarReasonLive");
    case "liquid":
      return t("radarReasonLiquid");
    default:
      return t("radarReasonLive");
  }
}

function formatBriefingLine(
  item: ReturnType<typeof buildWatchlistBriefing>[number],
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  switch (item.kind) {
    case "attention_up":
      return t("briefingAttentionUp", {
        symbol: item.symbol,
        value: item.delta ?? item.priority,
      });
    case "fresh_news":
      return t("briefingFreshNews", {
        symbol: item.symbol,
        value: item.newsCount,
      });
    case "range_extreme":
      return t("briefingRangeExtreme", {
        symbol: item.symbol,
      });
    case "steady_high":
      return t("briefingSteadyHigh", {
        symbol: item.symbol,
      });
    default:
      return t("briefingBaseline", {
        symbol: item.symbol,
      });
  }
}

function formatAlertCenterLine(
  item: ReturnType<typeof buildWatchlistAlertCenter>[number],
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  switch (item.kind) {
    case "attention_up":
      return t("alertCenterAttentionUp", {
        symbol: item.symbol,
        value: item.delta ?? item.priority,
      });
    case "fresh_news":
      return t("alertCenterFreshNews", {
        symbol: item.symbol,
        value: item.newsCount,
      });
    case "range_extreme":
      return t("alertCenterRangeExtreme", {
        symbol: item.symbol,
      });
    case "steady_high":
      return t("alertCenterSteadyHigh", {
        symbol: item.symbol,
      });
    default:
      return t("alertCenterBaseline", {
        symbol: item.symbol,
      });
  }
}

function attentionLabelKey(level: WatchlistAttentionLevel) {
  switch (level) {
    case "high":
      return "radarAttentionHigh";
    case "medium":
      return "radarAttentionMedium";
    default:
      return "radarAttentionBaseline";
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
