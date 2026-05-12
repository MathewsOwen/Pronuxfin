"use client";

import { useMessages, useTranslations } from "next-intl";
import { Cpu, Landmark, Layers } from "lucide-react";
import {
  NestStaggerLi,
  NestStaggerRoot,
  RevealBlock,
  RevealSection,
} from "@/components/marketing/landing-reveal";
import { SectionEyebrow } from "@/components/marketing/section-heading";

type RibbonItem = {
  title: string;
  body: string;
};

const ICONS = [Landmark, Layers, Cpu] as const;

export function InstitutionalRibbon() {
  const t = useTranslations("InstitutionalRibbon");
  const messages = useMessages();
  const items = (
    messages as {
      InstitutionalRibbon?: { items?: RibbonItem[] };
    }
  ).InstitutionalRibbon?.items ?? [];

  return (
    <section
      aria-labelledby="ribbon-title"
      className="relative border-b border-white/[0.06] bg-black/20 px-4 py-12 sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] terminal-grid-bg" />

      <div className="relative mx-auto max-w-6xl">
        <RevealSection className="mb-10 max-w-2xl">
          <RevealBlock tight>
            <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
            <h2
              id="ribbon-title"
              className="font-heading mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
            >
              {t("title")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("lead")}</p>
          </RevealBlock>
        </RevealSection>

        <NestStaggerRoot as="ul" className="grid list-none gap-4 p-0 md:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]!;
            return (
              <NestStaggerLi key={item.title} className="min-w-0">
                <article className="surface-rise h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 ring-1 ring-white/[0.03]">
                  <Icon className="size-5 text-amber-400/90" aria-hidden />
                  <p className="font-heading mt-3 text-base font-semibold tracking-tight text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </article>
              </NestStaggerLi>
            );
          })}
        </NestStaggerRoot>
      </div>
    </section>
  );
}
