"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BookMarked, Scale } from "lucide-react";
import {
  DEFAULT_WEALTH_INPUT,
  ProjecaoWealthDesk,
} from "@/components/market/projecao/projecao-wealth-desk";
import { ProjecaoGoalPanel } from "@/components/market/projecao/projecao-goal-panel";
import { ProjecaoMarketPulse } from "@/components/market/projecao/projecao-market-pulse";
import { ProjecaoMacroBoard } from "@/components/market/projecao/projecao-macro-board";
import { ProjecaoSensitivityPanel } from "@/components/market/projecao/projecao-sensitivity-panel";
import { buttonVariants } from "@/components/ui/button";
import type { WealthProjectionInput } from "@/lib/projecao/scenario-projection";
import { cn } from "@/lib/utils";

export function ProjecaoHub({ loggedIn = false }: { loggedIn?: boolean }) {
  const t = useTranslations("ProjecaoHub");
  const [wealthInput, setWealthInput] = useState<WealthProjectionInput>(DEFAULT_WEALTH_INPUT);

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="surface-rise card-shine relative overflow-hidden rounded-3xl border border-border bg-zinc-950/55 p-8 sm:p-10">
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] terminal-grid-bg" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
        <div className="relative max-w-3xl space-y-4 border-l-[3px] border-primary/40 pl-5">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.12]">
            {t("h1Lead")}{" "}
            <span className="text-gradient-brand">{t("h1Accent")}</span>
          </h1>
          <p className="max-w-3xl text-muted-foreground leading-relaxed">{t("lead")}</p>
          <p className="text-sm text-muted-foreground">{t("leadDetail")}</p>
        </div>
      </header>

      <div className="glass-panel card-shine mt-8 rounded-2xl border border-status-degraded/25 bg-status-degraded/10 p-4 text-xs leading-relaxed text-muted-foreground">
        <div className="flex gap-3">
          <Scale className="mt-0.5 size-4 shrink-0 text-market-down" aria-hidden />
          <div className="space-y-2">
            <p className="font-medium text-foreground">{t("warnTitle")}</p>
            <p>{t("warnBody")}</p>
          </div>
        </div>
      </div>

      <div className="mt-10 space-y-10">
        <ProjecaoMarketPulse />
        <ProjecaoWealthDesk input={wealthInput} onInputChange={setWealthInput} />
        <ProjecaoSensitivityPanel input={wealthInput} />
        <ProjecaoGoalPanel loggedIn={loggedIn} />
        <ProjecaoMacroBoard />
      </div>

      <section className="surface-rise card-shine mt-12 rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <BookMarked className="size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-3">
            <h3 className="font-heading text-lg font-semibold tracking-tight">{t("roadmapTitle")}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("roadmapBody")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "gap-2")}>
                {t("ctaRegister")}
              </Link>
              <Link
                href="/bolsa"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/15 bg-transparent",
                )}
              >
                {t("ctaLiveDesk")}
              </Link>
              <Link
                href="/ferramentas/juros-compostos"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "border-white/15")}
              >
                {t("ctaCompound")}
              </Link>
              {loggedIn ? (
                <Link
                  href="/rota"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
                >
                  {t("ctaRoute")}
                </Link>
              ) : (
                <Link
                  href="/login?from=%2Feducation"
                  className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}
                >
                  {t("ctaEducation")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <p className="mx-auto mt-12 max-w-3xl text-center text-[11px] leading-relaxed text-muted-foreground">
        {t("deployFoot")}
      </p>
    </div>
  );
}
