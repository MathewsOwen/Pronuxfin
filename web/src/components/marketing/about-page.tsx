"use client";

import {
  Compass,
  Globe2,
  HeartHandshake,
  Rocket,
  Shield,
  Sparkles,
  Target,
  Telescope,
} from "lucide-react";
import { useMessages, useTranslations } from "next-intl";
import {
  NestStaggerLi,
  NestStaggerRoot,
  RevealBlock,
  RevealCard,
  RevealOnce,
  RevealSection,
} from "@/components/marketing/landing-reveal";
import { SectionEyebrow, SectionHeading } from "@/components/marketing/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type TimelineItem = { phase: string; title: string; description: string };
type PillarItem = { title: string; description: string };
type RoadmapItem = { horizon: string; title: string; description: string };

const PILLAR_ICONS = [Target, Shield, HeartHandshake, Globe2] as const;
const ROADMAP_ICONS = [Rocket, Telescope, Sparkles, Compass] as const;

export function AboutPage() {
  const t = useTranslations("AboutPage");
  const messages = useMessages();
  const about = (messages as { AboutPage?: Record<string, unknown> }).AboutPage ?? {};

  const timeline = (about.timeline as TimelineItem[] | undefined) ?? [];
  const pillars = (about.pillars as PillarItem[] | undefined) ?? [];
  const roadmap = (about.roadmap as RoadmapItem[] | undefined) ?? [];

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <RevealOnce className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-8 sm:p-12 lg:p-14">
        <div
          className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_68%)] blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-16 size-72 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.16_265/0.18),transparent_68%)] blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <SectionEyebrow>{t("eyebrow")}</SectionEyebrow>
          <h1 className="font-heading mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("heroLead")}
          </p>
        </div>
      </RevealOnce>

      {/* Origin */}
      <RevealSection className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <RevealBlock>
          <SectionHeading
            eyebrow={t("originEyebrow")}
            title={t("originTitle")}
            description={t("originLead")}
          />
        </RevealBlock>
        <RevealBlock className="glass-panel rounded-2xl border-white/10 p-6 sm:p-8">
          <p className="text-pretty text-sm leading-[1.85] text-muted-foreground sm:text-[0.9375rem]">
            {t("originBody")}
          </p>
          <p className="mt-5 text-pretty text-sm leading-[1.85] text-muted-foreground sm:text-[0.9375rem]">
            {t("originBody2")}
          </p>
        </RevealBlock>
      </RevealSection>

      {/* Timeline */}
      <section className="mt-20" aria-labelledby="about-journey-title">
        <RevealSection>
          <RevealBlock className="mb-10">
            <SectionHeading
              eyebrow={t("journeyEyebrow")}
              title={t("journeyTitle")}
              description={t("journeyLead")}
            />
          </RevealBlock>
          <NestStaggerRoot
            as="ol"
            className="relative space-y-0 border-l border-primary/25 pl-8 sm:pl-10"
          >
            {timeline.map((item, index) => (
              <NestStaggerLi key={item.phase} className="relative pb-10 last:pb-0">
                <span
                  className="absolute -left-[2.125rem] top-1 flex size-4 items-center justify-center rounded-full border border-primary/40 bg-background ring-4 ring-background sm:-left-[2.375rem]"
                  aria-hidden
                >
                  <span className="size-1.5 rounded-full bg-primary" />
                </span>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                  {item.phase}
                </p>
                <h2
                  id={index === 0 ? "about-journey-title" : undefined}
                  className="font-heading mt-1.5 text-lg font-semibold tracking-tight sm:text-xl"
                >
                  {item.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </NestStaggerLi>
            ))}
          </NestStaggerRoot>
        </RevealSection>
      </section>

      {/* Pillars */}
      <section className="mt-20" aria-labelledby="about-mission-title">
        <RevealSection>
          <RevealBlock className="mb-10 sm:col-span-2">
            <SectionHeading
              eyebrow={t("missionEyebrow")}
              title={t("missionTitle")}
              description={t("missionLead")}
            />
          </RevealBlock>
          <div className="grid gap-5 sm:grid-cols-2">
            {pillars.map((pillar, index) => {
              const Icon = PILLAR_ICONS[index] ?? Target;
              return (
                <RevealCard
                  key={pillar.title}
                  className="glass-panel card-shine group p-6 transition-[border-color,box-shadow] duration-300 hover:border-primary/20"
                >
                  <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                    <Icon className="size-6" aria-hidden />
                  </div>
                  <h3
                    id={index === 0 ? "about-mission-title" : undefined}
                    className="font-heading mt-4 text-lg font-semibold"
                  >
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </RevealCard>
              );
            })}
          </div>
        </RevealSection>
      </section>

      {/* Roadmap */}
      <section className="mt-20" aria-labelledby="about-future-title">
        <RevealOnce className="glass-panel glow-ring relative overflow-hidden rounded-3xl border-white/12 p-8 sm:p-10">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
            aria-hidden
          />
          <RevealSection>
            <RevealBlock className="mb-10">
              <SectionHeading
                eyebrow={t("futureEyebrow")}
                title={t("futureTitle")}
                description={t("futureLead")}
              />
            </RevealBlock>
            <div className="grid gap-4 lg:grid-cols-2">
              {roadmap.map((item, index) => {
                const Icon = ROADMAP_ICONS[index] ?? Rocket;
                return (
                  <RevealCard
                    key={item.title}
                    className="rounded-2xl border border-white/[0.08] bg-black/20 p-5 sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-cognitive/10 p-2 text-cognitive ring-1 ring-cognitive/25">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cognitive">
                          {item.horizon}
                        </p>
                        <h3
                          id={index === 0 ? "about-future-title" : undefined}
                          className="font-heading mt-1 text-base font-semibold sm:text-lg"
                        >
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </RevealCard>
                );
              })}
            </div>
          </RevealSection>
        </RevealOnce>
      </section>

      {/* Closing CTA */}
      <RevealOnce className="mt-20 rounded-2xl border border-primary/25 bg-primary/[0.06] px-6 py-10 text-center sm:px-10 sm:py-12">
        <h2 className="font-heading text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("closingTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          {t("closingLead")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "glow-ring w-full sm:w-auto px-8 active:scale-[0.98] motion-reduce:active:scale-100",
            )}
          >
            {t("ctaPrimary")}
          </Link>
          <Link
            href="/bolsa"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "w-full border-white/15 sm:w-auto",
            )}
          >
            {t("ctaSecondary")}
          </Link>
        </div>
      </RevealOnce>
    </div>
  );
}
