"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, TrendingUp } from "lucide-react";
import { ScenarioProjectionChart } from "@/components/market/projecao/scenario-projection-chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildAllScenarioBands,
  RETURN_PRESETS,
  realReturnPct,
  type ReturnPresetId,
  type WealthProjectionInput,
} from "@/lib/projecao/scenario-projection";
import { cn } from "@/lib/utils";

export const DEFAULT_WEALTH_INPUT: WealthProjectionInput = {
  initial: 25_000,
  monthlyContribution: 1_500,
  years: 15,
  baseAnnualReturnPct: 10.5,
};

export function ProjecaoWealthDesk({
  input,
  onInputChange,
}: {
  input: WealthProjectionInput;
  onInputChange: (next: WealthProjectionInput) => void;
}) {
  const t = useTranslations("ProjecaoHub.wealth");
  const locale = useLocale();
  const [showReal, setShowReal] = useState(true);

  const bands = useMemo(() => buildAllScenarioBands(input), [input]);
  const baseBand = bands.find((b) => b.id === "base")!;
  const inflationPct = RETURN_PRESETS.balanced_br.inflationPct;

  const legend = {
    pessimistic: t("bandPessimistic"),
    base: t("bandBase"),
    optimistic: t("bandOptimistic"),
  } as const;

  const money = (v: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(v);

  function patch<K extends keyof WealthProjectionInput>(key: K, value: WealthProjectionInput[K]) {
    onInputChange({ ...input, [key]: value });
  }

  function readNumber(raw: string, fallback: number) {
    const n = Number(raw.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  function applyPreset(id: ReturnPresetId) {
    patch("baseAnnualReturnPct", RETURN_PRESETS[id].annualReturnPct);
  }

  return (
    <Card className="glass-panel card-shine border-border shadow-none ring-0">
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-2">
          <Calculator className="size-5 text-cognitive" aria-hidden />
          <CardTitle className="font-heading">{t("title")}</CardTitle>
        </div>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="proj-initial"
                label={t("initial")}
                value={String(input.initial)}
                onChange={(v) => patch("initial", Math.max(0, readNumber(v, 0)))}
              />
              <Field
                id="proj-monthly"
                label={t("monthly")}
                value={String(input.monthlyContribution)}
                onChange={(v) => patch("monthlyContribution", Math.max(0, readNumber(v, 0)))}
              />
              <Field
                id="proj-years"
                label={t("years")}
                value={String(input.years)}
                onChange={(v) => patch("years", Math.min(50, Math.max(1, readNumber(v, 1))))}
              />
              <Field
                id="proj-rate"
                label={t("baseRate")}
                value={String(input.baseAnnualReturnPct)}
                onChange={(v) =>
                  patch("baseAnnualReturnPct", Math.min(40, Math.max(-10, readNumber(v, 10))))
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground">
                {t("presetsTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "cdi",
                    "ipca_plus",
                    "balanced_br",
                    "equities_br",
                    "global_equities",
                    "crypto",
                  ] as ReturnPresetId[]
                ).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => applyPreset(id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors",
                      Math.abs(input.baseAnnualReturnPct - RETURN_PRESETS[id].annualReturnPct) < 0.05
                        ? "border-primary/30 bg-primary/10 text-status-warning"
                        : "border-white/12 bg-white/[0.03] text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(`preset_${id}`)}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={showReal}
                onChange={(e) => setShowReal(e.target.checked)}
                className="rounded border-white/20"
              />
              {t("showReal", {
                real: realReturnPct(input.baseAnnualReturnPct, inflationPct).toFixed(1),
                inflation: inflationPct.toFixed(1),
              })}
            </label>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <ScenarioProjectionChart
              series={bands}
              locale={locale}
              ariaLabel={t("chartAria")}
              formatValue={money}
              emptyLabel={t("chartEmpty")}
              legend={legend}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bands.map((band) => (
            <KpiCard
              key={band.id}
              title={legend[band.id]}
              rate={`${band.annualReturnPct.toFixed(1)}% ${t("perYear")}`}
              final={money(band.finalBalance)}
              interest={money(band.totalInterest)}
              accent={
                band.id === "pessimistic"
                  ? "border-status-degraded/25"
                  : band.id === "optimistic"
                    ? "border-status-live/25"
                    : "border-primary/25"
              }
            />
          ))}
          <KpiCard
            title={t("contributed")}
            rate={t("horizon", { years: input.years })}
            final={money(baseBand.totalContributed)}
            interest={t("appliedPlusInitial")}
            accent="border-white/15"
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
}

function Field({
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

function KpiCard({
  title,
  rate,
  final,
  interest,
  accent,
}: {
  title: string;
  rate: string;
  final: string;
  interest: string;
  accent: string;
}) {
  return (
    <div className={cn("rounded-2xl border bg-white/[0.02] p-4", accent)}>
      <p className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground">{rate}</p>
      <p className="mt-3 font-heading text-xl font-semibold tracking-tight text-foreground">{final}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-market-up/90">
        <TrendingUp className="size-3.5" aria-hidden />
        {interest}
      </p>
    </div>
  );
}
