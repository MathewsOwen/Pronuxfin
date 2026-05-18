import type { ReactNode } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Globe2,
  Landmark,
  Newspaper,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { formatRelativeTime } from "@/lib/market/time";
import type {
  AssetDossier,
  AssetHistoryPoint,
  IntlAnnualStatementsSnapshot,
  IntlKeyMetricsTtm,
} from "@/lib/market/types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  DossierCalendarYearsSection,
  DossierComparablePeers,
  DossierDividendsSection,
  DossierMarketRatiosSection,
  DossierPeriodReturnsSection,
  DossierRiskMetricsSection,
  DossierSectionNav,
  DossierSessionTradingSection,
  type AssetDossierSectionLabels,
} from "@/components/market/asset-dossier-sections";
import { dividendInsightsHasData } from "@/lib/market/asset-dossier-dividends";
import { marketExtrasHasDisplayData } from "@/lib/market/asset-dossier-market-extras";
import { WatchlistToggleButton } from "@/components/market/watchlist-toggle-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buildPortfolioHref } from "@/lib/market/portfolio-links";
import type { UserPortfolioPositionView } from "@/lib/user-portfolio/load";
import type { PortfolioPositionSnapshot } from "@/lib/user-portfolio/snapshot";
import { cn } from "@/lib/utils";

