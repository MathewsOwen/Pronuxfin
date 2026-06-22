"use client";

import {
  Car,
  CreditCard,
  Home,
  Landmark,
  Sparkles,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
import {
  AMORTIZATION_SCENARIO_STORAGE_KEY,
  buildAmortizationChartSeries,
  buildAmortizationInsights,
  compareAmortizationSystems,
  computeAmortization,
  computeAmortizationSavings,
  defaultAmortizationInput,
  exportAmortizationCsv,
  normalizeAmortizationInput,
  type AmortizationInput,
  type AmortizationResult,
  type AmortizationSystem,
  type DebtKind,
} from "@/lib/tools/amortization";
import { encodeAmortizationShare } from "@/lib/tools/amortization-share";
import { cn } from "@/lib/utils";

const DEBT_KINDS: DebtKind[] = ["property", "vehicle", "personal", "creditCard", "other"];

const DEBT_ICONS: Record<DebtKind, typeof Home> = {
  property: Home,
  vehicle: Car,
  personal: Wallet,
  creditCard: CreditCard,
  other: Landmark,
};

type ViewMode = "single" | "compare";

type SavedScenario = {
  id: string;
  label: string;
  payload: AmortizationInput;
};

function readLocalScenarios(): SavedScenario[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AMORTIZATION_SCENARIO_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedScenario[];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [];
  } catch {
    return [];
  }
}

