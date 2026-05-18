import { Link } from "@/i18n/navigation";
import { marketExtrasHasDisplayData } from "@/lib/market/asset-dossier-market-extras";
import type {
  AssetDossier,
  AssetDossierPeriodStats,
  CalendarYearReturn,
} from "@/lib/market/types";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DossierCalendarChart } from "@/components/market/dossier-calendar-chart";
import { cn } from "@/lib/utils";

export type AssetDossierSectionLabels = {
  navSession: string;
  navReturns: string;
  navRatios: string;
  navCalendar: string;
  navRisk: string;
  navDividends: string;
  sessionTitle: string;
  sessionSubtitle: string;
  sessionOpen: string;
  sessionPreviousClose: string;
  sessionDayHigh: string;
  sessionDayLow: string;
  sessionVolume: string;
  sessionChangeVsPrev: string;
  sessionFrom52High: string;
  sessionFrom52Low: string;
  sessionAvgVol20: string;
  returnsTitle: string;
  returnsSubtitle: string;
  returnYtd: string;
  return1m: string;
  return3m: string;
  return6m: string;
  return1y: string;
  return3y: string;
  return5y: string;
  returnWindow: string;
  returnsTradingDays: string;
  ratiosTitle: string;
  ratiosSubtitle: string;
  ratioBeta: string;
  ratioPb: string;
  ratioDivYield: string;
  ratioDivRate: string;
  ratioMargin: string;
  ratioRoe: string;
  ratioRoa: string;
  ratioDebtEquity: string;
  ratioPayout: string;
  ratioBookValue: string;
  ratioEv: string;
  ratioForwardPe: string;
  ratioPeg: string;
  ratioShares: string;
  ratioFloat: string;
  calendarTitle: string;
  calendarSubtitle: string;
  calendarYear: string;
  calendarReturn: string;
  riskTitle: string;
  riskSubtitle: string;
  riskMaxDrawdown: string;
  riskVolatility: string;
  dividendsTitle: string;
  dividendsSubtitle: string;
  dividendsTtmTotal: string;
  dividendsTtmYield: string;
  dividendsPayments12m: string;
  dividendsPayments24m: string;
  dividendsNextPayment: string;
  dividendsYieldSnapshot: string;
  dividendsByYearTitle: string;
  dividendsByYearSubtitle: string;
  dividendsYieldByYearTitle: string;
  dividendsYieldByYearSubtitle: string;
  dividendsYieldEmpty: string;
  dividendsYieldHint: string;
  dividendsFilterAll: string;
  dividendsFilterDividend: string;
  dividendsFilterJcp: string;
  dividendsFilterIncome: string;
  dividendsFilterEmpty: string;
  dividendsTableType: string;
  dividendsTableEx: string;
  dividendsTablePay: string;
  dividendsTableAmount: string;
  dividendsEmpty: string;
  dividendsDisclaimer: string;
  dividendsSource: string;
  notAvailable: string;
};

const NAV_IDS = {
  session: "dossier-session",
  returns: "dossier-returns",
  ratios: "dossier-ratios",
  dividends: "dossier-dividends",
  calendar: "dossier-calendar",
  risk: "dossier-risk",
} as const;

