import { Link } from "@/i18n/navigation";
import { dividendInsightsHasData } from "@/lib/market/asset-dossier-dividends";
import { marketExtrasHasDisplayData } from "@/lib/market/asset-dossier-market-extras";
import type {
  AssetDividendInsights,
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
}: {
  rows: CalendarYearReturn[];
  labels: AssetDossierSectionLabels;
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
      <CardContent className="overflow-x-auto">
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
                    row.returnPct >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  {formatSignedPercent(row.returnPct)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          accent="text-rose-400"
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

export function DossierDividendsSection({
  insights,
  currency,
  locale,
  labels,
}: {
  insights: AssetDividendInsights;
  currency: string;
  locale: string;
  labels: AssetDossierSectionLabels;
}) {
  if (!dividendInsightsHasData(insights)) return null;

  const maxYearTotal = Math.max(...insights.byYear.map((y) => y.total), 0.0001);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <Card
      id={NAV_IDS.dividends}
      className="glass-panel card-shine scroll-mt-24 border-emerald-500/20 shadow-none ring-0"
    >
      <CardHeader>
        <CardTitle className="font-heading">{labels.dividendsTitle}</CardTitle>
        <CardDescription>{labels.dividendsSubtitle}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric
            label={labels.dividendsTtmTotal}
            value={formatMoney(insights.trailing12mTotal, currency, locale)}
            accent="text-emerald-400"
          />
          <Metric
            label={labels.dividendsTtmYield}
            value={formatPercentFromMaybeDecimal(insights.trailing12mYield, locale, true)}
            accent="text-emerald-300"
          />
          <Metric
            label={labels.dividendsYieldSnapshot}
            value={formatPercentFromMaybeDecimal(insights.dividendYieldSnapshot, locale)}
          />
          <Metric label={labels.dividendsPayments12m} value={String(insights.paymentsLast12m)} />
          <Metric label={labels.dividendsPayments24m} value={String(insights.paymentsLast24m)} />
        </div>

        {insights.nextPayment ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/15 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              {labels.dividendsNextPayment}
            </p>
            <p className="mt-1 font-medium text-foreground">
              {insights.nextPayment.paymentDate
                ? dateFmt.format(new Date(insights.nextPayment.paymentDate))
                : labels.notAvailable}{" "}
              · {formatMoney(insights.nextPayment.amount, currency, locale)}{" "}
              <span className="text-muted-foreground">({insights.nextPayment.type})</span>
            </p>
          </div>
        ) : null}

        {insights.byYear.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {labels.dividendsByYearTitle}
            </p>
            <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-black/20 p-4">
              {[...insights.byYear].reverse().map((row) => (
                <div key={row.year} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full max-w-[48px] rounded-t-md bg-gradient-to-t from-emerald-600/80 to-emerald-400/90"
                    style={{ height: `${Math.max(12, (row.total / maxYearTotal) * 120)}px` }}
                    title={formatMoney(row.total, currency, locale)}
                  />
                  <span className="font-mono text-[10px] text-muted-foreground">{row.year}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {insights.events.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2">{labels.dividendsTablePay}</th>
                  <th className="px-3 py-2">{labels.dividendsTableEx}</th>
                  <th className="px-3 py-2">{labels.dividendsTableType}</th>
                  <th className="px-3 py-2 text-right">{labels.dividendsTableAmount}</th>
                </tr>
              </thead>
              <tbody>
                {insights.events.slice(0, 24).map((event, index) => (
                  <tr key={`${event.paymentDate}-${event.amount}-${index}`} className="border-b border-white/5">
                    <td className="px-3 py-2.5 text-foreground">
                      {event.paymentDate
                        ? dateFmt.format(new Date(event.paymentDate))
                        : labels.notAvailable}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {event.exDate ? dateFmt.format(new Date(event.exDate)) : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] uppercase">
                        {event.label ?? event.type}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-300">
                      {formatMoney(event.amount, currency, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{labels.dividendsEmpty}</p>
        )}

        <div className="space-y-1 border-t border-white/10 pt-4 text-xs leading-relaxed text-muted-foreground">
          <p>{labels.dividendsDisclaimer}</p>
          <p className="font-mono text-[10px] uppercase tracking-wider opacity-90">
            {labels.dividendsSource.replace("{source}", insights.sourceLabel)}
          </p>
        </div>
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
  return value >= 0 ? "text-emerald-400" : "text-rose-400";
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
