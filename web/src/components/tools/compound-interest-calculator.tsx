"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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
import {
  COMPOUND_SCENARIO_STORAGE_KEY,
  computeCompoundInterest,
  type CompoundInterestInput,
  type CompoundScenarioPayload,
} from "@/lib/tools/compound-interest";
import { cn } from "@/lib/utils";

const DEFAULT_INPUT: CompoundInterestInput = {
  initial: 10000,
  monthlyContribution: 500,
  annualRatePercent: 10,
  years: 10,
  frequency: "monthly",
};

type SavedScenario = {
  id: string;
  label: string;
  payload: CompoundScenarioPayload;
  updatedAt?: string;
};

function readLocalSavedScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPOUND_SCENARIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedScenario[];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function CompoundInterestCalculator({
  loggedIn = false,
  compact = false,
}: {
  loggedIn?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("Tools.compound");
  const locale = useLocale();
  const [input, setInput] = useState<CompoundInterestInput>(DEFAULT_INPUT);
  const [saved, setSaved] = useState<SavedScenario[]>(() =>
    loggedIn ? [] : readLocalSavedScenarios(),
  );
  const [saveLabel, setSaveLabel] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const result = useMemo(() => computeCompoundInterest(input), [input]);

  const loadSaved = useCallback(async () => {
    if (loggedIn) {
      try {
        const res = await fetch("/api/user/compound-scenarios");
        if (!res.ok) return;
        const json = (await res.json()) as {
          ok: boolean;
          items?: SavedScenario[];
        };
        if (json.ok && json.items) setSaved(json.items);
      } catch {
        /* ignore */
      }
      return;
    }
    setSaved(readLocalSavedScenarios());
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/user/compound-scenarios");
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          ok: boolean;
          items?: SavedScenario[];
        };
        if (!cancelled && json.ok && json.items) setSaved(json.items);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loggedIn]);

  function patch<K extends keyof CompoundInterestInput>(
    key: K,
    value: CompoundInterestInput[K],
  ) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function readNumber(value: string, fallback = 0) {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  async function handleSave() {
    const label = saveLabel.trim() || t("defaultScenarioLabel");
    const payload: CompoundScenarioPayload = { ...input, label };

    if (loggedIn) {
      const res = await fetch("/api/user/compound-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, payload: input }),
      });
      if (!res.ok) {
        setStatus(t("saveError"));
        return;
      }
      setStatus(t("saveSuccess"));
      setSaveLabel("");
      await loadSaved();
      return;
    }

    const local: SavedScenario = {
      id: `local-${Date.now()}`,
      label,
      payload,
    };
    const next = [local, ...saved].slice(0, 3);
    setSaved(next);
    localStorage.setItem(COMPOUND_SCENARIO_STORAGE_KEY, JSON.stringify(next));
    setStatus(t("saveSuccessLocal"));
    setSaveLabel("");
  }

  async function handleDelete(id: string) {
    if (loggedIn) {
      await fetch("/api/user/compound-scenarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await loadSaved();
      return;
    }
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    localStorage.setItem(COMPOUND_SCENARIO_STORAGE_KEY, JSON.stringify(next));
  }

  function applyScenario(payload: CompoundScenarioPayload) {
    setInput({
      initial: payload.initial,
      monthlyContribution: payload.monthlyContribution,
      annualRatePercent: payload.annualRatePercent,
      years: payload.years,
      frequency: payload.frequency,
    });
  }

  const chartPoints = useMemo(() => {
    const series = result.series;
    if (series.length < 2) return null;
    const max = Math.max(...series.map((p) => p.balance));
    const w = 320;
    const h = 120;
    const step = w / Math.max(series.length - 1, 1);
    const path = series
      .map((p, i) => {
        const x = i * step;
        const y = h - (p.balance / max) * (h - 16) - 8;
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    return { path, w, h };
  }, [result.series]);

  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className={cn("grid gap-6", compact ? "" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]")}>
      <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
        <CardHeader>
          <CardTitle className="font-heading">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("initial")}
            value={String(input.initial)}
            onChange={(v) => patch("initial", readNumber(v))}
          />
          <Field
            label={t("monthly")}
            value={String(input.monthlyContribution)}
            onChange={(v) => patch("monthlyContribution", readNumber(v))}
          />
          <Field
            label={t("rate")}
            value={String(input.annualRatePercent)}
            onChange={(v) => patch("annualRatePercent", readNumber(v))}
          />
          <Field
            label={t("years")}
            value={String(input.years)}
            onChange={(v) => patch("years", readNumber(v))}
          />
          <p className="sm:col-span-2 text-xs leading-relaxed text-muted-foreground">
            {t("disclaimer")}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">{t("resultTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chartPoints ? (
              <svg
                viewBox={`0 0 ${chartPoints.w} ${chartPoints.h}`}
                className="h-28 w-full text-primary"
                aria-hidden
              >
                <path
                  d={chartPoints.path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label={t("finalBalance")} value={money(result.finalBalance)} />
              <Metric label={t("contributed")} value={money(result.totalContributed)} />
              <Metric
                label={t("interest")}
                value={money(result.totalInterest)}
                accent="text-emerald-400"
              />
            </div>
          </CardContent>
        </Card>

        {!compact ? (
          <Card className="glass-panel border-white/12 shadow-none ring-0">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">{t("saveTitle")}</CardTitle>
              <CardDescription>
                {loggedIn ? t("saveSubtitleLogged") : t("saveSubtitleGuest")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder={t("savePlaceholder")}
                  className="border-white/15 bg-black/20"
                />
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
                >
                  {t("saveCta")}
                </button>
              </div>
              {!loggedIn ? (
                <p className="text-xs text-muted-foreground">
                  {t("loginHint")}{" "}
                  <Link
                    href="/login?from=%2Fferramentas%2Fjuros-compostos"
                    className="text-primary hover:underline"
                  >
                    {t("loginLink")}
                  </Link>
                </p>
              ) : null}
              {status ? <p className="text-xs text-primary">{status}</p> : null}
              {saved.length > 0 ? (
                <ul className="space-y-2">
                  {saved.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <button
                        type="button"
                        className="text-left hover:text-primary"
                        onClick={() => applyScenario(item.payload)}
                      >
                        {item.label}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-rose-400"
                        onClick={() => void handleDelete(item.id)}
                      >
                        {t("remove")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 border-white/15 bg-black/20"
      />
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-heading text-lg font-semibold tabular-nums", accent)}>{value}</p>
    </div>
  );
}
