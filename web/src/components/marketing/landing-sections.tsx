"use client";

import { useMessages, useTranslations } from "next-intl";
import {
  Brain,
  ChartSpline,
  Globe,
  Lock,
  Radar,
  Zap,
} from "lucide-react";
import {
  NestStaggerLi,
  NestStaggerRoot,
  RevealBlock,
  RevealCard,
  RevealOnce,
  RevealSection,
  RevealStaggerList,
} from "@/components/marketing/landing-reveal";
import { SectionHeading } from "@/components/marketing/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function IaSection() {
  const t = useTranslations("Ia");
  const messages = useMessages();
  const bullets = (messages as { Ia?: { bullets?: string[] } }).Ia?.bullets ?? [];

  return (
    <section id="ia" className="scroll-mt-24 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <RevealOnce className="glass-panel glow-ring surface-rise relative overflow-hidden rounded-3xl border-white/12 p-8 sm:p-12">
          <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/18 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 size-56 rounded-full bg-[radial-gradient(circle,oklch(0.62_0.14_265/0.2),transparent_68%)] blur-2xl" />
          <RevealSection className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <RevealBlock>
              <div>
                <SectionHeading
                  eyebrow={t("eyebrow")}
                  title={t("title")}
                  description={t("description")}
                />
                <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                  <Link
                    href="/assistant"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "inline-flex w-full justify-center sm:w-auto glow-ring px-8 active:scale-[0.98] motion-reduce:active:scale-100",
                    )}
                  >
                    {t("ctaHub")}
                  </Link>
                  <p className="max-w-md text-xs leading-relaxed text-muted-foreground">{t("ctaHint")}</p>
                </div>
              </div>
            </RevealBlock>
            <NestStaggerRoot as="ul" className="space-y-5">
              {bullets.map((line) => (
                <NestStaggerLi
                  key={line}
                  className="surface-rise flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/15 px-4 py-3"
                >
                  <Radar className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <span className="text-sm leading-relaxed text-muted-foreground">{line}</span>
                </NestStaggerLi>
              ))}
            </NestStaggerRoot>
          </RevealSection>
        </RevealOnce>
      </div>
    </section>
  );
}

export function BenefitsSection() {
  const t = useTranslations("Benefits");

  const benefits = [
    { icon: Brain, title: t("b1t"), desc: t("b1d") },
    { icon: ChartSpline, title: t("b2t"), desc: t("b2d") },
    { icon: Lock, title: t("b3t"), desc: t("b3d") },
    { icon: Globe, title: t("b4t"), desc: t("b4d") },
  ];

  return (
    <section id="beneficios" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <RevealSection className="grid gap-12 sm:grid-cols-2">
          <RevealBlock className="sm:col-span-2">
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("title")}
              description={t("description")}
            />
          </RevealBlock>
          {benefits.map((b) => (
            <RevealCard
              key={b.title}
              className="glass-panel card-shine group p-6 transition-[border-color,box-shadow] duration-300 hover:border-primary/20 hover:shadow-[inset_0_1px_0_oklch(0.88_0.06_85_/_.06)]"
            >
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20 transition-colors group-hover:bg-primary/15">
                <b.icon className="size-7" />
              </div>
              <h3 className="font-heading mt-5 text-lg font-semibold">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
            </RevealCard>
          ))}
        </RevealSection>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  const t = useTranslations("Features");
  const messages = useMessages();
  const items =
    (messages as { Features?: { items?: string[] } }).Features?.items ?? [];

  return (
    <section id="recursos" className="scroll-mt-24 px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <RevealSection className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <RevealBlock className="min-w-0 flex-1">
            <SectionHeading
              eyebrow={t("eyebrow")}
              title={t("title")}
              description={t("description")}
            />
          </RevealBlock>
          <RevealBlock tight>
            <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-status-warning/90 lg:shrink-0">
              <Zap className="size-4 text-cognitive" aria-hidden /> {t("chip")}
            </div>
          </RevealBlock>
        </RevealSection>
        <RevealStaggerList
          as="ul"
          className="mt-12 grid gap-3 sm:grid-cols-2"
        >
          {items.map((f) => (
            <NestStaggerLi
              key={f}
              className="surface-rise flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-white/[0.05]"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_12px_color-mix(in oklch, var(--primary) 18%, transparent)]" />
              {f}
            </NestStaggerLi>
          ))}
        </RevealStaggerList>
      </div>
    </section>
  );
}

export function CtaSection() {
  const t = useTranslations("Cta");

  return (
    <section className="relative px-4 py-24 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center_top,color-mix(in oklch, var(--primary) 18%, transparent),transparent_55%)]" />
        <RevealOnce className="glass-panel glow-ring surface-rise relative mx-auto max-w-4xl rounded-3xl border border-primary/25 bg-black/20 px-8 py-14 text-center shadow-[inset_0_1px_0_oklch(1_0_0/0.04)] ring-1 ring-white/[0.06] sm:px-12">
        <h2 className="font-heading text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">{t("description")}</p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-9 text-sm font-medium text-primary-foreground glow-ring shadow-[inset_0_1px_0_oklch(1_0_0/0.14)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_0_36px_color-mix(in oklch, var(--primary) 18%, transparent)] active:scale-[0.98] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
          >
            {t("primary")}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 bg-white/[0.04] px-9 text-sm font-medium backdrop-blur-md transition-[border-color,background-color,transform] hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white/[0.09] active:scale-[0.98] motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
          >
            {t("secondary")}
          </Link>
        </div>
      </RevealOnce>
    </section>
  );
}

export { SiteFooter } from "@/components/marketing/site-footer";