export function AmortizationCalculator({
  compact = false,
  initialInput,
}: {
  compact?: boolean;
  initialInput?: AmortizationInput;
}) {
  const t = useTranslations("Tools.amortization");
  const locale = useLocale();
  const [input, setInput] = useState<AmortizationInput>(
    () => initialInput ?? defaultAmortizationInput("property"),
  );
  const [viewMode, setViewMode] = useState<ViewMode>(compact ? "single" : "compare");
  const [showTable, setShowTable] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");
  const [saved, setSaved] = useState<SavedScenario[]>(() => readLocalScenarios());
  const [status, setStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const isCredit = input.debtKind === "creditCard";

  const result = useMemo(() => computeAmortization(input), [input]);
  const comparison = useMemo(
    () => (isCredit ? null : compareAmortizationSystems(input)),
    [input, isCredit],
  );
  const savings = useMemo(() => {
    if (input.extraMonthly <= 0 && input.lumpSum <= 0) return null;
    return computeAmortizationSavings(input);
  }, [input]);

  const activeResult =
    viewMode === "compare" && comparison
      ? comparison.cheaperSystem === "sac"
        ? comparison.sac
        : comparison.price
      : result;

  const chartSeries = useMemo(() => buildAmortizationChartSeries(activeResult), [activeResult]);
  const insights = useMemo(
    () => buildAmortizationInsights(input, activeResult, comparison),
    [input, activeResult, comparison],
  );

  function patch<K extends keyof AmortizationInput>(key: K, value: AmortizationInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function readNumber(value: string, fallback = 0) {
    const n = Number(value.replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  }

  function selectDebtKind(kind: DebtKind) {
    setInput(defaultAmortizationInput(kind));
  }

  async function handleCopyShareLink() {
    const query = encodeAmortizationShare(input);
    const url = `${window.location.origin}${window.location.pathname}?${query}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus(t("shareCopied"));
    } catch {
      setShareStatus(t("shareError"));
    }
  }

  function handleExportCsv() {
    const csv = exportAmortizationCsv(activeResult);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pronuxfin-amortizacao.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleSave() {
    const label = saveLabel.trim() || t("defaultScenarioLabel");
    const local: SavedScenario = {
      id: `local-${Date.now()}`,
      label,
      payload: input,
    };
    const next = [local, ...saved].slice(0, 3);
    setSaved(next);
    localStorage.setItem(AMORTIZATION_SCENARIO_STORAGE_KEY, JSON.stringify(next));
    setStatus(t("saveSuccessLocal"));
    setSaveLabel("");
  }

  function handleDelete(id: string) {
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    localStorage.setItem(AMORTIZATION_SCENARIO_STORAGE_KEY, JSON.stringify(next));
  }

  const money = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);

  const monthsLabel = (value: number) => t("monthsCount", { count: value });
  const percent = (value: number) =>
    new Intl.NumberFormat(locale, {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);

  return (
    <div className={cn("space-y-6", !compact && "lg:space-y-8")}>
      <div className="flex flex-wrap gap-2">
        {DEBT_KINDS.map((kind) => {
          const Icon = DEBT_ICONS[kind];
          const active = input.debtKind === kind;
          return (
            <button
              key={kind}
              type="button"
              onClick={() => selectDebtKind(kind)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-white/12 bg-white/[0.03] text-muted-foreground hover:border-white/20 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {t(`debtKinds.${kind}.label`)}
            </button>
          );
        })}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {t(`debtKinds.${input.debtKind}.hint`)}
      </p>

      {!compact && !isCredit ? (
        <div className="flex flex-wrap gap-2">
          <ModePill
            active={viewMode === "single"}
            onClick={() => setViewMode("single")}
            label={t("viewSingle")}
          />
          <ModePill
            active={viewMode === "compare"}
            onClick={() => setViewMode("compare")}
            label={t("viewCompare")}
          />
        </div>
      ) : null}

      <div className={cn("grid gap-6", compact ? "" : "xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]")}>
        <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
          <CardHeader>
            <CardTitle className="font-heading text-xl">{t("inputsTitle")}</CardTitle>
            <CardDescription>{t("inputsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label={isCredit ? t("creditBalance") : t("assetValue")}
              value={String(input.assetValue)}
              onChange={(v) => patch("assetValue", readNumber(v))}
            />
            {!isCredit ? (
              <Field
                label={t("downPayment")}
                value={String(input.downPayment)}
                onChange={(v) => patch("downPayment", readNumber(v))}
              />
            ) : null}
            <Field
              label={t("annualRate")}
              value={String(input.annualRatePercent)}
              onChange={(v) => patch("annualRatePercent", readNumber(v))}
            />
            {!isCredit ? (
              <Field
                label={t("termMonths")}
                value={String(input.termMonths)}
                onChange={(v) => patch("termMonths", Math.max(1, Math.round(readNumber(v, 1))))}
              />
            ) : null}

            {!isCredit && viewMode === "single" ? (
              <div className="sm:col-span-2">
                <Label className="text-xs text-muted-foreground">{t("system")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  <SystemPill
                    active={input.system === "sac"}
                    onClick={() => patch("system", "sac")}
                    label={t("systemSac")}
                  />
                  <SystemPill
                    active={input.system === "price"}
                    onClick={() => patch("system", "price")}
                    label={t("systemPrice")}
                  />
                </div>
              </div>
            ) : null}

            {isCredit ? (
              <div className="sm:col-span-2 space-y-3">
                <Label className="text-xs text-muted-foreground">{t("creditMode")}</Label>
                <div className="flex flex-wrap gap-2">
                  <SystemPill
                    active={input.creditPaymentMode === "minimum"}
                    onClick={() => patch("creditPaymentMode", "minimum")}
                    label={t("creditMinimum")}
                  />
                  <SystemPill
                    active={input.creditPaymentMode === "fixed"}
                    onClick={() => patch("creditPaymentMode", "fixed")}
                    label={t("creditFixed")}
                  />
                </div>
                {input.creditPaymentMode === "fixed" ? (
                  <Field
                    label={t("creditFixedValue")}
                    value={String(input.creditFixedPayment)}
                    onChange={(v) => patch("creditFixedPayment", readNumber(v))}
                  />
                ) : (
                  <Field
                    label={t("creditMinimumPercent")}
                    value={String(input.creditMinimumPercent)}
                    onChange={(v) => patch("creditMinimumPercent", readNumber(v))}
                  />
                )}
              </div>
            ) : null}

            <Field
              label={t("extraMonthly")}
              value={String(input.extraMonthly)}
              onChange={(v) => patch("extraMonthly", readNumber(v))}
            />

            {!compact ? (
              <button
                type="button"
                className="sm:col-span-2 text-left text-xs font-medium text-primary hover:underline"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                {showAdvanced ? t("hideAdvanced") : t("showAdvanced")}
              </button>
            ) : null}

            {!compact && showAdvanced ? (
              <>
                {!isCredit ? (
                  <Field
                    label={t("insuranceMonthly")}
                    value={String(input.insuranceMonthly)}
                    onChange={(v) => patch("insuranceMonthly", readNumber(v))}
                  />
                ) : null}
                <Field
                  label={t("adminFeesMonthly")}
                  value={String(input.adminFeesMonthly)}
                  onChange={(v) => patch("adminFeesMonthly", readNumber(v))}
                />
                <Field
                  label={t("iofUpfront")}
                  value={String(input.iofUpfront)}
                  onChange={(v) => patch("iofUpfront", readNumber(v))}
                />
                <Field
                  label={t("lumpSum")}
                  value={String(input.lumpSum)}
                  onChange={(v) => patch("lumpSum", readNumber(v))}
                />
                <Field
                  label={t("lumpSumMonth")}
                  value={String(input.lumpSumMonth)}
                  onChange={(v) => patch("lumpSumMonth", Math.max(1, Math.round(readNumber(v, 1))))}
                />
                {!isCredit ? (
                  <div className="sm:col-span-2">
                    <Label className="text-xs text-muted-foreground">{t("extraStrategy")}</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StrategyPill
                        active={input.extraStrategy === "reduceTerm"}
                        onClick={() => patch("extraStrategy", "reduceTerm")}
                        label={t("reduceTerm")}
                      />
                      <StrategyPill
                        active={input.extraStrategy === "reduceInstallment"}
                        onClick={() => patch("extraStrategy", "reduceInstallment")}
                        label={t("reduceInstallment")}
                      />
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            <p className="sm:col-span-2 text-xs leading-relaxed text-muted-foreground">
              {t("disclaimer")}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {savings ? (
            <div className="rounded-2xl border border-market-up/25 bg-market-up/8 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 text-market-up" aria-hidden />
                <div>
                  <p className="font-heading text-sm font-semibold text-market-up">
                    {t("savingsTitle")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("savingsBody", {
                      interest: money(savings.interestSaved),
                      months: savings.monthsSaved,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {insights.length > 0 && !compact ? (
            <div className="space-y-2">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm leading-relaxed",
                    insight.tone === "positive" && "border-market-up/25 bg-market-up/8 text-market-up",
                    insight.tone === "warning" && "border-status-warning/25 bg-status-warning/8 text-status-warning",
                    insight.tone === "neutral" && "border-white/12 bg-white/[0.03] text-muted-foreground",
                  )}
                >
                  {t(`insights.${insight.id}`)}
                </div>
              ))}
            </div>
          ) : null}

          {viewMode === "compare" && comparison && !isCredit ? (
            <ComparisonPanel
              comparison={comparison}
              money={money}
              monthsLabel={monthsLabel}
              t={t}
            />
          ) : (
            <ResultPanel result={activeResult} money={money} monthsLabel={monthsLabel} percent={percent} t={t} />
          )}

          {!compact ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleCopyShareLink()}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {t("shareCta")}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {t("exportCsv")}
              </button>
              {shareStatus ? <p className="self-center text-xs text-primary">{shareStatus}</p> : null}
            </div>
          ) : null}

          <BalanceChart series={chartSeries} label={t("chartBalance")} />
          {!compact ? (
            <StackedChart series={chartSeries} t={t} />
          ) : null}
        </div>
      </div>

      {!compact ? (
        <>
          <Card className="glass-panel border-white/12 shadow-none ring-0">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="font-heading text-base">{t("tableTitle")}</CardTitle>
                <CardDescription>{t("tableSubtitle")}</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setShowTable((v) => !v)}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                {showTable ? t("hideTable") : t("showTable")}
              </button>
            </CardHeader>
            {showTable ? (
              <CardContent className="overflow-x-auto">
                <InstallmentTable result={activeResult} money={money} t={t} />
              </CardContent>
            ) : null}
          </Card>

          <Card className="glass-panel border-white/12 shadow-none ring-0">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">{t("saveTitle")}</CardTitle>
              <CardDescription>{t("saveSubtitleGuest")}</CardDescription>
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
                  onClick={handleSave}
                  className={cn(buttonVariants({ size: "sm" }), "shrink-0")}
                >
                  {t("saveCta")}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("loginHint")}{" "}
                <Link
                  href="/login?from=%2Fferramentas%2Famortizacao"
                  className="text-primary hover:underline"
                >
                  {t("loginLink")}
                </Link>
              </p>
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
                        onClick={() => setInput(normalizeAmortizationInput(item.payload))}
                      >
                        {item.label}
                      </button>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-market-down"
                        onClick={() => handleDelete(item.id)}
                      >
                        {t("remove")}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function ResultPanel({
  result,
  money,
  monthsLabel,
  percent,
  t,
}: {
  result: AmortizationResult;
  money: (value: number) => string;
  monthsLabel: (value: number) => string;
  percent: (value: number) => string;
  t: ReturnType<typeof useTranslations<"Tools.amortization">>;
}) {
  return (
    <Card className="glass-panel card-shine border-white/12 shadow-none ring-0">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-lg">{t("resultTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <Metric label={t("totalPaid")} value={money(result.totalPaid)} />
        <Metric label={t("totalInterest")} value={money(result.totalInterest)} accent="text-market-down" />
        <Metric label={t("termResult")} value={monthsLabel(result.months)} />
        <Metric label={t("firstInstallment")} value={money(result.firstPayment)} />
        <Metric label={t("lastInstallment")} value={money(result.lastPayment)} />
        <Metric label={t("averageInstallment")} value={money(result.averagePayment)} />
        {result.cetAnnualPercent != null ? (
          <Metric label={t("cetAnnual")} value={percent(result.cetAnnualPercent)} accent="text-cognitive" />
        ) : null}
        <Metric label={t("nominalAnnual")} value={percent(result.nominalAnnualPercent)} />
        {result.totalFees > 0 ? (
          <Metric label={t("totalFees")} value={money(result.totalFees)} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function ComparisonPanel({
  comparison,
  money,
  monthsLabel,
  t,
}: {
  comparison: NonNullable<ReturnType<typeof compareAmortizationSystems>>;
  money: (value: number) => string;
  monthsLabel: (value: number) => string;
  t: ReturnType<typeof useTranslations<"Tools.amortization">>;
}) {
  const cards: Array<{
    system: AmortizationSystem;
    result: AmortizationResult;
    winner: boolean;
  }> = [
    { system: "sac", result: comparison.sac, winner: comparison.cheaperSystem === "sac" },
    { system: "price", result: comparison.price, winner: comparison.cheaperSystem === "price" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingDown className="size-3.5 text-primary" aria-hidden />
        {t("compareLead")}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ system, result, winner }) => (
          <div
            key={system}
            className={cn(
              "rounded-2xl border p-4",
              winner
                ? "border-primary/35 bg-primary/10"
                : "border-white/10 bg-white/[0.03]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading font-semibold">
                {system === "sac" ? t("systemSac") : t("systemPrice")}
              </p>
              {winner ? <Badge variant="outline">{t("cheaperBadge")}</Badge> : null}
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <Row label={t("totalInterest")} value={money(result.totalInterest)} />
              <Row label={t("termResult")} value={monthsLabel(result.months)} />
              <Row label={t("firstInstallment")} value={money(result.firstPayment)} />
              <Row label={t("lastInstallment")} value={money(result.lastPayment)} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("compareDelta", {
          interest: money(Math.abs(comparison.interestDelta)),
          system: comparison.cheaperSystem === "sac" ? t("systemSac") : t("systemPrice"),
        })}
      </p>
    </div>
  );
}

function BalanceChart({ series, label }: { series: ReturnType<typeof buildAmortizationChartSeries>; label: string }) {
  const geometry = useMemo(() => {
    if (series.length < 2) return null;
    const w = 360;
    const h = 130;
    const maxBalance = Math.max(...series.map((point) => point.balance), 1);
    const step = w / Math.max(series.length - 1, 1);
    const path = series
      .map((point, index) => {
        const x = index * step;
        const y = h - (point.balance / maxBalance) * (h - 18) - 8;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    return { path, w, h };
  }, [series]);

  return (
    <Card className="glass-panel border-white/12 shadow-none ring-0">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {geometry ? (
          <svg viewBox={`0 0 ${geometry.w} ${geometry.h}`} className="h-32 w-full text-primary" aria-hidden>
            <path d={geometry.path} fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StackedChart({
  series,
  t,
}: {
  series: ReturnType<typeof buildAmortizationChartSeries>;
  t: ReturnType<typeof useTranslations<"Tools.amortization">>;
}) {
  const bars = useMemo(() => {
    if (series.length === 0) return [];
    const sample = series.filter(
      (_, index) => index === 0 || index === series.length - 1 || index % Math.ceil(series.length / 12) === 0,
    );
    const max = Math.max(...sample.map((point) => point.principal + point.interest), 1);
    return sample.map((point) => ({
      month: point.month,
      principalPct: (point.principal / max) * 100,
      interestPct: (point.interest / max) * 100,
    }));
  }, [series]);

  return (
    <Card className="glass-panel border-white/12 shadow-none ring-0">
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base">{t("chartComposition")}</CardTitle>
        <CardDescription>{t("chartCompositionLead")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-36 items-end gap-1.5">
          {bars.map((bar) => (
            <div key={bar.month} className="flex min-w-0 flex-1 flex-col justify-end gap-0.5">
              <div
                className="rounded-t bg-market-down/70"
                style={{ height: `${bar.interestPct}%` }}
                title={t("interestSlice")}
              />
              <div
                className="rounded-b bg-primary/80"
                style={{ height: `${bar.principalPct}%` }}
                title={t("principalSlice")}
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary/80" />
            {t("principalSlice")}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-market-down/70" />
            {t("interestSlice")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function InstallmentTable({
  result,
  money,
  t,
}: {
  result: AmortizationResult;
  money: (value: number) => string;
  t: ReturnType<typeof useTranslations<"Tools.amortization">>;
}) {
  const rows = result.rows;
  const head = rows.slice(0, 6);
  const tail = rows.length > 10 ? rows.slice(-4) : rows.slice(6);

  return (
    <table className="min-w-full text-left text-xs">
      <thead className="text-muted-foreground">
        <tr>
          <th className="px-2 py-2">{t("tableMonth")}</th>
          <th className="px-2 py-2">{t("tablePayment")}</th>
          <th className="px-2 py-2">{t("tablePrincipal")}</th>
          <th className="px-2 py-2">{t("tableInterest")}</th>
          <th className="px-2 py-2">{t("tableBalance")}</th>
        </tr>
      </thead>
      <tbody>
        {head.map((row) => (
          <TableRow key={`h-${row.month}`} row={row} money={money} />
        ))}
        {rows.length > 10 ? (
          <tr>
            <td colSpan={5} className="px-2 py-2 text-center text-muted-foreground">
              …
            </td>
          </tr>
        ) : null}
        {tail.map((row) => (
          <TableRow key={`t-${row.month}`} row={row} money={money} />
        ))}
      </tbody>
    </table>
  );
}

function TableRow({
  row,
  money,
}: {
  row: AmortizationResult["rows"][number];
  money: (value: number) => string;
}) {
  return (
    <tr className="border-t border-white/8">
      <td className="px-2 py-2 tabular-nums">{row.month}</td>
      <td className="px-2 py-2 tabular-nums">{money(row.payment)}</td>
      <td className="px-2 py-2 tabular-nums">{money(row.principal)}</td>
      <td className="px-2 py-2 tabular-nums">{money(row.interest)}</td>
      <td className="px-2 py-2 tabular-nums">{money(row.balance)}</td>
    </tr>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function ModePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary/40 bg-primary/15 text-primary"
          : "border-white/12 text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SystemPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return <ModePill active={active} onClick={onClick} label={label} />;
}

function StrategyPill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return <ModePill active={active} onClick={onClick} label={label} />;
}
