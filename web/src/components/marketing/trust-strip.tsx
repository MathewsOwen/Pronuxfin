"use client";

import {
  BrainCircuit,
  Fingerprint,
  Glasses,
  Scale,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  NestStaggerRoot,
  RevealBlock,
  RevealSection,
} from "@/components/marketing/landing-reveal";
import { SectionEyebrow } from "@/components/marketing/section-heading";
import { cn } from "@/lib/utils";

export function TrustStrip() {
  const t = useTranslations("Trust");

  const items = [
    { icon: Scale, label: t("symmetryTitle"), hint: t("symmetryHint") },
    { icon: ShieldCheck, label: t("securityTitle"), hint: t("securityHint") },
    { icon: Zap, label: t("perfTitle"), hint: t("perfHint") },
    { icon: BrainCircuit, label: t("aiTitle"), hint: t("aiHint") },
  ];

  return (
    <section className="relative border-y border-border bg-zinc-950/40 px-4 py-12 backdrop-blur-sm sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] terminal-grid-bg" />

      <RevealSection className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <RevealBlock className="max-w-md lg:pt-1">
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>

          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {t.rich("lead", {
              highlight: (chunks) => (
                <span className="font-medium text-foreground">{chunks}</span>
              ),
            })}
          </p>

          <div className="mt-5 flex items-start gap-2 text-xs text-muted-foreground">
            <Glasses className="mt-0.5 size-4 shrink-0 text-primary/80" aria-hidden />
            <span>{t("glassesNote")}</span>
          </div>
        </RevealBlock>

        <NestStaggerRoot as="div" className="grid flex-1 gap-5 sm:grid-cols-2">
          {items.map(({ icon: Icon, label, hint }) => (
            <RevealBlock
              key={label}
              tight
              className="surface-rise rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-4 ring-1 ring-white/[0.03]"
            >
              <div className="flex items-center gap-2 text-foreground">
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    label === t("aiTitle") ? "text-cognitive" : "text-primary/80",
                  )}
                  aria-hidden
                />
                <span className="text-sm font-semibold">{label}</span>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
            </RevealBlock>
          ))}
        </NestStaggerRoot>
      </RevealSection>

      <div className="relative mx-auto mt-10 flex max-w-6xl items-center justify-center gap-2 border-t border-white/[0.06] pt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        <Fingerprint className="size-3.5 text-primary/70" aria-hidden />
        {t("footerRail")}
      </div>
    </section>
  );
}
