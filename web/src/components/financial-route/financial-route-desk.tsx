"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Navigation,
  Plus,
  Route,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EvaluatedFinancialRoute } from "@/lib/financial-route/types";
import type { StoredRouteAlert } from "@/lib/financial-route/load";
import type { MacroRouteContext } from "@/lib/financial-route/macro-route-context";
import type { FinancialGoalType } from "@/lib/financial-route/types";
import { cn } from "@/lib/utils";

const GOAL_TYPES: FinancialGoalType[] = ["freedom", "property", "vehicle", "custom"];

type DeskProps = {
  locale: string;
  initialRoutes: EvaluatedFinancialRoute[];
  initialAlerts: StoredRouteAlert[];
  macro?: MacroRouteContext | null;
};

export function FinancialRouteDesk({
  locale,
  initialRoutes,
  initialAlerts,
  macro = null,
}: DeskProps) {
  const t = useTranslations("FinancialRoute");
  const [routes, setRoutes] = useState(initialRoutes);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [showForm, setShowForm] = useState(initialRoutes.length === 0);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [label, setLabel] = useState("");
  const [goalType, setGoalType] = useState<FinancialGoalType>("property");
  const [targetAmount, setTargetAmount] = useState("500000");
  const [targetDate, setTargetDate] = useState(defaultTargetDate());
  const [initialAmount, setInitialAmount] = useState("50000");
  const [monthlyContribution, setMonthlyContribution] = useState("2000");
  const [assumedReturnPct, setAssumedReturnPct] = useState("10");
  const [assumedInflationPct, setAssumedInflationPct] = useState("4.5");
  const [linkPortfolio, setLinkPortfolio] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/user/financial-routes");
    if (!res.ok) return;
    const json = (await res.json()) as {
      ok: boolean;
      routes?: EvaluatedFinancialRoute[];
      alerts?: StoredRouteAlert[];
    };
    if (!json.ok || !json.routes) return;
    setRoutes(json.routes);
    setAlerts(json.alerts ?? []);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/user/financial-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim() || t(`goalTypes.${goalType}`),
        goalType,
        targetAmount: Number(targetAmount),
        targetDate,
        initialAmount: Number(initialAmount),
        monthlyContribution: Number(monthlyContribution),
        assumedReturnPct: Number(assumedReturnPct),
        assumedInflationPct: Number(assumedInflationPct),
        linkPortfolio,
      }),
    });
    setPending(false);
    if (!res.ok) {
      setMessage(t("saveError"));
      return;
    }
    setMessage(t("saveSuccess"));
    setShowForm(false);
    await refresh();
  }

  async function handleDelete(id: string) {
    setPending(true);
    await fetch("/api/user/financial-routes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setPending(false);
    await refresh();
  }

  async function dismissAlert(id: string) {
    await fetch("/api/user/financial-routes/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),rgba(16,185,129,0.06))] px-6 py-8 md:px-8">
        <div className="flex flex-wrap items-start gap-4">
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <Navigation className="size-8 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
              {t("pageTitle")}
            </h1>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{t("pageLead")}</p>
          </div>
        </div>
      </div>

      {alerts.length > 0 ? (
        <Card className="glass-panel border-primary/20 bg-status-warning/6 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              <AlertTriangle className="size-5 text-status-warning" />
              {t("alertsTitle")}
            </CardTitle>
            <CardDescription>{t("alertsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                  {renderAlertMessage(t, alert, locale)}
                  <p className="mt-2 text-xs text-muted-foreground">{t("alertDisclaimer")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void dismissAlert(alert.id)}
                  className="shrink-0 rounded-lg border border-white/10 p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={t("dismissAlert")}
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-4" />
          {showForm ? t("hideForm") : t("newRoute")}
        </button>
        <Link href="/carteira" className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("linkPortfolio")}
        </Link>
        <Link
          href="/ferramentas/juros-compostos"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          {t("linkCalculator")}
        </Link>
      </div>

      {showForm ? (
        <Card className="glass-panel border-white/12 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="font-heading">{t("formTitle")}</CardTitle>
            <CardDescription>{t("formSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4 md:grid-cols-2">
              <Field label={t("fieldLabel")}>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={t(`goalTypes.${goalType}`)}
                  className="border-white/15 bg-black/20"
                />
              </Field>
              <Field label={t("fieldGoalType")}>
                <select
                  value={goalType}
                  onChange={(e) => setGoalType(e.target.value as FinancialGoalType)}
                  className="h-10 w-full rounded-md border border-white/15 bg-black/20 px-3 text-sm"
                >
                  {GOAL_TYPES.map((gt) => (
                    <option key={gt} value={gt}>
                      {t(`goalTypes.${gt}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("fieldTarget")}>
                <Input
                  type="number"
                  min="1"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="border-white/15 bg-black/20"
                  required
                />
              </Field>
              <Field label={t("fieldTargetDate")}>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="border-white/15 bg-black/20"
                  required
                />
              </Field>
              <Field label={t("fieldInitial")}>
                <Input
                  type="number"
                  min="0"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="border-white/15 bg-black/20"
                  required
                />
              </Field>
              <Field label={t("fieldMonthly")}>
                <Input
                  type="number"
                  min="0"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(e.target.value)}
                  className="border-white/15 bg-black/20"
                  required
                />
              </Field>
              <Field label={t("fieldReturn")}>
                <Input
                  type="number"
                  min="0"
                  max="40"
                  step="0.1"
                  value={assumedReturnPct}
                  onChange={(e) => setAssumedReturnPct(e.target.value)}
                  className="border-white/15 bg-black/20"
                  required
                />
              </Field>
              <Field label={t("fieldInflation")}>
                <Input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={assumedInflationPct}
                  onChange={(e) => setAssumedInflationPct(e.target.value)}
                  className="border-white/15 bg-black/20"
                  required
                />
              </Field>
              <div className="md:col-span-2 flex items-center gap-2">
                <input
                  id="link-portfolio"
                  type="checkbox"
                  checked={linkPortfolio}
                  onChange={(e) => setLinkPortfolio(e.target.checked)}
                  className="size-4 rounded border-white/20"
                />
                <Label htmlFor="link-portfolio" className="text-sm text-muted-foreground">
                  {t("fieldLinkPortfolio")}
                </Label>
              </div>
              <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className={cn(buttonVariants({ size: "sm" }), pending && "opacity-60")}
                >
                  {pending ? t("saving") : t("saveCta")}
                </button>
                {message ? <p className="text-sm text-primary">{message}</p> : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {routes.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {routes.map(({ route, status }) => (
            <Card
              key={route.id}
              className="glass-panel card-shine border-white/12 shadow-none ring-0"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Route className="size-4 text-primary" />
                    <CardTitle className="font-heading text-lg">{route.label}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                      {t(`goalTypes.${route.goalType}`)}
                    </Badge>
                    {macro?.hasHighImpactThisWeek ? (
                      <Badge className="border-cognitive/30 bg-cognitive/10 font-mono text-[10px] uppercase text-cognitive">
                        {t("macroRecalcBadge")}
                      </Badge>
                    ) : null}
                  </div>
                  <CardDescription className="mt-1">
                    {t("targetDateLabel", { date: formatDate(route.targetDate, locale) })}
                  </CardDescription>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void handleDelete(route.id)}
                  className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-market-down"
                  aria-label={t("deleteRoute")}
                >
                  <Trash2 className="size-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  {status.onTrack ? (
                    <Badge className="border-status-live/30 bg-status-live/10 text-status-live">
                      <CheckCircle2 className="mr-1 size-3" />
                      {t("statusOnTrack")}
                    </Badge>
                  ) : (
                    <Badge className="border-border bg-primary/8 text-status-warning">
                      <Clock className="mr-1 size-3" />
                      {t("statusBehind", { months: status.monthsBehind })}
                    </Badge>
                  )}
                  <span className="font-mono text-xs text-muted-foreground">
                    {Math.round(status.progressPct)}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      status.onTrack
                        ? "bg-gradient-to-r from-market-up to-primary"
                        : "bg-gradient-to-r from-status-warning to-status-degraded",
                    )}
                    style={{ width: `${Math.min(100, status.progressPct)}%` }}
                  />
                </div>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <Metric
                    label={t("metricCurrent")}
                    value={money(status.currentWealth, route.currency)}
                  />
                  <Metric
                    label={t("metricProjected")}
                    value={money(status.projectedAtTargetDate, route.currency)}
                  />
                  <Metric label={t("metricTarget")} value={money(status.targetAmount, route.currency)} />
                  <Metric
                    label={t("metricEta")}
                    value={status.etaDate ? formatDate(status.etaDate, locale) : "—"}
                  />
                </div>
                {!status.onTrack ? (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed">
                    <p className="font-medium text-foreground">{t("leversTitle")}</p>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                      <li>{t("leverContribution")}</li>
                      <li>{t("leverAllocation")}</li>
                      <li>{t("leverHorizon")}</li>
                    </ul>
                    {status.suggestedExtraMonthly != null ? (
                      <p className="mt-3 font-mono text-xs text-primary">
                        {t("simExtraMonthly", {
                          value: money(status.suggestedExtraMonthly, route.currency),
                        })}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading mt-0.5 font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function defaultTargetDate() {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() + 10);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string, locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
  } catch {
    return iso;
  }
}

function renderAlertMessage(
  t: ReturnType<typeof useTranslations<"FinancialRoute">>,
  alert: StoredRouteAlert,
  locale: string,
) {
  const p = alert.params;
  const label = String(p.label ?? alert.routeLabel);
  const key = `alerts.${alert.alertType}` as Parameters<typeof t>[0];

  const money = (value: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value);

  try {
    const eventSummary = locale.startsWith("pt")
      ? String(p.eventSummaryPt ?? "")
      : String(p.eventSummaryEn ?? "");

    const body = t(key, {
      label,
      monthsBehind: Number(p.monthsBehind ?? 0),
      monthsRemaining: Number(p.monthsRemaining ?? 0),
      extraMonthly: money(Number(p.extraMonthly ?? 0)),
      assumed: Number(p.assumed ?? 0),
      reference: Number(p.reference ?? 0),
      assumedReturn: Number(p.assumedReturn ?? 0),
      observedReturn: Number(p.observedReturn ?? 0),
      eventSummary,
      eventCount: Number(p.eventCount ?? 0),
    });
    if (alert.alertType === "schedule_behind" && p.hasExtra) {
      return (
        <>
          {body}{" "}
          <span className="text-primary">{t("alerts.schedule_behind_extra", { extraMonthly: money(Number(p.extraMonthly ?? 0)) })}</span>
        </>
      );
    }
    return body;
  } catch {
    return t("alerts.fallback", { label });
  }
}
