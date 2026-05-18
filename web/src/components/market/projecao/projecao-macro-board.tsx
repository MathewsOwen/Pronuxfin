"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDownRight,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjecaoMacroNewsRail } from "@/components/market/projecao/projecao-macro-news-rail";
import { cn } from "@/lib/utils";

type Bias = "alta" | "baixa";

export function ProjecaoMacroBoard() {
  const [bias, setBias] = useState<Bias>("alta");
  const t = useTranslations("ProjecaoHub");

  const bullPoints = t.raw("bullPoints") as string[];
  const bearPoints = t.raw("bearPoints") as string[];
  const drivers = t.raw(bias === "alta" ? "bullDrivers" : "bearDrivers") as Array<{
    title: string;
    impact: string;
    assets: string;
  }>;
  const activePoints = bias === "alta" ? bullPoints : bearPoints;

  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
            {t("boardEyebrow")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{t("boardLead")}</p>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-black/30 p-1 font-mono text-[11px]">
          <BiasButton active={bias === "alta"} onClick={() => setBias("alta")} up>
            {t("biasHigh")}
          </BiasButton>
          <BiasButton active={bias === "baixa"} onClick={() => setBias("baixa")} up={false}>
            {t("biasLow")}
          </BiasButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div
          className={cn(
            "card-shine rounded-2xl border p-6 sm:p-8 shadow-[inset_0_1px_0_oklch(1_0_0/0.04)]",
            bias === "alta"
              ? "border-status-live/25 bg-status-live/10"
              : "border-status-degraded/25 bg-status-degraded/10",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                "border font-mono text-[10px] uppercase tracking-wider",
                bias === "alta"
                  ? "border-status-live/40 text-market-up"
                  : "border-market-down/40 text-market-down",
              )}
            >
              {bias === "alta" ? t("checklistBull") : t("checklistBear")}
            </Badge>
            <span className="text-xs text-muted-foreground">{t("checklistHint")}</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
            {activePoints.map((item, idx) => (
              <li key={item} className="flex gap-3">
                <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] font-mono text-[10px] text-muted-foreground">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/25 p-6">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-cognitive/80" aria-hidden />
            <h3 className="font-heading text-base font-semibold">{t("driversTitle")}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{t("driversSubtitle")}</p>
          <div className="mt-4 space-y-3">
            {drivers.map((d) => (
              <div
                key={d.title}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{d.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                      bias === "alta"
                        ? "bg-market-up/15 text-market-up"
                        : "bg-market-down/15 text-market-down",
                    )}
                  >
                    {d.impact}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{d.assets}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProjecaoMacroNewsRail />
    </section>
  );
}

function BiasButton({
  active,
  onClick,
  up,
  children,
}: {
  active: boolean;
  onClick: () => void;
  up: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-4 py-2 transition-colors",
        active
          ? up
            ? "bg-market-up/20 text-market-up ring-1 ring-market-up/35"
            : "bg-market-down/15 text-market-down ring-1 ring-market-down/35"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {up ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
      {children}
    </button>
  );
}
