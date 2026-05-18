"use client";

import { useTranslations } from "next-intl";
import { Bitcoin, Landmark, ShieldCheck } from "lucide-react";
import {
  NestStaggerRoot,
  RevealBlock,
  RevealSection,
} from "@/components/marketing/landing-reveal";

export function CryptoCoverageSection() {
  const t = useTranslations("CryptoCoverage");

  return (
    <section id="cobertura" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <RevealSection className="grid gap-10 rounded-3xl border border-white/10 bg-black/20 p-8 sm:p-10 lg:grid-cols-[1fr_minmax(0,1.15fr)] lg:gap-14">
          <RevealBlock className="space-y-4 border-l-[3px] border-cognitive/40 pl-5">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.26em] text-cognitive/95">
              {t("eyebrow")}
            </p>
            <h2 className="font-heading text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("titleLead")}{" "}
              <span className="text-gradient-brand">{t("titleAccent")}</span>
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {t.raw("pairChips").map((pair: string) => (
                <span
                  key={pair}
                  className="rounded-full border border-cognitive/30 bg-cognitive/12 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-wider text-cognitive/95"
                >
                  {pair}
                </span>
              ))}
            </div>
          </RevealBlock>

          <NestStaggerRoot as="div" className="grid gap-4 sm:grid-cols-3">
            <RevealBlock tight className="surface-rise rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <Landmark className="size-5 text-muted-foreground" aria-hidden />
              <h3 className="font-heading mt-3 text-sm font-semibold">{t("p1Title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("p1Body")}</p>
            </RevealBlock>
            <RevealBlock tight className="surface-rise rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <Bitcoin className="size-5 text-cognitive/90" aria-hidden />
              <h3 className="font-heading mt-3 text-sm font-semibold">{t("p2Title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("p2Body")}</p>
            </RevealBlock>
            <RevealBlock tight className="surface-rise rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <ShieldCheck className="size-5 text-market-up/85" aria-hidden />
              <h3 className="font-heading mt-3 text-sm font-semibold">{t("p3Title")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{t("p3Body")}</p>
            </RevealBlock>
          </NestStaggerRoot>
        </RevealSection>
      </div>
    </section>
  );
}