export async function AssetTerminalPage({
  dossier,
  locale,
  watchlisted,
  portfolioPosition = null,
  portfolioSnapshot = null,
}: {
  dossier: AssetDossier;
  locale: string;
  watchlisted: boolean;
  portfolioPosition?: UserPortfolioPositionView | null;
  portfolioSnapshot?: PortfolioPositionSnapshot | null;
}) {
  const t = await getTranslations("AssetTerminal");
  const ins = dossier.historicalInsights;
  const price = dossier.quote.regularMarketPrice;
  const pct = dossier.quote.regularMarketChangePercent;
  const up = pct != null && pct >= 0;
  const rangeProgress = computeRangeProgress(
    dossier.fiftyTwoWeekLow,
    dossier.fiftyTwoWeekHigh,
    dossier.quote.regularMarketPrice,
  );
  const chartTrend = computeChartTrend(dossier.history);
  const assistantHref = buildAssistantAssetHref(dossier);
  const compareHref = buildCompareAssetHref(dossier);
  const portfolioHref = buildPortfolioAssetHref(dossier, portfolioPosition);
  const hasPortfolioPosition = portfolioPosition != null;
  const sectionLabels = buildSectionLabels(t);
  const showRatios = marketExtrasHasDisplayData(dossier.marketExtras);
  const showCalendar = ins.calendarYearReturns.length > 0;
  const showDividends = dividendInsightsHasData(dossier.dividends);
  const fundamentalsTitle =
    dossier.intlKeyMetricsTtm && intlFundamentalsHasData(dossier.intlKeyMetricsTtm)
      ? dossier.region === "br"
        ? t("fundamentalsTitleBr")
        : t("fundamentalsTitle")
      : null;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)] md:px-8">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-primary/25 bg-primary/10 text-primary">
            {t("heroPillPrivate")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {dossier.region === "br" ? t("regionBr") : t("regionIntl")}
          </Badge>
          <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
            {dossier.historyMode === "live" ? t("historyLive") : t("historyIndicative")}
          </Badge>
        </div>

        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <AssetAvatar dossier={dossier} />
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {dossier.symbol}
                </p>
                <h1 className="font-heading truncate text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {dossier.companyName}
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-3xl leading-relaxed text-muted-foreground">
              {dossier.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dossier.sector ? (
                <Badge className="border-amber-500/25 bg-amber-950/20 text-amber-100">
                  {dossier.sector}
                </Badge>
              ) : null}
              {dossier.industry ? (
                <Badge className="border-sky-500/25 bg-sky-950/20 text-sky-100">
                  {dossier.industry}
                </Badge>
              ) : null}
              <Badge className="border-white/10 bg-white/[0.04] text-muted-foreground">
                {t("sourceLabel", { source: dossier.sourceLabel })}
              </Badge>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <WatchlistToggleButton symbol={dossier.symbol} initialSaved={watchlisted} />
              <Link
                href={portfolioHref}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <Wallet className="size-4" />
                {hasPortfolioPosition ? t("portfolioUpdateCta") : t("portfolioCta")}
              </Link>
              <Link
                href={compareHref}
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                <ArrowUpRight className="size-4" />
                {t("compareCta")}
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 px-5 py-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]">
            <p className="text-sm text-muted-foreground">{t("lastPrice")}</p>
            <p className="font-heading mt-1 text-4xl font-semibold tracking-tight text-foreground">
              {formatMoney(price, dossier.currency, locale)}
            </p>
            <div
              className={cn(
                "mt-2 flex items-center gap-2 text-sm font-semibold",
                pct == null ? "text-muted-foreground" : up ? "text-emerald-400" : "text-rose-400",
              )}
            >
              {pct != null ? (
                up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />
              ) : null}
              <span>{formatSignedMoney(dossier.quote.regularMarketChange, dossier.currency, locale)}</span>
              <span>{formatSignedPercent(pct)}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {t("lastUpdate", {
                value: formatRelativeTime(dossier.quote.marketTime ?? null, locale),
              })}
            </p>
          </div>
        </div>
      </header>

      {portfolioSnapshot ? (
        <TerminalPortfolioStrip
          snapshot={portfolioSnapshot}
          locale={locale}
          portfolioHref={portfolioHref}
        />
      ) : null}

      <DossierSectionNav
        labels={sectionLabels}
        showRatios={showRatios}
        showCalendar={showCalendar}
        showDividends={showDividends}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SignalCard
          label={t("signalRangeLabel")}
          value={t("signalRangeValue", {
            value: `${rangeProgress}%`,
          })}
          tone="border-sky-500/25 bg-sky-950/16"
        />
        <SignalCard
          label={t("signalVolumeLabel")}
          value={formatCompactNumber(dossier.regularMarketVolume, locale)}
          tone="border-amber-500/25 bg-amber-950/16"
        />
        <SignalCard
          label={t("signalContextLabel")}
          value={dossier.relatedNews.length > 0 ? t("signalContextLinked") : t("signalContextBuilding")}
          tone="border-emerald-500/25 bg-emerald-950/16"
        />
      </div>

      <DossierSessionTradingSection dossier={dossier} locale={locale} labels={sectionLabels} />
      <DossierPeriodReturnsSection stats={dossier.periodStats} labels={sectionLabels} />
      <DossierMarketRatiosSection dossier={dossier} locale={locale} labels={sectionLabels} />
      <DossierDividendsSection
        insights={dossier.dividends}
        currency={dossier.currency}
        locale={locale}
        labels={sectionLabels}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.85fr)]">
        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="font-heading">{t("chartTitle")}</CardTitle>
            <CardDescription>{t("chartSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <AssetPriceChart history={dossier.history} positive={chartTrend >= 0} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <MiniMetric
                label={t("chartStart")}
                value={formatMoney(dossier.history[0]?.close ?? null, dossier.currency, locale)}
              />
              <MiniMetric
                label={t("chartCurrent")}
                value={formatMoney(dossier.history.at(-1)?.close ?? null, dossier.currency, locale)}
              />
              <MiniMetric
                label={t("chartPerformance")}
                value={formatSignedPercent(chartTrend)}
                accent={chartTrend >= 0 ? "text-emerald-400" : "text-rose-400"}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
            <CardHeader>
              <CardTitle className="font-heading">{t("profileTitle")}</CardTitle>
              <CardDescription>{t("profileSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProfileRow
                icon={CalendarDays}
                label={t("profileFounded")}
                value={dossier.foundedYear ? String(dossier.foundedYear) : t("notAvailable")}
              />
              <ProfileRow
                icon={Building2}
                label={t("profileHeadquarters")}
                value={dossier.headquarters ?? t("notAvailable")}
              />
              <ProfileRow
                icon={ShieldCheck}
                label={t("profileSector")}
                value={dossier.sector ?? t("notAvailable")}
              />
              <ProfileRow
                icon={Building2}
                label={t("profileIndustry")}
                value={dossier.industry ?? t("notAvailable")}
              />
              <ProfileRow
                icon={Landmark}
                label={t("profileExchange")}
                value={dossier.exchange ?? t("notAvailable")}
              />
              <ProfileRow
                icon={Globe2}
                label={t("profileCountry")}
                value={dossier.country ?? t("notAvailable")}
              />
              <ProfileRow
                icon={CalendarDays}
                label={t("profileIpo")}
                value={
                  dossier.ipoDate
                    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(dossier.ipoDate),
                      )
                    : t("notAvailable")
                }
              />
              <ProfileRow
                icon={ArrowUpRight}
                label={t("profileWebsite")}
                value={
                  dossier.website ? (
                    <a
                      href={dossier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <span>{formatWebsiteLabel(dossier.website)}</span>
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  ) : (
                    t("notAvailable")
                  )
                }
              />
              {dossier.ceoName ? (
                <ProfileRow
                  icon={UserRound}
                  label={t("profileCeo")}
                  value={dossier.ceoName}
                />
              ) : null}
              {dossier.fullTimeEmployees != null ? (
                <ProfileRow
                  icon={Users}
                  label={t("profileEmployees")}
                  value={
                    dossier.fullTimeEmployees != null && Number.isFinite(dossier.fullTimeEmployees)
                      ? new Intl.NumberFormat(locale, {
                          maximumFractionDigits: 0,
                        }).format(dossier.fullTimeEmployees)
                      : t("notAvailable")
                  }
                />
              ) : null}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
                {t("profileCoverage", {
                  source: dossier.sourceLabel,
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
            <CardHeader>
              <CardTitle className="font-heading">{t("valuationTitle")}</CardTitle>
              <CardDescription>{t("valuationSubtitle")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <MiniMetric
                label={t("valuationMarketCap")}
                value={formatCompactMoney(dossier.marketCap, dossier.currency, locale)}
              />
              <MiniMetric
                label={t("valuationVolume")}
                value={formatCompactNumber(dossier.regularMarketVolume, locale)}
              />
              <MiniMetric
                label={t("valuationPe")}
                value={formatMultiple(dossier.priceEarnings)}
              />
              <MiniMetric
                label={t("valuationEps")}
                value={formatMoney(dossier.earningsPerShare, dossier.currency, locale)}
              />
            </CardContent>
          </Card>

          {fundamentalsTitle ? (
            <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
              <CardHeader>
                <CardTitle className="font-heading">{fundamentalsTitle}</CardTitle>
                <CardDescription>{t("fundamentalsSubtitle")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <MiniMetric
                  label={t("fundDividendYield")}
                  value={formatPercentFromMaybeDecimal(
                    dossier.intlKeyMetricsTtm!.dividendYield,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundPeTtm")}
                  value={formatMultiple(dossier.intlKeyMetricsTtm!.peRatio)}
                />
                <MiniMetric
                  label={t("fundMarketCapTtm")}
                  value={formatCompactMoney(
                    dossier.intlKeyMetricsTtm!.marketCap,
                    dossier.currency,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundEnterpriseValue")}
                  value={formatCompactMoney(
                    dossier.intlKeyMetricsTtm!.enterpriseValue,
                    dossier.currency,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundRevenuePerShare")}
                  value={formatMoney(
                    dossier.intlKeyMetricsTtm!.revenuePerShare,
                    dossier.currency,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundNetIncomePerShare")}
                  value={formatMoney(
                    dossier.intlKeyMetricsTtm!.netIncomePerShare,
                    dossier.currency,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundOcfPerShare")}
                  value={formatMoney(
                    dossier.intlKeyMetricsTtm!.operatingCashFlowPerShare,
                    dossier.currency,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundFcfPerShare")}
                  value={formatMoney(
                    dossier.intlKeyMetricsTtm!.freeCashFlowPerShare,
                    dossier.currency,
                    locale,
                  )}
                />
                <MiniMetric
                  label={t("fundRoe")}
                  value={formatPercentFromMaybeDecimal(dossier.intlKeyMetricsTtm!.roe, locale)}
                />
                <MiniMetric
                  label={t("fundDebtToEquity")}
                  value={formatRatioPlain(dossier.intlKeyMetricsTtm!.debtToEquity)}
                />
                <MiniMetric
                  label={t("fundCurrentRatio")}
                  value={formatRatioPlain(dossier.intlKeyMetricsTtm!.currentRatio)}
                />
              </CardContent>
              <div className="border-t border-white/10 px-6 pb-4 text-xs text-muted-foreground">
                {t("fundSource", { source: dossier.intlKeyMetricsTtm!.sourceLabel })}
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {intlStatementsHasData(dossier.intlAnnualStatements) ? (
        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="rounded-xl border border-primary/25 bg-primary/10 p-2.5 text-primary">
                  <Scale className="size-5 shrink-0" aria-hidden />
                </div>
                <div className="min-w-0">
                  <CardTitle className="font-heading">{t("statementsTitle")}</CardTitle>
                  <CardDescription className="mt-2 max-w-3xl leading-relaxed">
                    {t("statementsSubtitle")}
                  </CardDescription>
                </div>
              </div>
              {dossier.intlAnnualStatements?.periodLabel ? (
                <Badge className="shrink-0 border-white/15 bg-white/[0.06] font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {dossier.intlAnnualStatements.periodLabel}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniMetric
              label={t("stmtRevenue")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.revenue,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtGrossProfit")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.grossProfit,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtOperatingIncome")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.operatingIncome,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtNetIncome")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.netIncome,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtTotalAssets")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.totalAssets,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtTotalDebt")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.totalDebt,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtTotalEquity")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.totalEquity,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtCash")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.cashAndEquivalents,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtOperatingCf")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.operatingCashFlow,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtCapex")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.capex,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
            <MiniMetric
              label={t("stmtFreeCashFlow")}
              value={formatCompactMoney(
                dossier.intlAnnualStatements!.freeCashFlow,
                dossier.intlAnnualStatements!.reportedCurrency ?? dossier.currency,
                locale,
              )}
            />
          </CardContent>
          <div className="space-y-2 border-t border-white/10 px-6 py-4 text-xs leading-relaxed text-muted-foreground">
            <p>{t("statementsDisclaimer")}</p>
            <p className="font-mono text-[10px] uppercase tracking-wider opacity-90">
              {t("fundSource", { source: dossier.intlAnnualStatements!.sourceLabel })}
            </p>
          </div>
        </Card>
      ) : null}

      <DossierCalendarYearsSection rows={ins.calendarYearReturns} labels={sectionLabels} />
      <DossierRiskMetricsSection stats={dossier.periodStats} labels={sectionLabels} />

      <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
        <CardHeader>
          <CardTitle className="font-heading">{t("termsTitle")}</CardTitle>
          <CardDescription>{t("termsSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {t("termsActivityLead")}
            </p>
            <p className="text-sm leading-relaxed text-foreground/95">{dossier.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MiniMetric label={t("profileSector")} value={dossier.sector ?? t("notAvailable")} />
            <MiniMetric label={t("profileIndustry")} value={dossier.industry ?? t("notAvailable")} />
            <MiniMetric label={t("profileExchange")} value={dossier.exchange ?? t("notAvailable")} />
            <MiniMetric label={t("profileCountry")} value={dossier.country ?? t("notAvailable")} />
            <MiniMetric
              label={t("profileHeadquarters")}
              value={dossier.headquarters ?? t("notAvailable")}
            />
            <MiniMetric
              label={t("profileIpo")}
              value={
                dossier.ipoDate
                  ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                      new Date(dossier.ipoDate),
                    )
                  : t("notAvailable")
              }
            />
          </div>

          <div className="rounded-2xl border border-amber-500/15 bg-amber-950/10 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
            {t("termsSubsidiariesNote")}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {t("termsPeersTitle")}
            </p>
            <p className="text-xs text-muted-foreground">{t("termsPeersDisclaimer")}</p>
            <DossierComparablePeers peers={dossier.comparablePeers} emptyLabel={t("termsPeersEmpty")} />
          </div>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {t("termsCalendarTitle")}
            </p>
            <p className="text-xs text-muted-foreground">{t("termsCalendarDisclaimer")}</p>
            {ins.historyDepthLimited ? (
              <p className="text-xs text-amber-200/90">{t("termsHistoryLimited")}</p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric
                label={t("termsBestYear")}
                value={
                  ins.bestCalendarYear
                    ? `${ins.bestCalendarYear.year} · ${formatSignedPercent(ins.bestCalendarYear.returnPct)}`
                    : t("notAvailable")
                }
                accent="text-emerald-400"
              />
              <MiniMetric
                label={t("termsWorstYear")}
                value={
                  ins.worstCalendarYear
                    ? `${ins.worstCalendarYear.year} · ${formatSignedPercent(ins.worstCalendarYear.returnPct)}`
                    : t("notAvailable")
                }
                accent="text-rose-400"
              />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {t("termsNegativeYears")}
              </p>
              <p className="mt-2 font-mono text-sm text-foreground">
                {ins.negativeReturnYears.length > 0
                  ? ins.negativeReturnYears.join(", ")
                  : t("termsNegativeYearsNone")}
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-6">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {t("termsVolumeYearsTitle")}
            </p>
            {ins.volumeDataPartial ? (
              <p className="text-xs text-amber-200/90">{t("termsVolumePartial")}</p>
            ) : null}
            {ins.topVolumeYears.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                {ins.topVolumeYears.map((row, index) => (
                  <MiniMetric
                    key={row.year}
                    label={`${row.year} · #${index + 1}`}
                    value={formatCompactNumber(row.totalVolume, locale)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("notAvailable")}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="font-heading">{t("movesTitle")}</CardTitle>
            <CardDescription>{t("movesSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <MoveCard
              title={t("bestMove")}
              move={dossier.bestMove}
              currency={dossier.currency}
              locale={locale}
              tone="border-emerald-500/20 bg-emerald-950/16"
            />
            <MoveCard
              title={t("worstMove")}
              move={dossier.worstMove}
              currency={dossier.currency}
              locale={locale}
              tone="border-rose-500/20 bg-rose-950/16"
            />
            <StatCard
              label={t("statDayRange")}
              value={joinRange(
                formatMoney(dossier.regularMarketDayLow, dossier.currency, locale),
                formatMoney(dossier.regularMarketDayHigh, dossier.currency, locale),
              )}
            />
            <StatCard
              label={t("statOpenClose")}
              value={joinRange(
                formatMoney(dossier.regularMarketOpen, dossier.currency, locale),
                formatMoney(dossier.regularMarketPreviousClose, dossier.currency, locale),
              )}
            />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-muted-foreground">{t("stat52Week")}</span>
                <span className="font-mono text-foreground">
                  {formatMoney(dossier.fiftyTwoWeekLow, dossier.currency, locale)} /{" "}
                  {formatMoney(dossier.fiftyTwoWeekHigh, dossier.currency, locale)}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/8">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-primary/35 via-primary to-amber-400"
                  style={{ width: `${rangeProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="font-heading">{t("newsTitle")}</CardTitle>
            <CardDescription>{t("newsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dossier.relatedNews.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-muted-foreground">
                {t("newsEmpty")}
              </div>
            ) : (
              dossier.relatedNews.map((article) => (
                <a
                  key={article.id}
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-primary/25 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                      <Newspaper className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium leading-snug text-foreground group-hover:text-primary">
                        {article.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {article.source}
                        {article.publishedAt
                          ? ` · ${new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(article.publishedAt))}`
                          : ""}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {article.summary}
                      </p>
                    </div>
                  </div>
                </a>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-6 py-6 shadow-[inset_0_1px_0_oklch(1_0_0/0.05)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
              {t("assistantTitle")}
            </p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("assistantLead", { symbol: dossier.symbol })}
            </p>
          </div>
          <Link
            href={assistantHref}
            className={cn(buttonVariants({ size: "lg" }), "glow-ring h-11")}
          >
            {t("assistantCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function intlStatementsHasData(m: IntlAnnualStatementsSnapshot | null) {
  if (!m) return false;
  const nums = [
    m.revenue,
    m.grossProfit,
    m.operatingIncome,
    m.netIncome,
    m.totalAssets,
    m.totalDebt,
    m.totalEquity,
    m.cashAndEquivalents,
    m.operatingCashFlow,
    m.capex,
    m.freeCashFlow,
  ];
  return nums.some((v) => v != null && Number.isFinite(v));
}

function intlFundamentalsHasData(m: IntlKeyMetricsTtm | null) {
  if (!m) return false;
  const nums = [
    m.dividendYield,
    m.peRatio,
    m.marketCap,
    m.enterpriseValue,
    m.revenuePerShare,
    m.netIncomePerShare,
    m.operatingCashFlowPerShare,
    m.freeCashFlowPerShare,
    m.roe,
    m.debtToEquity,
    m.currentRatio,
  ];
  return nums.some((v) => v != null && Number.isFinite(v));
}

function formatPercentFromMaybeDecimal(value: number | null | undefined, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const fraction = abs <= 1 ? value : value / 100;
  return new Intl.NumberFormat(locale, {
    style: "percent",
    maximumFractionDigits: 2,
  }).format(fraction);
}

function formatRatioPlain(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function SignalCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className={`glass-panel card-shine rounded-3xl border px-5 py-4 shadow-none ring-0 ${tone}`}>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function AssetAvatar({ dossier }: { dossier: AssetDossier }) {
  if (dossier.quote.imageUrl) {
    return (
      <span className="relative inline-flex size-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-[0_8px_20px_oklch(0_0_0/0.18)]">
        <Image src={dossier.quote.imageUrl} alt="" fill sizes="56px" className="object-cover" />
      </span>
    );
  }

  return (
    <span className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 font-mono text-sm font-semibold tracking-wide text-primary">
      {dossier.symbol.slice(0, 3)}
    </span>
  );
}

function AssetPriceChart({
  history,
  positive,
}: {
  history: AssetHistoryPoint[];
  positive: boolean;
}) {
  const points = buildChartPoints(history, 640, 240);
  const stroke = positive ? "oklch(0.74 0.15 154)" : "oklch(0.72 0.16 20)";
  const fill = positive
    ? "rgba(16, 185, 129, 0.14)"
    : "rgba(244, 63, 94, 0.14)";

  return (
    <svg viewBox="0 0 640 240" className="h-[240px] w-full" role="img" aria-label="Asset price chart">
      <defs>
        <linearGradient id="asset-chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="640" height="240" rx="18" fill="rgba(255,255,255,0.02)" />
      {[48, 120, 192].map((y) => (
        <line key={y} x1="0" x2="640" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="6 8" />
      ))}
      <path d={`${points.areaPath} L 640 220 L 0 220 Z`} fill="url(#asset-chart-fill)" />
      <path d={points.linePath} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

function MoveCard({
  title,
  move,
  currency,
  locale,
  tone,
}: {
  title: string;
  move: { date: string; percent: number; close: number } | null;
  currency: string;
  locale: string;
  tone: string;
}) {
  const up = (move?.percent ?? 0) >= 0;
  return (
    <div className={`rounded-2xl border p-4 ${tone}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p
        className={cn(
          "font-heading mt-2 text-3xl font-semibold tracking-tight",
          move
            ? up
              ? "text-emerald-300"
              : "text-rose-300"
            : "text-foreground",
        )}
      >
        {move ? formatSignedPercent(move.percent) : "—"}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {move
          ? `${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(move.date))} · ${formatMoney(move.close, currency, locale)}`
          : "—"}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-heading mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-heading text-xl font-semibold tracking-tight text-foreground", accent)}>
        {value}
      </p>
    </div>
  );
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

function formatSignedMoney(value: number | null | undefined, currency: string, locale: string) {
  if (value == null || !Number.isFinite(value)) return "—";
  const formatted = formatMoney(Math.abs(value), currency, locale);
  return `${value >= 0 ? "+" : "-"}${formatted}`;
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

function computeRangeProgress(low: number | null, high: number | null, current: number | null) {
  if (low == null || high == null || current == null || high <= low) return 50;
  const raw = ((current - low) / (high - low)) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function computeChartTrend(history: AssetHistoryPoint[]) {
  const start = history[0]?.close;
  const end = history.at(-1)?.close;
  if (!start || !end) return 0;
  return ((end - start) / start) * 100;
}

function buildChartPoints(history: AssetHistoryPoint[], width: number, height: number) {
  const safe = history.length > 1 ? history : [{ date: "", close: 0 }, { date: "", close: 0 }];
  const values = safe.map((point) => point.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const yRange = max - min || 1;
  const xStep = width / Math.max(safe.length - 1, 1);
  const topPadding = 20;
  const bottomPadding = 20;
  const plotHeight = Math.max(height - topPadding - bottomPadding, 1);

  const points = safe.map((point, index) => {
    const x = index * xStep;
    const y = topPadding + (1 - (point.close - min) / yRange) * plotHeight;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return {
    linePath: points.join(" "),
    areaPath: points.join(" "),
  };
}

function joinRange(start: string, end: string) {
  if (start === "—" && end === "—") return "—";
  return `${start} / ${end}`;
}

function buildAssistantAssetHref(dossier: AssetDossier) {
  const prompt =
    dossier.region === "br"
      ? `Analise ${dossier.symbol} (${dossier.companyName}) para um investidor pessoa fisica. Considere preco atual, range de 52 semanas, liquidez, noticias relacionadas e os principais riscos.`
      : `Analyze ${dossier.symbol} (${dossier.companyName}) for a retail investor. Consider current price, 52-week range, liquidity, related news and the main risks.`;

  const params = new URLSearchParams({
    channel: "equities",
    audience: "pf",
    open: "1",
    asset: dossier.symbol,
    prompt,
  });
  return `/assistant?${params.toString()}`;
}

function buildCompareAssetHref(dossier: AssetDossier) {
  const params = new URLSearchParams({
    symbols: dossier.symbol,
  });
  return `/compare?${params.toString()}`;
}

function buildPortfolioAssetHref(
  dossier: AssetDossier,
  position?: UserPortfolioPositionView | null,
) {
  return buildPortfolioHref(dossier.symbol, {
    price: dossier.quote.regularMarketPrice,
    quantity: position?.quantity ?? null,
    averageCost: position?.averageCost ?? null,
  });
}

async function TerminalPortfolioStrip({
  snapshot,
  locale,
  portfolioHref,
}: {
  snapshot: PortfolioPositionSnapshot;
  locale: string;
  portfolioHref: string;
}) {
  const t = await getTranslations("AssetTerminal");
  const { position } = snapshot;
  const currency = position.currency;
  const totalUp = (snapshot.totalPnl ?? 0) >= 0;
  const dayUp = (snapshot.dayPnl ?? 0) >= 0;

  return (
    <Card className="glass-panel border-primary/25 bg-primary/[0.06] shadow-none ring-0">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="font-heading text-lg">{t("portfolioPositionTitle")}</CardTitle>
          <CardDescription>{t("portfolioPositionDisclaimer")}</CardDescription>
        </div>
        <Link href={portfolioHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Wallet className="size-4" />
          {t("portfolioUpdateCta")}
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <PortfolioKpi
            label={t("portfolioPositionQty")}
            value={new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(
              position.quantity,
            )}
          />
          <PortfolioKpi
            label={t("portfolioPositionCost")}
            value={formatMoney(position.averageCost, currency, locale)}
          />
          <PortfolioKpi
            label={t("portfolioPositionValue")}
            value={formatMoney(snapshot.marketValue, currency, locale)}
          />
          <PortfolioKpi
            label={t("portfolioPositionPnl")}
            value={formatMoney(snapshot.totalPnl, currency, locale)}
            delta={formatSignedPercent(snapshot.totalPnlPercent)}
            positive={totalUp}
          />
          <PortfolioKpi
            label={t("portfolioPositionDayPnl")}
            value={formatMoney(snapshot.dayPnl, currency, locale)}
            delta={formatSignedPercent(snapshot.dayPnlPercent)}
            positive={dayUp}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PortfolioKpi({
  label,
  value,
  delta,
  positive,
}: {
  label: string;
  value: string;
  delta?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading mt-1 text-lg font-semibold text-foreground">{value}</p>
      {delta ? (
        <p
          className={cn(
            "mt-0.5 text-xs font-semibold",
            positive == null
              ? "text-muted-foreground"
              : positive
                ? "text-emerald-400"
                : "text-rose-400",
          )}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

function buildSectionLabels(
  t: (key: string) => string,
): AssetDossierSectionLabels {
  return {
    navSession: t("navSession"),
    navReturns: t("navReturns"),
    navRatios: t("navRatios"),
    navCalendar: t("navCalendar"),
    navRisk: t("navRisk"),
    navDividends: t("navDividends"),
    sessionTitle: t("sessionTitle"),
    sessionSubtitle: t("sessionSubtitle"),
    sessionOpen: t("sessionOpen"),
    sessionPreviousClose: t("sessionPreviousClose"),
    sessionDayHigh: t("sessionDayHigh"),
    sessionDayLow: t("sessionDayLow"),
    sessionVolume: t("sessionVolume"),
    sessionChangeVsPrev: t("sessionChangeVsPrev"),
    sessionFrom52High: t("sessionFrom52High"),
    sessionFrom52Low: t("sessionFrom52Low"),
    sessionAvgVol20: t("sessionAvgVol20"),
    returnsTitle: t("returnsTitle"),
    returnsSubtitle: t("returnsSubtitle"),
    returnYtd: t("returnYtd"),
    return1m: t("return1m"),
    return3m: t("return3m"),
    return6m: t("return6m"),
    return1y: t("return1y"),
    return3y: t("return3y"),
    return5y: t("return5y"),
    returnWindow: t("returnWindow"),
    returnsTradingDays: t("returnsTradingDays"),
    ratiosTitle: t("ratiosTitle"),
    ratiosSubtitle: t("ratiosSubtitle"),
    ratioBeta: t("ratioBeta"),
    ratioPb: t("ratioPb"),
    ratioDivYield: t("ratioDivYield"),
    ratioDivRate: t("ratioDivRate"),
    ratioMargin: t("ratioMargin"),
    ratioRoe: t("ratioRoe"),
    ratioRoa: t("ratioRoa"),
    ratioDebtEquity: t("ratioDebtEquity"),
    ratioPayout: t("ratioPayout"),
    ratioBookValue: t("ratioBookValue"),
    ratioEv: t("ratioEv"),
    ratioForwardPe: t("ratioForwardPe"),
    ratioPeg: t("ratioPeg"),
    ratioShares: t("ratioShares"),
    ratioFloat: t("ratioFloat"),
    calendarTitle: t("calendarTitle"),
    calendarSubtitle: t("calendarSubtitle"),
    calendarYear: t("calendarYear"),
    calendarReturn: t("calendarReturn"),
    riskTitle: t("riskTitle"),
    riskSubtitle: t("riskSubtitle"),
    riskMaxDrawdown: t("riskMaxDrawdown"),
    riskVolatility: t("riskVolatility"),
    dividendsTitle: t("dividendsTitle"),
    dividendsSubtitle: t("dividendsSubtitle"),
    dividendsTtmTotal: t("dividendsTtmTotal"),
    dividendsTtmYield: t("dividendsTtmYield"),
    dividendsPayments12m: t("dividendsPayments12m"),
    dividendsPayments24m: t("dividendsPayments24m"),
    dividendsNextPayment: t("dividendsNextPayment"),
    dividendsYieldSnapshot: t("dividendsYieldSnapshot"),
    dividendsByYearTitle: t("dividendsByYearTitle"),
    dividendsTableType: t("dividendsTableType"),
    dividendsTableEx: t("dividendsTableEx"),
    dividendsTablePay: t("dividendsTablePay"),
    dividendsTableAmount: t("dividendsTableAmount"),
    dividendsEmpty: t("dividendsEmpty"),
    dividendsDisclaimer: t("dividendsDisclaimer"),
    dividendsSource: t("dividendsSource"),
    notAvailable: t("notAvailable"),
  };
}

function formatWebsiteLabel(value: string) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}
