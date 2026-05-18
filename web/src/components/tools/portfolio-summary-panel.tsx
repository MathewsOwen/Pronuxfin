import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PortfolioEditLink, PortfolioRemoveButton } from "@/components/tools/portfolio-manager";
import type { PortfolioPositionSnapshot, PortfolioSummary } from "@/lib/user-portfolio/snapshot";
import { cn } from "@/lib/utils";

export async function PortfolioSummaryPanel({
  summary,
  locale,
  compact = false,
}: {
  summary: PortfolioSummary;
  locale: string;
  compact?: boolean;
}) {
  const t = await getTranslations("Portfolio");

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  const pct = (value: number | null) =>
    value == null || !Number.isFinite(value)
      ? "—"
      : `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle className="font-heading">{t("summaryTitle")}</CardTitle>
          <CardDescription>{t("summarySubtitle")}</CardDescription>
        </div>
        {!compact ? (
          <Link href="/carteira" className={buttonVariants({ variant: "outline", size: "sm" })}>
            {t("manageCta")}
          </Link>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label={t("marketValue")} value={money(summary.marketValue, summary.currency)} />
          <Kpi label={t("costBasis")} value={money(summary.costBasis, summary.currency)} />
          <Kpi
            label={t("totalPnl")}
            value={money(summary.totalPnl, summary.currency)}
            delta={pct(summary.totalPnlPercent)}
            positive={summary.totalPnl >= 0}
          />
          <Kpi
            label={t("dayPnl")}
            value={money(summary.dayPnl, summary.currency)}
            positive={summary.dayPnl >= 0}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Movers
            title={t("gainersTitle")}
            icon={TrendingUp}
            items={summary.gainers}
            tone="text-market-up"
          />
          <Movers
            title={t("losersTitle")}
            icon={TrendingDown}
            items={summary.losers}
            tone="text-market-down"
          />
        </div>

        {!compact ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">{t("colAsset")}</th>
                  <th className="px-4 py-3">{t("colQty")}</th>
                  <th className="px-4 py-3">{t("colPrice")}</th>
                  <th className="px-4 py-3">{t("colDay")}</th>
                  <th className="px-4 py-3">{t("colTotal")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {summary.positions.map((row) => (
                  <tr key={row.position.symbol} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <Link
                        href={`/ativo/${row.position.symbol}`}
                        className="inline-flex items-center gap-1 font-mono font-medium hover:text-primary"
                      >
                        {row.position.symbol}
                        <ArrowUpRight className="size-3" />
                      </Link>
                      <p className="text-xs text-muted-foreground">{row.companyName}</p>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{row.position.quantity}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.currentPrice != null
                        ? money(row.currentPrice, row.position.currency)
                        : "—"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 tabular-nums",
                        (row.dayPnlPercent ?? 0) >= 0 ? "text-market-up" : "text-market-down",
                      )}
                    >
                      {pct(row.dayPnlPercent)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 tabular-nums",
                        (row.totalPnl ?? 0) >= 0 ? "text-market-up" : "text-market-down",
                      )}
                    >
                      {row.totalPnl != null
                        ? money(row.totalPnl, row.position.currency)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-end gap-1">
                        <PortfolioEditLink
                          symbol={row.position.symbol}
                          quantity={row.position.quantity}
                          averageCost={row.position.averageCost}
                        />
                        <PortfolioRemoveButton symbol={row.position.symbol} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
}

function Kpi({
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold tabular-nums">{value}</p>
      {delta ? (
        <p
          className={cn(
            "mt-1 font-mono text-xs",
            positive === undefined
              ? "text-muted-foreground"
              : positive
                ? "text-market-up"
                : "text-market-down",
          )}
        >
          {delta}
        </p>
      ) : null}
    </div>
  );
}

function Movers({
  title,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  icon: typeof TrendingUp;
  items: PortfolioPositionSnapshot[];
  tone: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", tone)} />
          <p className="text-sm font-medium">{title}</p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">—</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn("size-4", tone)} />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((row) => (
          <li key={row.position.symbol} className="flex items-center justify-between gap-2 text-sm">
            <Link href={`/ativo/${row.position.symbol}`} className="font-mono hover:text-primary">
              {row.position.symbol}
            </Link>
            <span className={cn("tabular-nums", tone)}>
              {row.dayPnlPercent != null
                ? `${row.dayPnlPercent >= 0 ? "+" : ""}${row.dayPnlPercent.toFixed(2)}%`
                : "—"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
