"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Gauge,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { analyzeWithProfile } from "@/lib/analytica/pronuxfin-analytica-engine";
import type {
  AssetAnalysisBundle,
  AssetQualitativeInput,
  AssetQuantInput,
  PeerPciRow,
  RiskClassificationId,
  RiskProfileId,
} from "@/lib/analytica/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const DOSSIER_ANALYTICA_NAV_ID = "dossier-analytica";

const PROFILES: RiskProfileId[] = ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"];

const CLASSIFICATION_STYLES: Record<RiskClassificationId, string> = {
  ELITE_COMPOUNDER: "border-market-up/40 bg-market-up/10 text-market-up",
  QUALITY_GROWTH: "border-primary/35 bg-primary/10 text-primary",
  TURNAROUND: "border-status-warning/35 bg-status-warning/10 text-status-warning",
  CYCLICAL: "border-cognitive/35 bg-cognitive/10 text-cognitive",
  WATCHLIST: "border-white/20 bg-white/[0.06] text-muted-foreground",
  TOXIC_BOMB: "border-market-down/45 bg-market-down/12 text-market-down",
};

type Props = {
  symbol: string;
  currency: string;
  locale: string;
  inputs: { quant: AssetQuantInput; qual: AssetQualitativeInput };
  initialBundle: AssetAnalysisBundle;
  peerBundles: AssetAnalysisBundle[];
  portfolioValueBrl?: number | null;
};

function ScoreRing({
  score,
  label,
  sublabel,
  accent,
}: {
  score: number;
  label: string;
  sublabel: string;
  accent: string;
}) {
  const pct = Math.max(0, Math.min(100, score));
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative size-28">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold tabular-nums">{score.toFixed(1)}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}

