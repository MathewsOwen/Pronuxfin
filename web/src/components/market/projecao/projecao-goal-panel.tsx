"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Flag, Target } from "lucide-react";
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
import { computeGoalProjection } from "@/lib/projecao/scenario-projection";
import { cn } from "@/lib/utils";

export function ProjecaoGoalPanel({ loggedIn }: { loggedIn: boolean }) {
  const t = useTranslations("ProjecaoHub.goal");
  const locale = useLocale();
  const [initial, setInitial] = useState(15_000);
  const [monthly, setMonthly] = useState(2_000);
  const [target, setTarget] = useState(1_000_000);
  const [years, setYears] = useState(12);
  const [rate, setRate] = useState(10);

  const result = useMemo(
    () =>
      computeGoalProjection({
        initial,
        monthlyContribution: monthly,
        targetAmount: target,
        years,
        annualReturnPct: rate,
      }),
    [initial, monthly, target, years, rate],
  );

  const money = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(v);

  function readNumber(raw: string, fallback: number) {
    const n = Number(raw.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="size-5 text-primary" aria-hidden />
          <CardTitle className="font-heading">{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <GoalField
            id="goal-target"
            label={t("target")}
            value={String(target)}
            onChange={(v) => setTarget(Math.max(0, readNumber(v, 0)))}
          />
          <GoalField
            id="goal-years"
            label={t("horizon")}
            value={String(years)}
            onChange={(v) => setYears(Math.min(50, Math.max(1, readNumber(v, 1))))}
          />
          <GoalField
            id="goal-initial"
            label={t("initial")}
            value={String(initial)}
            onChange={(v) => setInitial(Math.max(0, readNumber(v, 0)))}
          />
          <GoalField
            id="goal-monthly"
            label={t("monthly")}
            value={String(monthly)}
            onChange={(v) => setMonthly(Math.max(0, readNumber(v, 0)))}
          />
          <GoalField
            id="goal-rate"
            label={t("rate")}
            value={String(rate)}
            onChange={(v) => setRate(Math.min(40, Math.max(-5, readNumber(v, 10))))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label={t("projected")}
            value={money(result.projectedBalance)}
            sub={t("atHorizon", { years })}
          />
          <Stat
            label={t("targetLabel")}
            value={money(target)}
            sub={t("progress", { pct: result.progressPct.toFixed(0) })}
          />
          <Stat
            label={result.onTrack ? t("onTrack") : t("gap")}
            value={result.onTrack ? t("onTrackValue") : money(Math.max(0, result.gap))}
            accent={result.onTrack ? "text-market-up" : "text-market-down"}
          />
          <Stat
            label={t("extraMonthly")}
            value={
              result.suggestedExtraMonthly != null
                ? money(result.suggestedExtraMonthly)
                : "—"
            }
            sub={
              result.suggestedExtraMonthly != null
                ? t("extraHint")
                : result.onTrack
                  ? t("noExtraNeeded")
                  : t("unreachableHint")
            }
          />
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              result.onTrack ? "bg-market-up" : "bg-status-warning",
            )}
            style={{ width: `${Math.min(100, result.progressPct)}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
          {loggedIn ? (
            <Link href="/rota" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
              <Flag className="size-4" aria-hidden />
              {t("ctaRoute")}
            </Link>
          ) : (
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              {t("ctaRegister")}
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function GoalField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-white/12 bg-black/30 font-mono tabular-nums"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={cn("mt-2 font-heading text-xl font-semibold tracking-tight", accent)}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
