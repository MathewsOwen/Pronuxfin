import { BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import {
  DossierDataConfidenceBadge,
  DossierSeloBadge,
  DossierSeloStars,
} from "@/components/market/dossier-selo-badge";
import type { DossierSeloResult } from "@/lib/analytica/selo-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const DOSSIER_SELO_NAV_ID = "dossier-selo";

type Props = {
  selo: DossierSeloResult;
  symbol: string;
};

export async function DossierSeloPanel({ selo, symbol }: Props) {
  const t = await getTranslations("AssetTerminal.selo");

  return (
    <Card
      id={DOSSIER_SELO_NAV_ID}
      className="scroll-mt-24 overflow-hidden border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
    >
      <CardHeader className="space-y-4 border-b border-white/8 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("eyebrow")}
            </p>
            <CardTitle className="font-heading text-2xl">{t("title")}</CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-relaxed">
              {t("subtitle")}
            </CardDescription>
          </div>
          <DossierSeloBadge grade={selo.grade} label={t(selo.labelKey)} size="lg" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DossierDataConfidenceBadge
            tier={selo.dataConfidence.tier}
            score={selo.dataConfidence.score}
            label={t(`confidence_${selo.dataConfidence.tier}`)}
          />
          <span className="text-xs text-muted-foreground">
            {t("compositeScore", { value: selo.compositeScore.toFixed(1) })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 pt-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
            <div className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">{t(selo.labelKey)}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(selo.summaryKey, { symbol })}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <DossierSeloStars grade={selo.grade} className="scale-125" />
              <span className="font-heading text-3xl font-semibold tabular-nums">
                {selo.grade}
                <span className="text-lg text-muted-foreground">/5</span>
              </span>
            </div>
          </div>

          {selo.rationaleKeys.length > 0 ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {selo.rationaleKeys.map((key) => (
                <li key={key} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <BarChart3 className="size-4 text-cognitive" />
            {t("pillarsTitle")}
          </div>
          <div className="space-y-3">
            {selo.pillars.map((pillar) => (
              <div key={pillar.id} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{t(pillar.labelKey)}</span>
                  <span className="font-mono tabular-nums">
                    {Math.round(pillar.score)}/{pillar.maxScore}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-primary/80 to-cognitive/80 transition-all",
                    )}
                    style={{
                      width: `${Math.max(0, Math.min(100, (pillar.score / pillar.maxScore) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="size-4 text-status-live" />
              {t("dataSourcesTitle")}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t("dataSourcesBody")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {selo.dataConfidence.sources.map((source) => (
                <span
                  key={source}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>

      <div className="border-t border-white/8 px-6 py-4 text-[11px] leading-relaxed text-muted-foreground">
        {t("disclaimer")}
      </div>
    </Card>
  );
}
