"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  aggregateDividendsByYear,
  computeDividendYieldByYear,
  dividendInsightsHasData,
  filterDividendEvents,
} from "@/lib/market/asset-dossier-dividends";
import {
  ProfessionalBarChart,
  ProfessionalLineChart,
} from "@/components/charts/professional-charts";
import type { AssetDossierSectionLabels } from "@/components/market/asset-dossier-sections";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AssetDividendInsights,
  AssetHistoryPoint,
  DividendTypeFilter,
} from "@/lib/market/types";
import { cn } from "@/lib/utils";

const NAV_ID = "dossier-dividends";

type FilterOption = { id: DividendTypeFilter; label: string };

export function DossierDividendsPanel({
  insights,
  history,
  currency,
  locale,
  labels,
  filters,
}: {
  insights: AssetDividendInsights;
  history: AssetHistoryPoint[];
  currency: string;
  locale: string;
  labels: AssetDossierSectionLabels;
  filters: FilterOption[];
}) {
  const [typeFilter, setTypeFilter] = useState<DividendTypeFilter>("ALL");

  const filteredEvents = useMemo(
    () => filterDividendEvents(insights.events, typeFilter),
    [insights.events, typeFilter],
  );

  const byYear = useMemo(() => aggregateDividendsByYear(filteredEvents), [filteredEvents]);

  const yieldByYear = useMemo(
    () => computeDividendYieldByYear(filteredEvents, history),
    [filteredEvents, history],
  );

  const paidSeries = useMemo(
    () =>
      byYear.map((y) => ({
        label: String(y.year),
        value: y.total,
        hint: `${y.count} pag.`,
      })),
    [byYear],
  );

  const yieldChartData = useMemo(
    () =>
      yieldByYear
        .filter((y) => y.yieldPct != null)
        .map((y) => ({
          label: String(y.year),
          value: y.yieldPct!,
          hint:
            y.yearEndPrice != null
              ? `${labels.dividendsYieldHint} ${formatMoney(y.yearEndPrice, currency, locale)}`
              : undefined,
        })),
    [yieldByYear, labels.dividendsYieldHint, currency, locale],
  );

  if (!dividendInsightsHasData(insights)) return null;

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const money = (v: number) => formatMoney(v, currency, locale);

  return (
    <Card
      id={NAV_ID}
      className="glass-panel card-shine scroll-mt-24 border-emerald-500/20 shadow-none ring-0"
    >
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="font-heading">{labels.dividendsTitle}</CardTitle>
          <CardDescription>{labels.dividendsSubtitle}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTypeFilter(f.id)}
              className={cn(
                buttonVariants({ variant: typeFilter === f.id ? "default" : "outline", size: "sm" }),
                "rounded-full",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {insights.trailing12mTotal != null ? (
            <Kpi label={labels.dividendsTtmTotal} value={money(insights.trailing12mTotal)} accent="text-emerald-400" />
          ) : null}
          {insights.trailing12mYield != null ? (
            <Kpi
              label={labels.dividendsTtmYield}
              value={formatPct(insights.trailing12mYield, locale)}
              accent="text-emerald-300"
            />
          ) : null}
          {insights.dividendYieldSnapshot != null ? (
            <Kpi
              label={labels.dividendsYieldSnapshot}
              value={formatPct(insights.dividendYieldSnapshot, locale, true)}
            />
          ) : null}
          <Kpi label={labels.dividendsPayments12m} value={String(insights.paymentsLast12m)} />
          <Kpi label={labels.dividendsPayments24m} value={String(insights.paymentsLast24m)} />
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
              · {money(insights.nextPayment.amount)}{" "}
              <span className="text-muted-foreground">
                ({insights.nextPayment.label ?? insights.nextPayment.type})
              </span>
            </p>
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartBlock title={labels.dividendsByYearTitle} subtitle={labels.dividendsByYearSubtitle}>
            <ProfessionalBarChart
              data={paidSeries}
              locale={locale}
              ariaLabel={labels.dividendsByYearTitle}
              accent="emerald"
              formatValue={money}
              emptyLabel={labels.dividendsEmpty}
            />
          </ChartBlock>
          <ChartBlock title={labels.dividendsYieldByYearTitle} subtitle={labels.dividendsYieldByYearSubtitle}>
            <ProfessionalLineChart
              data={yieldChartData}
              locale={locale}
              ariaLabel={labels.dividendsYieldByYearTitle}
              valueMode="percent"
              accent="sky"
              emptyLabel={labels.dividendsYieldEmpty}
            />
          </ChartBlock>
        </div>

        {filteredEvents.length > 0 ? (
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
                {filteredEvents.slice(0, 24).map((event, index) => (
                  <tr
                    key={`${event.paymentDate}-${event.amount}-${index}`}
                    className="border-b border-white/5"
                  >
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
                      {money(event.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{labels.dividendsFilterEmpty}</p>
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

function ChartBlock({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Kpi({
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

function formatMoney(value: number, currency: string, locale: string) {
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

function formatPct(value: number, locale: string, alreadyPercent = false) {
  const fraction = alreadyPercent ? value / 100 : Math.abs(value) <= 1 ? value : value / 100;
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 }).format(fraction);
}