export function DossierSectionNav({
  labels,
  showRatios,
  showCalendar,
  showDividends,
}: {
  labels: AssetDossierSectionLabels;
  showRatios: boolean;
  showCalendar: boolean;
  showDividends: boolean;
}) {
  const items = [
    { id: NAV_IDS.session, label: labels.navSession },
    { id: NAV_IDS.returns, label: labels.navReturns },
    ...(showRatios ? [{ id: NAV_IDS.ratios, label: labels.navRatios }] : []),
    ...(showDividends ? [{ id: NAV_IDS.dividends, label: labels.navDividends }] : []),
    ...(showCalendar ? [{ id: NAV_IDS.calendar, label: labels.navCalendar }] : []),
    { id: NAV_IDS.risk, label: labels.navRisk },
  ];

  return (
    <nav
      aria-label="Dossier sections"
      className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2"
    >
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "rounded-full border border-transparent text-muted-foreground hover:border-white/15 hover:bg-white/[0.06] hover:text-foreground",
          )}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export function DossierSessionTradingSection({
  dossier,
  locale,
  labels,
}: {
  dossier: AssetDossier;
  locale: string;
  labels: AssetDossierSectionLabels;
}) {
  const ps = dossier.periodStats;
  const prev = dossier.regularMarketPreviousClose;
  const price = dossier.quote.regularMarketPrice;
  const changeVsPrev =
    price != null && prev != null && prev > 0 ? ((price - prev) / prev) * 100 : null;

  return (
    <Card
      id={NAV_IDS.session}
      className="glass-panel card-shine scroll-mt-24 border-white/12 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">{labels.sessionTitle}</CardTitle>
        <CardDescription>{labels.sessionSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={labels.sessionOpen} value={formatMoney(dossier.regularMarketOpen, dossier.currency, locale)} />
        <Metric
          label={labels.sessionPreviousClose}
          value={formatMoney(dossier.regularMarketPreviousClose, dossier.currency, locale)}
        />
        <Metric
          label={labels.sessionDayHigh}
          value={formatMoney(dossier.regularMarketDayHigh, dossier.currency, locale)}
        />
        <Metric
          label={labels.sessionDayLow}
          value={formatMoney(dossier.regularMarketDayLow, dossier.currency, locale)}
        />
        <Metric
          label={labels.sessionVolume}
          value={formatCompactNumber(dossier.regularMarketVolume, locale)}
        />
        <Metric
          label={labels.sessionChangeVsPrev}
          value={formatSignedPercent(changeVsPrev)}
          accent={accentForPct(changeVsPrev)}
        />
        <Metric
          label={labels.sessionFrom52High}
          value={formatSignedPercent(ps.distanceFrom52WeekHighPct)}
          accent={accentForPct(ps.distanceFrom52WeekHighPct)}
        />
        <Metric
          label={labels.sessionFrom52Low}
          value={formatSignedPercent(ps.distanceFrom52WeekLowPct)}
          accent={accentForPct(ps.distanceFrom52WeekLowPct)}
        />
        <Metric
          label={labels.sessionAvgVol20}
          value={formatCompactNumber(ps.avgVolume20d, locale)}
        />
        <Metric
          label={labels.returnsTradingDays}
          value={String(ps.windowTradingDays)}
        />
      </CardContent>
    </Card>
  );
}

export function DossierPeriodReturnsSection({
  stats,
  labels,
}: {
  stats: AssetDossierPeriodStats;
  labels: AssetDossierSectionLabels;
}) {
  const rows: { label: string; value: number | null }[] = [
    { label: labels.returnYtd, value: stats.ytd },
    { label: labels.return1m, value: stats.oneMonth },
    { label: labels.return3m, value: stats.threeMonths },
    { label: labels.return6m, value: stats.sixMonths },
    { label: labels.return1y, value: stats.oneYear },
    { label: labels.return3y, value: stats.threeYears },
    { label: labels.return5y, value: stats.fiveYears },
    { label: labels.returnWindow, value: stats.sinceWindowStart },
  ];

  return (
    <Card
      id={NAV_IDS.returns}
      className="glass-panel card-shine scroll-mt-24 border-white/12 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">{labels.returnsTitle}</CardTitle>
        <CardDescription>{labels.returnsSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => (
          <Metric
            key={row.label}
            label={row.label}
            value={formatSignedPercent(row.value)}
            accent={accentForPct(row.value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export function DossierMarketRatiosSection({
  dossier,
  locale,
  labels,
}: {
  dossier: AssetDossier;
  locale: string;
  labels: AssetDossierSectionLabels;
}) {
  const ex = dossier.marketExtras;
  if (!marketExtrasHasDisplayData(ex)) return null;

  return (
    <Card
      id={NAV_IDS.ratios}
      className="glass-panel card-shine scroll-mt-24 border-white/12 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">{labels.ratiosTitle}</CardTitle>
        <CardDescription>{labels.ratiosSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={labels.ratioBeta} value={formatRatioPlain(ex.beta)} />
        <Metric label={labels.ratioPb} value={formatMultiple(ex.priceToBook)} />
        <Metric
          label={labels.ratioDivYield}
          value={formatPercentFromMaybeDecimal(ex.dividendYield, locale)}
        />
        <Metric
          label={labels.ratioDivRate}
          value={formatMoney(ex.trailingAnnualDividendRate, dossier.currency, locale)}
        />
        <Metric
          label={labels.ratioMargin}
          value={formatPercentFromMaybeDecimal(ex.profitMargin, locale)}
        />
        <Metric
          label={labels.ratioRoe}
          value={formatPercentFromMaybeDecimal(ex.returnOnEquity, locale)}
        />
        <Metric
          label={labels.ratioRoa}
          value={formatPercentFromMaybeDecimal(ex.returnOnAssets, locale)}
        />
        <Metric label={labels.ratioDebtEquity} value={formatRatioPlain(ex.debtToEquity)} />
        <Metric
          label={labels.ratioPayout}
          value={formatPercentFromMaybeDecimal(ex.payoutRatio, locale)}
        />
        <Metric
          label={labels.ratioBookValue}
          value={formatMoney(ex.bookValuePerShare, dossier.currency, locale)}
        />
        <Metric
          label={labels.ratioEv}
          value={formatCompactMoney(ex.enterpriseValue, dossier.currency, locale)}
        />
        <Metric label={labels.ratioForwardPe} value={formatMultiple(ex.forwardPe)} />
        <Metric label={labels.ratioPeg} value={formatRatioPlain(ex.pegRatio)} />
        <Metric label={labels.ratioShares} value={formatCompactNumber(ex.sharesOutstanding, locale)} />
        <Metric label={labels.ratioFloat} value={formatCompactNumber(ex.floatShares, locale)} />
      </CardContent>
    </Card>
  );
}

export function DossierCalendarYearsSection({
  rows,
  labels,
  locale,
}: {
  rows: CalendarYearReturn[];
  labels: AssetDossierSectionLabels;
  locale: string;
}) {
  if (rows.length === 0) return null;

  return (
    <Card
      id={NAV_IDS.calendar}
      className="glass-panel card-shine scroll-mt-24 border-white/12 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">{labels.calendarTitle}</CardTitle>
        <CardDescription>{labels.calendarSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <DossierCalendarChart
            rows={rows}
            locale={locale}
            ariaLabel={labels.calendarTitle}
            emptyLabel={labels.notAvailable}
          />
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 font-medium">{labels.calendarYear}</th>
              <th className="px-3 py-2 font-medium">{labels.calendarReturn}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year} className="border-b border-white/5 last:border-0">
                <td className="px-3 py-2.5 font-mono text-foreground">{row.year}</td>
                <td
                  className={cn(
                    "px-3 py-2.5 font-semibold",
                    row.returnPct >= 0 ? "text-market-up" : "text-market-down",
                  )}
                >
                  {formatSignedPercent(row.returnPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function DossierRiskMetricsSection({
  stats,
  labels,
}: {
  stats: AssetDossierPeriodStats;
  labels: AssetDossierSectionLabels;
}) {
  return (
    <Card
      id={NAV_IDS.risk}
      className="glass-panel card-shine scroll-mt-24 border-white/12 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">{labels.riskTitle}</CardTitle>
        <CardDescription>{labels.riskSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label={labels.riskMaxDrawdown}
          value={formatSignedPercent(stats.maxDrawdownPct)}
          accent="text-market-down"
        />
        <Metric
          label={labels.riskVolatility}
          value={
            stats.annualizedVolatilityPct != null
              ? `${stats.annualizedVolatilityPct.toFixed(1)}%`
              : labels.notAvailable
          }
        />
      </CardContent>
    </Card>
  );
}
export function DossierComparablePeers({
  peers,
  emptyLabel,
}: {
  peers: string[];
  emptyLabel: string;
}) {
  if (peers.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {peers.map((peer) => (
        <Link
          key={peer}
          href={`/ativo/${encodeURIComponent(peer)}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-full border-white/15 bg-white/[0.04] font-mono text-xs",
          )}
        >
          {peer}
        </Link>
      ))}
    </div>
  );
}

function Metric({
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

function accentForPct(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return undefined;
  return value >= 0 ? "text-market-up" : "text-market-down";
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
  return new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function formatCompactMoney(value: number | null | undefined, currency: string, locale: string) {
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
  return `${value.toFixed(2)}x`;
}

function formatRatioPlain(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function formatPercentFromMaybeDecimal(
  value: number | null | undefined,
  locale: string,
  alreadyPercent = false,
) {
  if (value == null || !Number.isFinite(value)) return "—";
  const fraction = alreadyPercent
    ? value / 100
    : Math.abs(value) <= 1
      ? value
      : value / 100;
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(fraction);
}