function MetricBar({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono tabular-nums text-foreground">{value.toFixed(1)}/{max}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/80 to-cognitive/80 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DossierAnalyticaPanel({
  symbol,
  currency,
  locale,
  inputs,
  initialBundle,
  peerBundles,
  portfolioValueBrl,
}: Props) {
  const t = useTranslations("AssetTerminal.analytica");
  const [profile, setProfile] = useState<RiskProfileId>("MODERATE");
  const [cashInput, setCashInput] = useState("5000");

  const bundle = useMemo(() => {
    if (
      profile === "MODERATE" &&
      initialBundle.qualResult.ticker === inputs.quant.ticker
    ) {
      return initialBundle;
    }
    return analyzeWithProfile(inputs.quant, inputs.qual, profile);
  }, [profile, inputs, initialBundle]);

  const { quantResult: qr, qualResult: lr } = bundle;
  const isToxic = qr.isToxicBomb;

  const peerRows: PeerPciRow[] = useMemo(() => {
    const rows: PeerPciRow[] = [
      {
        ticker: symbol,
        pci: lr.pci,
        healthScore: qr.healthScore,
        riskClassification: qr.riskClassification,
        isSubject: true,
      },
      ...peerBundles.map((p) => ({
        ticker: p.qualResult.ticker,
        pci: p.qualResult.pci,
        healthScore: p.quantResult.healthScore,
        riskClassification: p.quantResult.riskClassification,
        isSubject: false,
      })),
    ];
    return rows.sort((a, b) => b.pci - a.pci);
  }, [symbol, lr, qr, peerBundles]);

  const maxPeerPci = Math.max(...peerRows.map((r) => r.pci), 1);
  const cashAmount = Math.max(0, Number.parseFloat(cashInput.replace(",", ".")) || 0);
  const positionValue = portfolioValueBrl ?? 0;
  const suggestedTopUp =
    !isToxic && lr.pci > 0 && cashAmount > 0
      ? (lr.pci / Math.max(peerRows.reduce((s, r) => s + r.pci, 0), lr.pci)) * cashAmount
      : 0;

  const classLabel = (id: RiskClassificationId) =>
    t(`classification_${id}` as "classification_ELITE_COMPOUNDER");

  return (
    <Card
      id={DOSSIER_ANALYTICA_NAV_ID}
      className="glass-panel card-shine scroll-mt-24 overflow-hidden border-primary/25 bg-[linear-gradient(145deg,rgba(45,212,191,0.06),rgba(255,255,255,0.02))] shadow-[0_0_60px_rgba(45,212,191,0.06)]"
    >
      <CardHeader className="border-b border-white/10 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/30 bg-primary/10 font-mono text-[10px] uppercase tracking-wider text-primary">
                <Sparkles className="mr-1 size-3" aria-hidden />
                {t("eyebrow")}
              </Badge>
              <Badge variant="outline" className="border-white/15 text-[10px] text-muted-foreground">
                V2.0-ULTRA
              </Badge>
            </div>
            <CardTitle className="font-heading mt-3 text-2xl md:text-3xl">{t("title")}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-relaxed">
              {t("subtitle")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROFILES.map((p) => (
              <Button
                key={p}
                type="button"
                size="sm"
                variant={profile === p ? "default" : "outline"}
                className={cn(
                  "rounded-full font-mono text-[10px] uppercase tracking-wider",
                  profile !== p && "border-white/15",
                )}
                onClick={() => setProfile(p)}
              >
                {t(`profile_${p}` as "profile_MODERATE")}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-8">
        {isToxic ? (
          <div className="flex items-start gap-3 rounded-2xl border border-market-down/35 bg-market-down/10 p-4">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-market-down" aria-hidden />
            <div>
              <p className="font-semibold text-market-down">{t("toxicTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("toxicBody")}</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="flex flex-wrap justify-around gap-6 rounded-2xl border border-white/10 bg-black/25 p-6">
            <ScoreRing
              score={lr.pci}
              label={t("pciLabel")}
              sublabel={t("pciHint")}
              accent="var(--primary)"
            />
            <ScoreRing
              score={qr.healthScore}
              label={t("sqLabel")}
              sublabel={t("sqHint")}
              accent="var(--market-up)"
            />
            <ScoreRing
              score={lr.qualitativeScore}
              label={t("slLabel")}
              sublabel={t("slHint")}
              accent="var(--cognitive)"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("font-mono text-[10px] uppercase", CLASSIFICATION_STYLES[qr.riskClassification])}>
                {classLabel(qr.riskClassification)}
              </Badge>
              {qr.debtPenalty > 0 ? (
                <Badge variant="outline" className="border-status-warning/30 text-[10px] text-status-warning">
                  {t("debtPenalty", { value: qr.debtPenalty.toFixed(1) })}
                </Badge>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricBar label={t("qualPerenniality")} value={inputs.qual.sectorPerenniality} />
              <MetricBar label={t("qualGovernance")} value={inputs.qual.governanceScore} />
              <MetricBar label={t("qualMoat")} value={inputs.qual.competitiveMoat} />
              <MetricBar label={t("qualExecution")} value={inputs.qual.managementExecution} />
            </div>

            {qr.diagnostics.length > 0 ? (
              <ul className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-muted-foreground">
                {qr.diagnostics.map((d) => (
                  <li key={d} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 size-3 shrink-0 text-status-warning" aria-hidden />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-market-up">{t("noDiagnostics")}</p>
            )}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-primary" aria-hidden />
            <h3 className="font-heading text-lg font-semibold">{t("peerTitle")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t("peerSubtitle")}</p>
          <div className="space-y-2">
            {peerRows.map((row) => (
              <div
                key={row.ticker}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
                  row.isSubject
                    ? "border-primary/35 bg-primary/5"
                    : "border-white/10 bg-white/[0.02]",
                )}
              >
                {row.isSubject ? (
                  <span className="font-mono text-sm font-semibold text-primary">{row.ticker}</span>
                ) : (
                  <Link
                    href={`/ativo/${row.ticker}`}
                    className="font-mono text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {row.ticker}
                  </Link>
                )}
                <div className="min-w-[120px] flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        row.isSubject ? "bg-primary" : "bg-cognitive/70",
                      )}
                      style={{ width: `${(row.pci / maxPeerPci) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-sm tabular-nums text-foreground">
                  PCI {row.pci.toFixed(1)}
                </span>
                <Badge
                  variant="outline"
                  className={cn("text-[9px] uppercase", CLASSIFICATION_STYLES[row.riskClassification])}
                >
                  {classLabel(row.riskClassification)}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/20 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Target className="size-4 text-cognitive" aria-hidden />
                <h3 className="font-heading text-lg font-semibold">{t("apportionTitle")}</h3>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t("apportionSubtitle")}</p>
            </div>
            <div className="w-full max-w-xs space-y-1">
              <Label htmlFor="analytica-cash" className="text-xs text-muted-foreground">
                {t("cashLabel")}
              </Label>
              <Input
                id="analytica-cash"
                type="number"
                min={0}
                step={100}
                value={cashInput}
                onChange={(e) => setCashInput(e.target.value)}
                className="border-white/15 bg-black/30 font-mono tabular-nums"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-muted-foreground">{t("suggestedAllocation")}</p>
              <p className="font-heading mt-1 text-xl font-semibold tabular-nums">
                {formatMoney(suggestedTopUp, currency, locale)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-muted-foreground">{t("positionInPortfolio")}</p>
              <p className="font-heading mt-1 text-xl font-semibold tabular-nums">
                {formatMoney(positionValue, currency, locale)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs text-muted-foreground">{t("targetWeight")}</p>
              <p className="font-heading mt-1 text-xl font-semibold tabular-nums">
                {isToxic
                  ? "—"
                  : `${((lr.pci / Math.max(peerRows.reduce((s, r) => s + r.pci, 0), lr.pci)) * 100).toFixed(1)}%`}
              </p>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Brain className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            {t("apportionDisclaimer")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/carteira?symbol=${encodeURIComponent(symbol)}`}>
              <Button size="sm" variant="default" className="gap-2">
                <TrendingUp className="size-4" aria-hidden />
                {t("ctaPortfolio")}
              </Button>
            </Link>
            <Link href={`/assistant?channel=equities&open=1`}>
              <Button size="sm" variant="outline" className="gap-2 border-white/15">
                <Gauge className="size-4" aria-hidden />
                {t("ctaAi")}
              </Button>
            </Link>
          </div>
        </section>

        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </CardContent>
    </Card>
  );
}

function formatMoney(value: number, currency: string, locale: string): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.length === 3 ? currency : "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return value.toFixed(0);
  }
}
